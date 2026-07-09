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
const logger=require("../utils/logger");
require("dotenv").config();


exports.sendotp=async (req,res)=>{
    try{
        const {email}=req.body;
        // console.log(email);
        if(!email){
            return res.json({
                success:false,
                message:"Email Not Found"
            })
        }
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
        let checkotp=await Otp.findOne({otp});
        while(checkotp){
            otp=otpgenerator.generate(6,{
                upperCaseAlphabets:false,
                lowerCaseAlphabets:false,
                specialChars:false,
            })
            checkotp=await Otp.findOne({otp});
        }

        // Create OTP entry in database first
        const otpdata = await Otp.create({email, otp});
        
        // Send email asynchronously using queue system for better reliability
        setImmediate(async () => {
            try {
                const {sendEmailWithRetry} = require("../utils/EmailQueue");
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
        const {firstname,lastname,email,password,confirmpassword,accounttype,otp}=req.body;
        logger.debug("signup attempt for email: %s", email)
        if(!firstname||!lastname|| !email ||!password || !confirmpassword|| !accounttype ||!otp){
            return res.json({
                success:false,
                message:"All fields are required",
            })
        }
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
        const latestotp=await Otp.find({email}).sort({createdAt:"desc"}).limit(1);
        logger.debug("latest OTP record: %o", latestotp);
        // removed debug
        // removed debug
        // removed debug
        if(!latestotp || latestotp[0].otp!==otp){
            return res.json({
                success:false,
                message:"OTP Not Found"
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

        const userdata=await User.create({
            firstname,
            lastname,
            accounttype,
            email,
            hashedpassword,
            image:`https://api.dicebear.com/5.x/initials/svg?seed=${firstname} ${lastname}`,
            additionaldetails:profiledetails._id,

        })
        const mailresposne=await mailsender(email,"Signup Successfull",signuptemplate(accounttype));
        res.json({
            success:true,
            message:"User Created Successfully",
            data:userdata,
        })




    }
    catch(err){
        return res.json({
            success:false,
            message:err.message,
        })
    }
}

exports.login=async (req,res)=>{
    try{
        // console.log(req.body);
        const {email,password}=req.body;
        if(!email||!password){
            return res.json({
                success:true,
                message:"All Field are Required"
            })
        }
        const user=await User.findOne({email}).populate("additionaldetails").exec();
        // console.log(user);
        if(!user){
            return res.json({
                success:false,
                message:"User Not Registered"
            })
        }
        //match the password and make the jwt token and send trouhgn cookie.
        if(await bcrypt.compare(password,user.hashedpassword)){
            // console.log("password matched successfull")
            const payload={
                email:user.email,
                id:user._id,
                accounttype:user.accounttype,
            }
            const token=jwt.sign(payload,process.env.JWT_SECRET,{
                expiresIn:"2h",
            })

            // console.log("token is generated.")
            const options={
                expires:new Date(Date.now()+3*24*60*60*1000),
                httpOnly:true,
            }
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
    const user=await User.findOne({email});

    if(!user){
        return res.json({
            success:false,
            message:"User not Found with given email",
        })
    }
    const token=crypto.randomUUID();    
    await User.findOneAndUpdate({email},{
        forgotpasswordlink:token,
        forgotpasswordlinkexpires:Date.now()+5*60*1000,
    })
    const link=`${process.env.HOST}/updatepassword/${token}`   // frontend link.
    const mailresposne=await mailsender(email,"Forgot Password Email",forgotpasswordtemplate(email,link));

    res.json({
        success:true,
        message:"Reset password link is send to your email id",
        data:token,
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

        const {password,confirmpassword,token}=req.body;
        if(!password || !confirmpassword ){
            return res.json({
                success:false,
                message:"All Fields are required",
            })
        }

        if(password!==confirmpassword){
            return res.json({
                success:false,
                message:"Password and ConfirmPassword are not Same",
            })
        }

        const userdetails=await User.findOne({forgotpasswordlink:token});
        if(!userdetails){
            return res.json({
                success:false,
                message:"Invalid Token",
            })
        }

        if(userdetails.forgotpasswordlinkexpires<Date.now()){
            return res.json({
                success:false,
                message:"Token expires generate new token",
            })
        }
        
        const hashedpassword=await bcrypt.hash(password,10);
        
        await User.findOneAndUpdate({forgotpasswordlink:token},{
            hashedpassword,
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

