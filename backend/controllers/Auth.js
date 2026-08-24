const bcrypt=require("bcrypt");
const jwt=require("jsonwebtoken");
const crypto=require("crypto");
const User=require("../models/User");
const Otp=require("../models/Otp");
const Profile=require("../models/Profile");
const otpgenerator=require("otp-generator");
const {signuptemplate}=require("../mailtemplates/Signup")
const {forgotpasswordtemplate}=require("../mailtemplates/ForgotpasswordLink");
const {mailsender}=require("../utils/SendMail");
const {sendEmailWithRetry}=require("../utils/EmailQueue");
const logger=require("../utils/logger");
const { signupSchema, sendOtpSchema, resetPasswordSchema, getValidationErrors } = require("../validation/auth");
require("dotenv").config();


exports.sendotp=async (req,res)=>{
    try{
        const validation = sendOtpSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({
                success:false,
                message:"Enter a valid email address",
                errors:getValidationErrors(validation.error),
            });
        }
        const {email}=validation.data;
        const checkuser=await User.findOne({email});
        if(checkuser){
            return res.json({
                success:false,
                message:"User already Registered",
            })
        }
        let otp=otpgenerator.generate(6,{
            upperCaseAlphabets:false,
            lowerCaseAlphabets:false,
            specialChars:false,
        })
        const otpHash=await bcrypt.hash(otp,10);
        await Otp.deleteMany({email});
        await Otp.create({email,otpHash,failedAttempts:0,expiresAt:new Date(Date.now()+5*60*1000)});
        
        // Send email asynchronously using queue system for better reliability
        setImmediate(async () => {
            try {
                const {otptemplate} = require("../mailtemplates/VerificationOtp");
                
                logger.info("Adding OTP email to queue for: %s", email);
                await sendEmailWithRetry(email, "Verification Email From NITASPACE", otptemplate(otp));
                
            } catch (emailError) {
                logger.error("Failed to queue OTP email: %s", emailError.message);
                // Email will be retried automatically by the queue system
            }
        });
        
        res.json({
            success:true,
            message:"OTP generated successfully. Please check your email (may take a few moments).",
        })
    }
    catch(err){
        logger.error("Cannot send OTP", err);
        return res.json({
            success:false,
            message: err.message === 'OTP creation timeout' ? "Email service timeout. Please try again." : "Could not send OTP",
        })
    }
}

exports.signup=async (req,res)=>{
    try{
        const validation = signupSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({
                success:false,
                message:"Please correct the highlighted fields",
                errors:getValidationErrors(validation.error),
            });
        }
        const {firstname,lastname,email,password,confirmpassword,accounttype,otp}=validation.data;
        logger.debug("signup attempt for email: %s", email)
        const checkuser=await User.findOne({email});
        if(checkuser){
            return res.json({
                success:false,
                message:"User Already Registered",
            })
        }
        if(password!==confirmpassword){
            return res.json({
                success:false,
                message:"Password and ConfirmPassword are not Same",
            })
        }
        const latestotp=await Otp.findOne({email}).sort({createdAt:-1}).select("+otpHash");
        if(!latestotp || latestotp.expiresAt<=new Date()){
            return res.status(410).json({success:false,message:"OTP expired. Request a new code"});
        }
        if(latestotp.failedAttempts>=5){
            return res.status(429).json({success:false,message:"Too many incorrect attempts. Request a new code"});
        }
        const validOtp=await bcrypt.compare(otp,latestotp.otpHash);
        if(!validOtp){
            latestotp.failedAttempts+=1;
            await latestotp.save();
            return res.status(400).json({
                success:false,
                message:"Incorrect OTP"
            })
        }
        logger.info("OTP verified for signup");
        const hashedpassword=await bcrypt.hash(password,10);

        const profiledetails=await Profile.create({
            gender:null,
            enrollmentno:null,
            about:null,
            contactno:null,
            graduationyr:null
        })

        let userdata;
        try{
            userdata=await User.create({
                firstname,
                lastname,
                accounttype,
                email,
                hashedpassword,
                image:`https://api.dicebear.com/5.x/initials/svg?seed=${encodeURIComponent(`${firstname} ${lastname}`)}`,
                additionaldetails:profiledetails._id,
            });
        }catch(createError){
            await Profile.findByIdAndDelete(profiledetails._id);
            throw createError;
        }
        await Otp.deleteMany({email});
        sendEmailWithRetry(email,"Signup Successful",signuptemplate(accounttype)).catch((mailError)=>{
            logger.error("Could not queue signup email: %s",mailError.message);
        });
        const safeUser=userdata.toObject();
        delete safeUser.hashedpassword;
        delete safeUser.forgotpasswordlink;
        delete safeUser.forgotpasswordlinkexpires;
        res.json({
            success:true,
            message:"User Created Successfully",
            data:safeUser,
        })




    }
    catch(err){
        logger.error("Signup failed: %s",err.message);
        if(err?.code===11000){
            return res.status(409).json({
                success:false,
                message:"An account with this email already exists",
            });
        }
        return res.status(500).json({
            success:false,
            message:"Could not create the account. Please try again",
        })
    }
}

