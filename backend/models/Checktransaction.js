const mongoose=require("mongoose");

const Checktransactionschema=new mongoose.Schema({
    requestid:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Request",
        required:true,
        index:true,
    },
    buyer:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true,
        index:true,
    },
    seller:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true,
    },
    productid:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Product",
        required:true,
    },
    otpHash:{
        type:String,
        required:true,
        select:false,
    },
    failedAttempts:{
        type:Number,
        default:0,
    },
    expiresAt:{
        type:Date,
        default:()=>new Date(Date.now()+5*60*1000),
        expires:0,
    },
},{timestamps:true})

Checktransactionschema.index({requestid:1,buyer:1},{unique:true,sparse:true});



module.exports=mongoose.model("Checktransaction",Checktransactionschema);
