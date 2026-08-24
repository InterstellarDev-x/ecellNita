const logger=require("../utils/logger");
const jwt=require("jsonwebtoken");
const User=require("../models/User");
require("dotenv").config();


exports.auth=async (req,res,next)=>{

    try{
        const authHeader=req.header("Authorization");
        const token=req.cookies.token ||
                    req.body.token ||
                    (authHeader?.startsWith("Bearer ") ? authHeader.replace("Bearer ","") : authHeader);
        if(!token){
            return res.status(401).json({
                success:false,
                message:"Token is Missing"
            })
        }

        //validating the token.
        try{
            const decode=jwt.verify(token,process.env.JWT_SECRET);
            const user=await User.findById(decode.id).select("accountStatus").lean();
            if(!user || (user.accountStatus && user.accountStatus!=="active")){
                return res.status(403).json({ success:false, message:"Account is not permitted to perform this action" });
            }
            req.user=decode;
        }
        catch(err){
            logger.error(err);
            return res.status(401).json({
                success:false,
                message:"Invalid Token",
            })
        }
        next();

    }
    catch(err){
        return res.status(500).json({
            success:false,
            message:"Something Went Wrong While Validating the Token",
        })
    }
}
