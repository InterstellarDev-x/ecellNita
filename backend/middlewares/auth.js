const logger=require("../utils/logger");
const jwt=require("jsonwebtoken");
require("dotenv").config();


exports.auth=async (req,res,next)=>{

    try{
        const token=req.cookies.token ||
                    req.body.token ||
                    req.header("Authorization").replace("Bearer ","");
        if(!token){
            return res.json({
                success:false,
                message:"Token is Missing"
            })
        }

        //validating the token.
        try{
            const decode=jwt.verify(token,process.env.JWT_SECRET);
            req.user=decode;
        }
        catch(err){
            logger.error(err);
            return res.json({
                success:false,
                message:"Invalid Token",
            })
        }
        next();

    }
    catch(err){
        return res.json({
            success:false,
            message:"Something Went Wrong While Validating the Token",
        })
    }
}


