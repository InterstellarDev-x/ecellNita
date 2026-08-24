const mongoose=require("mongoose");



const otpschema=new mongoose.Schema({
    email:{
        type:String,
        index:true,
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


module.exports=mongoose.model("Otp",otpschema);
