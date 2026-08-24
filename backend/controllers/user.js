const logger=require("../utils/logger");
const Profile = require("../models/Profile");
const User=require("../models/User");
const {cloudinaryuploader}=require("../utils/cloudinaryuploader");
const fs=require("fs/promises");

require("dotenv").config()
//updating user profile
exports.updateprofile=async (req,res)=>{
        try{
            const {id}=req.user;
            let {gender,enrollmentno,contactno,about,graduationyr}=req.body;

            gender=gender===undefined ? undefined : String(gender).trim();
            enrollmentno=enrollmentno===undefined ? undefined : String(enrollmentno).trim();
            contactno=contactno===undefined ? undefined : String(contactno).trim();
            about=about===undefined ? undefined : String(about).trim();
            graduationyr=graduationyr===undefined ? undefined : String(graduationyr).trim();
            if(gender!==undefined && gender!=="" && !["Male","Female"].includes(gender)){
                return res.status(400).json({success:false,message:"Select a valid gender"});
            }
            if(enrollmentno!==undefined && enrollmentno.length>30){
                return res.status(400).json({success:false,message:"Enrollment number is too long"});
            }
            if(contactno!==undefined && contactno!=="" && !/^\d{10}$/.test(contactno)){
                return res.status(400).json({success:false,message:"Contact number must contain 10 digits"});
            }
            if(about!==undefined && about.length>500){
                return res.status(400).json({success:false,message:"About section must be 500 characters or fewer"});
            }
            if(graduationyr!==undefined && graduationyr!=="" && !["1","2","3","4"].includes(graduationyr)){
                return res.status(400).json({success:false,message:"Select a valid graduation year"});
            }
            if(gender==="") gender=null;

            const user=await User.findById(id).populate("additionaldetails").exec();
            if(!user){
                return res.json({
                    success:false,
                    message:"User Not Registered"
                })
            }
            if(!user.additionaldetails){
                return res.json({
                    success:false,
                    message:"User profile not found"
                })
            }
            if(gender===undefined){
                gender=user.additionaldetails.gender;
            }
            if(enrollmentno===undefined){
                enrollmentno=user.additionaldetails.enrollmentno;
            }
            if(graduationyr===undefined){
                graduationyr=user.additionaldetails.graduationyr;
            }
            
            if(contactno===undefined){
                contactno=user.additionaldetails.contactno;
            }
            if(about===undefined){
                about=user.additionaldetails.about;
            }
            logger.debug("userdata: %s", user?._id);
            const profile=await Profile.findByIdAndUpdate(user.additionaldetails,{
                gender,
                enrollmentno,
                about,
                contactno:contactno==="" ? null : contactno,
                graduationyr:graduationyr==="" ? null : graduationyr
            },{new:true,runValidators:true})
            
            logger.debug("profile data: %s", profile?._id);
            res.json({
                success:true,
                message:"User profile updated",
                data:profile,
            })


    }
    catch(err){
        return res.json({
            success:false,
            message:err.message,
        })
    }

}

//updating user details ie name and image
exports.updateuser=async (req,res)=>{
    const imagefile=req?.files?.userimage;
    try{
        let {firstname,lastname}=req.body;
        const id=req.user.id

        const validName=(value)=>typeof value==="string" && /^[\p{L}]+(?:[ '-][\p{L}]+)*$/u.test(value.trim()) && value.trim().length>=2 && value.trim().length<=50;
        if(firstname!==undefined && !validName(firstname)){
            if(imagefile?.tempFilePath) await fs.unlink(imagefile.tempFilePath).catch(()=>undefined);
            return res.status(400).json({success:false,message:"Enter a valid first name"});
        }
        if(lastname!==undefined && !validName(lastname)){
            if(imagefile?.tempFilePath) await fs.unlink(imagefile.tempFilePath).catch(()=>undefined);
            return res.status(400).json({success:false,message:"Enter a valid last name"});
        }
        if(imagefile && (!['image/jpeg','image/png','image/webp'].includes(imagefile.mimetype) || imagefile.size>2*1024*1024 || !imagefile.tempFilePath)){
            if(imagefile.tempFilePath) await fs.unlink(imagefile.tempFilePath).catch(()=>undefined);
            return res.status(400).json({success:false,message:"Profile image must be a JPG, PNG, or WebP file smaller than 2MB"});
        }

        
        let user=await User.findById(id);
        if(!user){
            return res.json({
                success:false,
                message:"User Not Registered"
            })
        }
        let image=null;
        logger.debug("user details: %s", user?._id)
        if(firstname===undefined){
            firstname=user.firstname;
        }else firstname=firstname.trim();
        if(lastname===undefined){
            lastname=user.lastname;
        }else lastname=lastname.trim();
        if(!imagefile){
            image=user.image;
        }
        else{
            try{
                image=(await cloudinaryuploader(imagefile,process.env.FOLDER_NAME,1000,1000,{resource_type:"image"})).secure_url;
            }finally{
                await fs.unlink(imagefile.tempFilePath).catch(()=>undefined);
            }
            logger.debug("image url: %s", image)
        }

        logger.info("updating user details")
        
        user=await User.findByIdAndUpdate(id,
            {
                firstname,lastname,image
            },{new:true,runValidators:true})
            .select("-hashedpassword -forgotpasswordlink -forgotpasswordlinkexpires")
            .populate('additionaldetails').exec();

        logger.debug("user updated: %s", user?._id);
        res.json({
            success:true,
            message:"User Details updated successfully",
            data:user
        })




    }
    catch(err){
        logger.error("user controller error", err)
        return res.status(500).json({
            success:false,
            message:"something went wrong while updating user details"
        })
    }
    finally{
        if(imagefile?.tempFilePath) await fs.unlink(imagefile.tempFilePath).catch(()=>undefined);
    }
}




