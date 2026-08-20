const logger=require("../utils/logger");
const Profile = require("../models/Profile");
const Shedule =require("../models/Shedule");
const Request= require("../models/Request");
const Product=require("../models/Product");
const {mailsender}=require("../utils/SendMail");
const {sendEmailWithRetry}=require("../utils/EmailQueue");
const {requestproduct}=require("../mailtemplates/Request");
const {shedulevenue}=require("../mailtemplates/Shedule");
const mongoose=require("mongoose");
require("dotenv").config();





exports.productrequest=async (req,res)=>{
    try{
        const {id}=req.user;
        const {productid, quantity}=req.body;
        const requestedQuantity=Number(quantity);
        if(!mongoose.Types.ObjectId.isValid(productid) || !Number.isInteger(requestedQuantity) || requestedQuantity < 1){
            return res.status(400).json({
                success:false,
                message:"A product and a whole-number quantity of at least 1 are required"
            })
        }

        const productdata=await Product.findById(productid).populate("owner", "firstname lastname email");
        if(!productdata){
            return res.status(404).json({
                success:false,
                message:"Product not found"
            })
        }
        const sellerdata=productdata.owner;
        if(!sellerdata?._id || !sellerdata.email){
            return res.status(400).json({
                success:false,
                message:"Seller does not exist"
            })
        }
        if(sellerdata._id.toString()===id){
            return res.status(403).json({
                success:false,
                message:"You cannot request your own product"
            })
        }
        if(productdata.status!=="Forsale" || productdata.quantity < requestedQuantity){
            return res.status(400).json({
                success:false,
                message:"The requested quantity is no longer available"
            })
        }
        const checkrequest=await Request.findOne({buyer:id, product:productid});
        if(checkrequest){
            return res.status(409).json({
                success:false,
                message:"You have already requested this product"
            })
        }

        const saverequest=await Request.create({
            buyer:id,
            seller:sellerdata._id,
            product:productdata._id,
            quantity:requestedQuantity
        })

        logger.info("queueing product request email to seller: %s", sellerdata.email);
        sendEmailWithRetry(
            sellerdata.email,
            "Request to Sell",
            requestproduct(req.user.email, sellerdata.firstname + " " + sellerdata.lastname, productdata.productname, productid, requestedQuantity)
        ).catch((mailError) => {
            logger.error("failed to queue product request email: %s", mailError.message);
        });

        res.json({
            success:true,
            message:"Request For proudct purchase sent successfully"
        })

}
catch(err){
    if(err?.code===11000){
        return res.status(409).json({
            success:false,
            message:"You have already requested this product"
        })
    }
    return res.json({
        success:false,
        message:err.message,
    })
}

}








exports.shedulemeet=async (req,res)=>{
    try{
        const {id,email}=req.user;
        let {requestid, venue, date , time, sellername, productid}=req.body;

        if(!requestid || !venue || !date || !time){
            return res.json({
                success:false, 
                message:"All feilds are required"
            })
        }
        const checkshedule=await Shedule.findOne({requestid:requestid});
        if(checkshedule) {
            return res.json({
                success:false,
                message:"Meeting already sheduled Kindly delete previous shedule then create new"
            })
        }
        const requestdata=await Request.findById(requestid).populate("buyer");
        if(!requestdata){
            return res.json({
                success:false,
                message:"No such request exist."
            })
        }
        if(requestdata.seller.toString()!==id){
            return res.json({
                success:false,
                message:"You are not authorized to schedule this meeting"
            })
        }
        const productdata=await Product.findById(productid || requestdata.product);
        if(!productdata){
            return res.json({
                success:false,
                message:"No such product exist"
            })
        }
        

        const buyername=requestdata.buyer.firstname + " " + requestdata.buyer.lastname;
        const mailresposne=await mailsender(requestdata.buyer.email,"Shedule Venue",shedulevenue(buyername, sellername, productdata.productname, productid,venue, date ,time, requestdata.quantity));

        const saveshedule=await Shedule.create({
            requestid:requestid,
            venue:venue,
            date:date, 
            time:time
        })

        res.json({
            success:true,
            message:"Sheduled meet successfully", 
            data:saveshedule
        })
}
    catch(err){
        return res.json({
        success:false,
        message:err.message,
        })
    }
}








exports.deleterequest=async (req,res)=>{
    try{
        const {id,email}=req.user;
        let {requestid}=req.body;
        if(!requestid){
            return res.json({
                success:false,
                message:"All fields are required"
            })
        }
        const requestdata=await Request.findById(requestid);
        if(!requestdata){
            return res.json({
                success:false,
                message:"No such request exist"
            })
        }
        if(requestdata.buyer.toString()!==id && requestdata.seller.toString()!==id){
            return res.json({
                success:false,
                message:"You are not authorized to delete this request"
            })
        }

        await Request.findByIdAndDelete(requestid);
        await Shedule.findOneAndDelete({requestid:requestid});

        res.json({
            success:true,
            message:"Deleted request successfully"
        })
}
catch(err){
    return res.json({
        success:false,
        message:err.message,
    })
}

}





exports.all_send_request=async (req,res)=>{
    try{
        const {id,email}=req.user;
        
        const sendreqdata=await Request.find({
            buyer:id
        }).populate("buyer").populate("seller").populate("product");

        res.json({
            success:true,
            message:"fetched send requset data successfully", 
            data:sendreqdata
        })
        

}
catch(err){
    return res.json({
        success:false,
        message:err.message,
    })
}

}






exports.all_received_request=async (req,res)=>{
    try{
        const {id}=req.user;
       
        const getreqdata=await Request.find({
            seller:id
        }).populate("buyer").populate("seller").populate("product");
        logger.debug("all_received_request fetched");
        res.json({
            success:true,
            message:"fetched get request data successfully", 
            data:getreqdata
        })
}
catch(err){
    return res.json({
        success:false,
        message:err.message,
    })
}

}





exports.get_shedule_data=async (req,res)=>{
    try{
        const {id}=req.user;
        const {requestid}=req.body;
        if(!requestid){
            return res.status(400).json({
                success:false,
                message:"Request id is required"
            })
        }
        
        const reqdata=await Request.findById(requestid);
        if(!reqdata){
            return res.json({
                success:false,
                message:"No request found"
            })
        }
        if(reqdata.buyer.toString()!==id && reqdata.seller.toString()!==id){
            return res.json({
                success:false,
                message:"You are not authorized to view this schedule"
            })
        }

        const sheduledata=await Shedule.findOne({
            requestid:requestid
        }).populate("requestid");
        if(!sheduledata){
            return res.json({
                success:false,
                message:"No Shedule found",
            })
        }
        
        res.json({
            success:true,
            message:"fetched shedule successfully",
            data:sheduledata
        })
}
catch(err){
    return res.json({
        success:false,
        message:err.message,
    })
}
}





exports.delete_shedule_data=async (req,res)=>{
    try{
        const {id}=req.user;
        const {requestid}=req.body;
        if(!requestid){
            return res.status(400).json({
                success:false,
                message:"Request id is required"
            })
        }
        
        const reqdata=await Request.findById(requestid);
        if(!reqdata){
            return res.json({
                success:false,
                message:"No request found"
            })
        }
        if(reqdata.buyer.toString()!==id && reqdata.seller.toString()!==id){
            return res.json({
                success:false,
                message:"You are not authorized to delete this schedule"
            })
        }

        await Shedule.findOneAndDelete({
            requestid: requestid
        })

        res.json({
            success:true,
            message:"shedule deleted successfully"
        })
}
catch(err){
    return res.json({
        success:false,
        message:err.message,
    })
}
}
