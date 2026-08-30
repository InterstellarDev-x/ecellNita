const bcrypt=require("bcrypt");
const crypto=require("crypto");
const PhoneVerification=require("../models/PhoneVerification");
const Profile=require("../models/Profile");
const User=require("../models/User");
const {sendSms}=require("../services/sms");
const logger=require("../utils/logger");

const normalizeIndianPhone=(value)=>{
    const digits=String(value || "").replace(/\D/g,"");
    if(/^\d{10}$/.test(digits) && /^[6-9]/.test(digits)) return `+91${digits}`;
    if(/^91\d{10}$/.test(digits) && /^[6-9]/.test(digits.slice(2))) return `+${digits}`;
    return null;
};

const maskPhone=(phoneNumber)=>phoneNumber ? `${phoneNumber.slice(0,3)}******${phoneNumber.slice(-3)}` : null;

exports.getPhoneVerificationStatus=async (req,res)=>{
    try{
        const user=await User.findById(req.user.id).select("additionaldetails").populate({
            path:"additionaldetails",
            select:"contactno +verifiedContactno phoneVerifiedAt",
        }).lean();
        if(!user?.additionaldetails) return res.status(404).json({success:false,message:"User profile not found"});
        const profile=user.additionaldetails;
        const verified=Boolean(
            profile.phoneVerifiedAt &&
            profile.verifiedContactno &&
            String(profile.contactno || "")===profile.verifiedContactno.slice(-10)
        );
        return res.json({
            success:true,
            data:{verified,phoneNumber:verified ? maskPhone(profile.verifiedContactno) : null},
        });
    }catch(error){
        logger.error("Could not read phone verification status: %s",error.message);
        return res.status(500).json({success:false,message:"Could not check phone verification status"});
    }
};

exports.sendPhoneOtp=async (req,res)=>{
    try{
        const phoneNumber=normalizeIndianPhone(req.body.phoneNumber);
        if(!phoneNumber){
            return res.status(400).json({success:false,message:"Enter a valid 10-digit Indian mobile number"});
        }
        const existingProfile=await Profile.findOne({verifiedContactno:phoneNumber}).select("_id").lean();
        const user=await User.findById(req.user.id).select("additionaldetails").lean();
        if(!user?.additionaldetails) return res.status(404).json({success:false,message:"User profile not found"});
        if(existingProfile && existingProfile._id.toString()!==user.additionaldetails.toString()){
            return res.status(409).json({success:false,message:"This phone number is already verified on another account"});
        }

        const otp=String(crypto.randomInt(100000,1000000));
        const otpHash=await bcrypt.hash(otp,10);
        await PhoneVerification.findOneAndUpdate(
            {user:req.user.id},
            {phoneNumber,otpHash,failedAttempts:0,expiresAt:new Date(Date.now()+5*60*1000)},
            {upsert:true,new:true,setDefaultsOnInsert:true}
        );
        try{
            await sendSms(phoneNumber,`Your NITASPACE seller verification code is ${otp}. It expires in 5 minutes. Do not share it.`);
        }catch(error){
            await PhoneVerification.deleteOne({user:req.user.id,phoneNumber});
            throw error;
        }
        return res.json({success:true,message:`Verification code sent to ${maskPhone(phoneNumber)}`});
    }catch(error){
        logger.error("Could not send phone verification OTP: %s",error.message);
        const status=error.code==="SMS_NOT_CONFIGURED" ? 503 : 500;
        return res.status(status).json({success:false,message:error.code==="SMS_NOT_CONFIGURED" ? "Phone verification is temporarily unavailable" : "Could not send the verification code"});
    }
};

exports.verifyPhoneOtp=async (req,res)=>{
    try{
        const otp=String(req.body.otp || "").trim();
        if(!/^\d{6}$/.test(otp)) return res.status(400).json({success:false,message:"Enter the 6-digit verification code"});
        const verification=await PhoneVerification.findOne({user:req.user.id}).select("+otpHash");
        if(!verification || verification.expiresAt<=new Date()){
            return res.status(410).json({success:false,message:"Verification code expired. Request a new code"});
        }
        if(verification.failedAttempts>=5){
            return res.status(429).json({success:false,message:"Too many incorrect attempts. Request a new code"});
        }
        if(!await bcrypt.compare(otp,verification.otpHash)){
            verification.failedAttempts+=1;
            await verification.save();
            return res.status(400).json({success:false,message:"Incorrect verification code"});
        }

        const user=await User.findById(req.user.id).select("additionaldetails").lean();
        if(!user?.additionaldetails) return res.status(404).json({success:false,message:"User profile not found"});
        await Profile.findByIdAndUpdate(user.additionaldetails,{
            contactno:verification.phoneNumber.slice(-10),
            verifiedContactno:verification.phoneNumber,
            phoneVerifiedAt:new Date(),
        },{runValidators:true});
        await PhoneVerification.deleteOne({_id:verification._id});
        return res.json({success:true,message:"Phone number verified",data:{verified:true,phoneNumber:maskPhone(verification.phoneNumber)}});
    }catch(error){
        if(error?.code===11000) return res.status(409).json({success:false,message:"This phone number is already verified on another account"});
        logger.error("Could not verify phone OTP: %s",error.message);
        return res.status(500).json({success:false,message:"Could not verify the phone number"});
    }
};

module.exports.normalizeIndianPhone=normalizeIndianPhone;
