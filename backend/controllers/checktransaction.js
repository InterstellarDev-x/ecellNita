const logger=require("../utils/logger");
const {mailsender}=require("../utils/SendMail");
const {checktransactiontemplate}=require("../mailtemplates/Checktransaction");
require("dotenv").config();
const otpgenerator=require("otp-generator");
const Checktransaction=require("../models/Checktransaction");
const Product=require("../models/Product");
const Request=require("../models/Request");



exports.sendtransotp=async (req,res)=>{
    try{
        const {id,email}=req.user;
        const {buyermail,productid}=req.body;
        if(!buyermail || !productid){
            return res.json({
                success:false,
                message:"Buyer email and product id are required"
            })
        }

        const product=await Product.findById(productid);
        if(!product){
            return res.json({
                success:false,
                message:"Product not found"
            })
        }
        if(product.owner.toString()!==id){
            return res.json({
                success:false,
                message:"You are not authorized to send transaction OTP for this product"
            })
        }

        const request=await Request.findOne({product:productid, seller:id}).populate("buyer", "email");
        if(!request || request.buyer?.email!==buyermail){
            return res.json({
                success:false,
                message:"No matching buyer request found for this product"
            })
        } 

        let otp=otpgenerator.generate(6,{
            upperCaseAlphabets:false,
            lowerCaseAlphabets:false,
            specialChars:false,
        })
        let checkotp=await Checktransaction.findOne({otp});
        if(checkotp){
            otp=otpgenerator.generate(6,{
                upperCaseAlphabets:false,
                lowerCaseAlphabets:false,
                specialChars:false,
            })
            checkotp=await Checktransaction.findOne({otp});
        }

        const otpdata=await Checktransaction.create({buyermail,productid,otp});

        await mailsender(
            buyermail,
            "Transaction Verification OTP",
            checktransactiontemplate(productid, otp)
        );

        res.json({
            success:true,
            message:"OTP sent successfully",
            data:otpdata,
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
        const {buyermail,productid,otp}=req.body;
        if(!buyermail || !productid || !otp){
            return res.status(400).json({
                success:false,
                message:"Buyer email, product id, and OTP are required"
            })
        }

        const latestotp=await Checktransaction.find({buyermail:buyermail, productid:productid}).sort({cretedat:"desc"}).limit(1);
        if(!latestotp.length || latestotp[0].otp!==otp){
            return res.json({
                success:false,
                message:"OTP Not Found"
            })
        }
        logger.info("transaction OTP verified");

        res.json({
            success:true,
            message:"transaction verified successfully"
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


