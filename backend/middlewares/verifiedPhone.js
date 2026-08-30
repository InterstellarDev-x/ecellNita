const User=require("../models/User");

const hasVerifiedPhone=(profile)=>Boolean(
    profile?.phoneVerifiedAt &&
    profile?.verifiedContactno &&
    String(profile.contactno || "")===String(profile.verifiedContactno).slice(-10)
);

const requireVerifiedPhone=async (req,res,next)=>{
    try{
        const user=await User.findById(req.user.id).select("additionaldetails").populate({
            path:"additionaldetails",
            select:"contactno +verifiedContactno phoneVerifiedAt",
        }).lean();
        if(!user) return res.status(404).json({success:false,message:"User not registered"});
        if(!hasVerifiedPhone(user.additionaldetails)){
            return res.status(403).json({
                success:false,
                code:"PHONE_VERIFICATION_REQUIRED",
                message:"Verify your phone number before adding a product",
            });
        }
        next();
    }catch(error){
        return res.status(500).json({success:false,message:"Could not verify seller phone status"});
    }
};

module.exports={hasVerifiedPhone,requireVerifiedPhone};
