const logger=require("../utils/logger");
const Category = require("../models/Category");
const Profile = require("../models/Profile");
const User=require("../models/User");
const {cloudinaryuploader}=require("../utils/cloudinaryuploader");

require("dotenv").config()





exports.createcategory=async (req,res)=>{
    try{
        const {id}=req.user;
        
        const {name}=req.body;
        
        if(!id || !name ){
            logger.debug("createcategory id: %s", id);
            logger.debug("createcategory name: %s", name);
            return res.json({
                success:false,
                message:"All Fields are Required",
            })
        }

        const user=await User.findById(id);
        if(!user){
            return res.json({
                success:false,
                message:"User Not Registered",
            })
        }

        const catedata=await Category.create({
            name
        })
        res.json({
            success:true,
            message:"Category created successfully",
            data:catedata
        })
        

}
catch(err){
    return res.json({
        success:false,
        message:err.message,
    })
}

}



exports.deletecategory=async (req,res)=>{
    try{
        
        const {id}=req.user;
        
        const {cateid}=req.body;
        
        if(!id || !cateid ){
                return res.json({
                    success:false,
                    message:"All Fields are Required",
                })
            }

        const user=await User.findById(id);
        if(!user){
            return res.json({
                success:false,
                message:"User Not Registered",
            })
        }

        await Category.findByIdAndDelete(cateid);

        res.json({
            success:true,
            message:"Deleted category successfully"
        })

}
catch(err){
    return res.json({
        success:false,
        message:err.message,
    })
}

}




exports.getcategories=async (req,res)=>{
    try{
        const data=await Category.find();
        return res.json({
            success:true,
            message:"Fetched categories successfully",
            data:data
        })
    }
    catch(err){
        return res.json({
            success:false,
            message:err.message
        })
    }
}

