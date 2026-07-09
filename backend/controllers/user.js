const logger=require("../utils/logger");
const Profile = require("../models/Profile");
const User=require("../models/User");
const {cloudinaryuploader}=require("../utils/cloudinaryuploader");

require("dotenv").config()
//updating user profile
exports.updateprofile=async (req,res)=>{
        try{
            const {id}=req.user;
            let {gender,enrollmentno,contactno,about,graduationyr}=req.body;

            const user=await User.findById(id).populate("additionaldetails").exec();
            if(!user){
                return res.json({
                    success:false,
                    message:"User Not Registered"
                })
            }
            if(!gender){
                gender=user.additionaldetails.gender;
            }
            if(!enrollmentno){
                enrollmentno=user.additionaldetails.enrollmentno;
            }
            if(!graduationyr){
                graduationyr=user.additionaldetails.graduationyr;
            }
            
            if(!contactno){
                contactno=user.additionaldetails.contactno;
            }
            if(!about){
                about=user.additionaldetails.about;
            }
            logger.debug("userdata: %s", user?._id);
            const profile=await Profile.findByIdAndUpdate(user.additionaldetails,{
                gender,
                enrollmentno,
                about,
                contactno,
                graduationyr
            },{new:true})
            
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
    try{
        let {firstname,lastname}=req.body;
        const imagefile=req?.files?.userimage;
        const id=req.user.id

        
        let user=await User.findById(id);
        if(!user){
            return res.json({
                success:false,
                message:"User Not Registered"
            })
        }
        let image=null;
        logger.debug("user details: %s", user?._id)
        if(!firstname){
            firstname=user.firstname;
            lastname=user.lastname;
        }
        if(!imagefile){
            image=user.image;
        }
        else{
            image=(await cloudinaryuploader(imagefile,process.env.FOLDER_NAME,1000,1000)).secure_url;
            logger.debug("image url: %s", image)
        }

        logger.info("updating user details")
        
        user=await User.findByIdAndUpdate(id,
            {
                firstname,lastname,image
            },{new:true}).populate('additionaldetails').exec();

        logger.debug("user updated: %s", user?._id);
        res.json({
            success:true,
            message:"User Details updated successfully",
            data:user
        })




    }
    catch(err){
        logger.error("user controller error", err)
        return res.json({
            success:false,
            message:"something went wrong while updating user details"
        })
    }
}







