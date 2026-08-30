const mongoose=require("mongoose");

const phoneVerificationSchema=new mongoose.Schema({
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true,
        unique:true,
        index:true,
    },
    phoneNumber:{
        type:String,
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
        required:true,
        expires:0,
    },
},{timestamps:true});

module.exports=mongoose.model("PhoneVerification",phoneVerificationSchema);
