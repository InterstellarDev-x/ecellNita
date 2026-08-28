const logger=require("../utils/logger");
const Profile = require("../models/Profile");
const Shedule =require("../models/Shedule");
const Request= require("../models/Request");
const Product=require("../models/Product");
const {sendEmailWithRetry}=require("../utils/EmailQueue");
const {requestproduct}=require("../mailtemplates/Request");
const {shedulevenue}=require("../mailtemplates/Shedule");
const mongoose=require("mongoose");
const MeetingLocation=require("../models/MeetingLocation");
const {isTimeWithinRange}=require("./meetingLocations");
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

        const productdata=await Product.findOne({_id:productid,publicationStatus:"published"}).populate("owner", "firstname lastname email");
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
        const {id}=req.user;
        let {requestid,locationId,date,time}=req.body;

        if(!requestid || !locationId || !date || !time){
            return res.json({
                success:false, 
                message:"All feilds are required"
            })
        }
        const requestdata=await Request.findById(requestid)
            .populate("buyer","firstname lastname email image")
            .populate("seller", "firstname lastname email image");
        if(!requestdata){
            return res.json({
                success:false,
                message:"No such request exist."
            })
        }
        const isBuyer=String(requestdata.buyer?._id)===String(id);
        const isSeller=String(requestdata.seller?._id)===String(id);
        if(!isBuyer && !isSeller){
            return res.json({
                success:false,
                message:"You are not authorized to propose this meeting"
            })
        }
        if(!mongoose.Types.ObjectId.isValid(locationId)) return res.status(400).json({ success:false, message:"A valid meeting location is required" });
        const location=await MeetingLocation.findOne({ _id:locationId, active:true });
        if(!location) return res.status(400).json({ success:false, message:"This meeting location is no longer available" });
        const selectedDate=new Date(`${date}T00:00:00.000Z`);
        const today=new Date();
        today.setUTCHours(0,0,0,0);
        const validDate=/^\d{4}-\d{2}-\d{2}$/.test(date) && !Number.isNaN(selectedDate.getTime()) && selectedDate.toISOString().slice(0,10)===date && selectedDate>=today;
        if(!validDate) {
            return res.status(400).json({success:false,message:"Choose a valid meeting date that is not in the past"});
        }
        if(!isTimeWithinRange(time,location)) {
            return res.status(400).json({ success:false, message:`Choose a time between ${location.startTime} and ${location.endTime} for this location` });
        }
        const productdata=await Product.findOne({_id:requestdata.product,publicationStatus:"published",status:"Forsale"});
        if(!productdata){
            return res.json({
                success:false,
                message:"No such product exist"
            })
        }
        

        const saveshedule=await Shedule.findOneAndUpdate({requestid},{
            requestid,
            venue:location.name,
            location:location._id,
            locationSnapshot:{ name:location.name, address:location.address, startTime:location.startTime, endTime:location.endTime },
            date,
            time,
            status:"proposed",
            proposedBy:id,
            confirmedAt:null,
        },{new:true,upsert:true,runValidators:true,setDefaultsOnInsert:true});

        return res.json({
            success:true,
            message:"Meeting proposal sent", 
            data:saveshedule
        })
    }catch(err){
        return res.status(500).json({success:false,message:err.message});
    }
}

exports.accept_shedule=async (req,res)=>{
    try{
        const {id}=req.user;
        const {requestid}=req.body;
        if(!mongoose.Types.ObjectId.isValid(requestid)) return res.status(400).json({success:false,message:"A valid request is required"});
        const requestdata=await Request.findById(requestid)
            .populate("buyer","firstname lastname email")
            .populate("seller","firstname lastname email")
            .populate("product","productname");
        if(!requestdata) return res.status(404).json({success:false,message:"Request not found"});
        const isParticipant=[requestdata.buyer,requestdata.seller].some((user)=>String(user?._id)===String(id));
        if(!isParticipant) return res.status(403).json({success:false,message:"You are not authorized to accept this proposal"});
        const existingSchedule=await Shedule.findOne({requestid});
        if(!existingSchedule) return res.status(404).json({success:false,message:"No meeting proposal found"});
        if((existingSchedule.status || "confirmed")==="confirmed") return res.json({success:true,message:"Meeting is already confirmed",data:existingSchedule});
        if(String(existingSchedule.proposedBy)===String(id)) return res.status(400).json({success:false,message:"The other participant must accept your proposal"});
        const schedule=await Shedule.findOneAndUpdate({
            requestid,
            status:"proposed",
            proposedBy:{$ne:id},
        },{
            status:"confirmed",
            confirmedAt:new Date(),
        },{new:true,runValidators:true});
        if(!schedule) return res.status(409).json({success:false,message:"The proposal changed. Review the latest details before accepting"});

        const buyername=`${requestdata.buyer.firstname} ${requestdata.buyer.lastname}`;
        const sellername=`${requestdata.seller.firstname} ${requestdata.seller.lastname}`;
        const emailBody=shedulevenue(buyername,sellername,requestdata.product?.productname || "Product",requestdata.product?._id,schedule.locationSnapshot?.name || schedule.venue,schedule.date,schedule.time,requestdata.quantity);
        await Promise.allSettled([
            sendEmailWithRetry(requestdata.buyer.email,"Meeting confirmed",emailBody),
            sendEmailWithRetry(requestdata.seller.email,"Meeting confirmed",emailBody),
        ]);
        return res.json({success:true,message:"Meeting confirmed",data:schedule});
    }catch(err){
        return res.status(500).json({success:false,message:err.message});
    }
}








exports.deleterequest=async (req,res)=>{
    try{
        const {id}=req.user;
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
        const {id}=req.user;
        const sendreqdata=await Request.find({
            buyer:id
        })
            .populate("buyer","firstname lastname email image")
            .populate("seller","firstname lastname email image")
            .populate("product","productname productdescription price images status quantity publicationStatus");

        const schedules=await Shedule.find({
            requestid:{$in:sendreqdata.map((request)=>request._id)},
            $or:[{status:"confirmed"},{status:{$exists:false}}]
        }).select("requestid").lean();
        const scheduledIds=new Set(schedules.map((schedule)=>String(schedule.requestid)));
        const data=sendreqdata.map((request)=>{
            const item=request.toObject();
            if(!scheduledIds.has(String(item._id))) item.seller={_id:item.seller?._id};
            return item;
        });

        res.json({
            success:true,
            message:"fetched send requset data successfully", 
            data
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
        const getreqdata=await Request.find({ seller:id })
            .populate("buyer","firstname lastname email image")
            .populate("seller","firstname lastname email image")
            .populate("product","productname productdescription price images status quantity publicationStatus");
        logger.debug("all_received_request fetched");
        return res.json({ success:true, message:"fetched get request data successfully", data:getreqdata });
    }
    catch(err){
        return res.json({ success:false, message:err.message })
    }
}

exports.available_meeting_locations=async (_req,res)=>{
    try{
        const locations=await MeetingLocation.find({active:true}).select("name address startTime endTime").sort({name:1}).lean();
        return res.json({success:true,data:locations});
    }catch(err){ return res.status(500).json({success:false,message:"Could not load meeting locations"}); }
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