exports.login=async (req,res)=>{
    try{

        const {email,password}=req.body;
        if(!email||!password){
            return res.status(400).json({
                success:false,
                message:"Email and password are required"
            })
        }
        const normalizedEmail=String(email).trim().toLowerCase();
        const user=await User.findOne({email:normalizedEmail}).select("+hashedpassword").populate("additionaldetails").exec();

        if(!user){
            return res.json({
                success:false,
                message:"User Not Registered"
            })
        }
        if(user.accountStatus && user.accountStatus!=="active"){
            return res.status(403).json({success:false,message:"This account is not permitted to sign in"});
        }
        //match the password and make the jwt token and send trouhgn cookie.
        if(await bcrypt.compare(password,user.hashedpassword)){

            const payload={
                email:user.email,
                id:user._id,
                accounttype:user.accounttype,
            }
            const token=jwt.sign(payload,process.env.JWT_SECRET,{
                expiresIn:"2h",
            })

            user.hashedpassword=undefined;
            user.forgotpasswordlink=undefined;
            user.forgotpasswordlinkexpires=undefined;
            res.json({
                success:true,
                message:"Logged in Successfully",
                token:token,
                data:user,
            })
        }
        else{
            return res.json({
                success:false,
                message:"Password is Incorrect",
            })
        }
    }
    catch(err){
        return res.json({
            success:false,
            message:err.message,
        })
    }

}

exports.forgotpasswordtoken=async (req,res)=>{
    try{
        const {email}=req.body;

    if(!email){
        return res.status(400).json({
            success:false,
            message:"Email is required",
        })
    }

    const normalizedEmail=String(email).trim().toLowerCase();
    const user=await User.findOne({email:normalizedEmail});

    if(!user){
        return res.json({success:true,message:"If an account exists, a reset link has been sent"});
    }
    const token=crypto.randomUUID();    
    await User.findOneAndUpdate({email:normalizedEmail},{
        forgotpasswordlink:token,
        forgotpasswordlinkexpires:Date.now()+5*60*1000,
    })
    const frontendHost=(process.env.HOST || "http://localhost:3000").split(",")[0].trim().replace(/\/$/,"");
    const link=`${frontendHost}/updatepassword/${token}`;
    await mailsender(normalizedEmail,"Forgot Password Email",forgotpasswordtemplate(normalizedEmail,link));

    res.json({
        success:true,
        message:"Reset password link is send to your email id",
    })

    }
    catch(err){
        return res.json({
            success:false,
            message:err.message,
            
        })
    }

}


exports.forgotpassword=async (req,res)=>{
    try{
        const validation=resetPasswordSchema.safeParse(req.body);
        if(!validation.success){
            return res.status(400).json({
                success:false,
                message:"Please correct the highlighted fields",
                errors:getValidationErrors(validation.error),
            })
        }
        const {password,token}=validation.data;

        const userdetails=await User.findOne({forgotpasswordlink:token}).select("+forgotpasswordlink +forgotpasswordlinkexpires");
        if(!userdetails){
            return res.status(400).json({
                success:false,
                message:"Invalid Token",
            })
        }

        if(userdetails.forgotpasswordlinkexpires<Date.now()){
            return res.status(410).json({
                success:false,
                message:"Token expires generate new token",
            })
        }
        
        const hashedpassword=await bcrypt.hash(password,10);
        
        await User.findOneAndUpdate({forgotpasswordlink:token},{
            hashedpassword,
            forgotpasswordlink:undefined,
            forgotpasswordlinkexpires:undefined,
        })

        res.json({
            success:true,
            message:"Password reset Successful",
        })
    }
    catch(err){
        return res.json({
            success:false,
            message:err.message,
        })
    }

}
