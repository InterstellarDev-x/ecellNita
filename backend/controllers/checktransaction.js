const logger=require("../utils/logger");
const {mailsender}=require("../utils/SendMail");
const {checktransactiontemplate}=require("../mailtemplates/Checktransaction");
require("dotenv").config();
const otpgenerator=require("otp-generator");
const bcrypt=require("bcrypt");
const mongoose=require("mongoose");
const Checktransaction=require("../models/Checktransaction");
const Product=require("../models/Product");
const Request=require("../models/Request");
const Shedule=require("../models/Shedule");
const CompletedTransaction=require("../models/CompletedTransaction");
const Notification=require("../models/Notification");



exports.sendtransotp=async (req,res)=>{
    try{
        const {id}=req.user;
        const {requestid}=req.body;
        if(!mongoose.Types.ObjectId.isValid(requestid)){
            return res.status(400).json({
                success:false,
                message:"A valid request id is required"
            })
        }

        const request=await Request.findOne({_id:requestid,seller:id})
            .populate("buyer","email")
            .populate("product","productname status quantity publicationStatus");
        if(!request){
            return res.status(404).json({
                success:false,
                message:"Buyer request not found"
            })
        }
        if(!request.buyer?.email || !request.product){
            return res.status(409).json({
                success:false,
                message:"This request can no longer be completed"
            })
        }
        if(request.product.publicationStatus!=="published" || request.product.status!=="Forsale" || request.product.quantity<request.quantity){
            return res.status(409).json({
                success:false,
                message:"The requested quantity is no longer available"
            })
        }
        const scheduled=await Shedule.exists({
            requestid:request._id,
            $or:[{status:"confirmed"},{status:{$exists:false}}]
        });
        if(!scheduled){
            return res.status(409).json({success:false,message:"Both participants must confirm the meeting before sending the transaction OTP"});
        }

        const otp=otpgenerator.generate(6,{
            upperCaseAlphabets:false,
            lowerCaseAlphabets:false,
            specialChars:false,
        })
        const otpHash=await bcrypt.hash(otp,10);
        await Checktransaction.findOneAndUpdate(
            {requestid:request._id,buyer:request.buyer._id},
            {
                requestid:request._id,
                buyer:request.buyer._id,
                seller:id,
                productid:request.product._id,
                otpHash,
                failedAttempts:0,
                processing:false,
                expiresAt:new Date(Date.now()+5*60*1000),
            },
            {upsert:true,new:true,setDefaultsOnInsert:true}
        );

        try{
            await mailsender(
                request.buyer.email,
                "Transaction Verification OTP",
                checktransactiontemplate(request.product.productname,otp)
            );
        }catch(mailError){
            await Checktransaction.deleteOne({requestid:request._id,buyer:request.buyer._id});
            throw mailError;
        }

        res.json({
            success:true,
            message:"OTP sent successfully",
        })


    }
    catch(err){
        logger.error(err);
        logger.error("Cannot send OTP");
        return res.json({
            success:false,
            message:"could not send OTP",
        })
    }
}



exports.verifytransotp=async (req,res)=>{
    try{
        const {id}=req.user;
        const {requestid,otp}=req.body;
        if(!mongoose.Types.ObjectId.isValid(requestid) || !/^\d{6}$/.test(String(otp||""))){
            return res.status(400).json({
                success:false,
                message:"A valid request id and six-digit OTP are required"
            })
        }

        const request=await Request.findOne({_id:requestid,buyer:id});
        if(!request){
            return res.status(404).json({success:false,message:"Buyer request not found"});
        }
        const existingTransaction=await CompletedTransaction.findOne({requestid}).lean();
        if(existingTransaction){
            return res.json({success:true,message:"Transaction completed successfully",data:{transactionId:existingTransaction._id,productid:existingTransaction.product}});
        }
        const verification=await Checktransaction.findOne({requestid,buyer:id}).select("+otpHash +processing");
        if(!verification || verification.expiresAt<=new Date()){
            return res.status(410).json({success:false,message:"OTP expired. Ask the seller to send a new one"});
        }
        if(verification.failedAttempts>=5){
            return res.status(429).json({success:false,message:"Too many incorrect attempts. Ask the seller for a new OTP"});
        }
        const validOtp=await bcrypt.compare(String(otp),verification.otpHash);
        if(!validOtp){
            verification.failedAttempts+=1;
            await verification.save();
            return res.status(400).json({
                success:false,
                message:"Incorrect OTP"
            })
        }

        const claimedVerification=await Checktransaction.findOneAndUpdate(
            {_id:verification._id,processing:{$ne:true}},
            {$set:{processing:true}},
            {new:true}
        );
        if(!claimedVerification){
            return res.status(409).json({success:false,message:"This transaction is already being completed"});
        }

        const remainingQuantity=Number(request.quantity);
        const product=await Product.findOneAndUpdate(
            {
                _id:request.product,
                owner:verification.seller,
                publicationStatus:"published",
                status:"Forsale",
                quantity:{$gte:remainingQuantity},
            },
            [{$set:{
                quantity:{$subtract:["$quantity",remainingQuantity]},
                status:{$cond:[{$eq:[{$subtract:["$quantity",remainingQuantity]},0]},"Sold","Forsale"]},
            }}],
            {new:true}
        );
        if(!product){
            await Checktransaction.findByIdAndUpdate(verification._id,{$set:{processing:false}});
            return res.status(409).json({success:false,message:"The requested quantity is no longer available"});
        }

        let completedTransaction;
        try{
            completedTransaction=await CompletedTransaction.create({
                requestid:request._id,
                buyer:request.buyer,
                seller:verification.seller,
                product:product._id,
                productSnapshot:{
                    name:product.productname,
                    image:product.images?.[0] || "",
                    unitPrice:product.price,
                    quantity:remainingQuantity,
                },
                completedAt:new Date(),
            });
        }catch(transactionError){
            await Promise.all([
                Product.findByIdAndUpdate(product._id,[{$set:{quantity:{$add:["$quantity",remainingQuantity]},status:"Forsale"}}]),
                Checktransaction.findByIdAndUpdate(verification._id,{$set:{processing:false}}),
            ]);
            throw transactionError;
        }

        const notificationWrites=[
            {
                recipient:request.buyer,
                title:"How was your purchase?",
                message:`Rate your experience with the seller of ${product.productname}.`,
            },
            {
                recipient:verification.seller,
                title:"How was your sale?",
                message:`Rate your experience with the buyer of ${product.productname}.`,
            },
        ].map(({recipient,title,message})=>Notification.updateOne(
            {recipient,type:"review_requested",transaction:completedTransaction._id},
            {$setOnInsert:{recipient,type:"review_requested",transaction:completedTransaction._id,product:product._id,title,message}},
            {upsert:true}
        ));
        const notificationResults=await Promise.allSettled(notificationWrites);
        notificationResults.filter((result)=>result.status==="rejected").forEach((result)=>logger.error("Could not create review notification: %s",result.reason?.message));

        await Promise.all([
            Checktransaction.deleteMany({requestid}),
            Shedule.deleteMany({requestid}),
            Notification.deleteMany({request:requestid,type:"meeting_proposed"}),
            Request.findByIdAndDelete(requestid),
        ]);
        logger.info("transaction OTP verified for request %s",requestid);

        res.json({
            success:true,
            message:"Transaction completed successfully",
            data:{transactionId:completedTransaction._id,productid:product._id,quantity:product.quantity,status:product.status},
        })

        
    }
    catch(err){
        logger.error(err);
        logger.error("Cannot verify OTP");
        return res.json({
            success:false,
            message:"could not verify OTP",
        })
    }
}
