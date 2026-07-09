const logger=require("../utils/logger");
const Category = require("../models/Category");
const Product = require("../models/Product");
const User=require("../models/User");
const Ratingandreviews=require("../models/Ratingandreviews");


require("dotenv").config()

exports.createreview=async (req,res)=>{
    try{
        const {id,email}=req.user;
        const {rating,comment,productid}=req.body;
        if(!id || !email || !rating || !comment || !productid ){
            return res.json({
                success:false,
                message:"All fields are required"
            })
        }

        const user=await User.findById(id);
        if(!user){
            return res.json({
                success:false,
                message:"User Not Registered",
            })
        }

        const ratedetails=await Ratingandreviews.create({
            rating,
            comment,
        })
        
        const userupdate=await User.findByIdAndUpdate(id,
            {$push:{ratingandreviews:ratedetails._id}}
        )

        const productupdate=await Product.findByIdAndUpdate(productid,
            {$push:{ratingandreviews:ratedetails._id}}
        )
        logger.debug("product review updated: %s", productupdate?._id)

        return res.json({
            success:true,
            message: "Review Created Successfully"
        })


    }
    catch(err){
        return res.json({
            success:false,
            message:err.message,
        })
    }
}


exports.deletereview=async (req,res)=>{
    try{


        const {id,email}=req.user;
        const {reviewid, productid}=req.body;
        if(!id || !email  || !productid){
            return res.json({
                success:false,
                message:"All fields are required"
            })
        }

        const user=await User.findById(id);
        if(!user){
            return res.json({
                success:false,
                message:"User Not Registered",
            })
        }
        
        const prodel=await Ratingandreviews.findByIdAndDelete(reviewid);

        await User.findByIdAndUpdate(id,
            {$pull:{ratingandreviews:prodel._id}}
        )
        
        await Product.findByIdAndUpdate(productid,
            {$pull:{ratingandreviews:prodel._id}}
        )

        return res.json({
            success:true,
            message:"Deleted Review Successfully"
        })




    }
    catch(err){
        return res.json({
            success:false,
            message:err.message,
        })
    }
}





exports.getproductreviews=async (req,res)=>{
    try{
        
        const {productid}=req.body;
        const data=await Product.findById(productid).populate("ratingandreviews");
        return res.json({
            success:true,
            message:"Product reivews fetched successfully",
            data:data
        })

    }
    catch(err){
        return res.json({
            success:false,
            message:err.message,
        })
    }
}



exports.getcategoryreviews=async (req,res)=>{
    try{
        const {cateid}=req.body;
        const data=await Category.findById(cateid).populate({
            path: 'products', 
            populate: { 
                path: 'ratingandreviews', 
                model: 'Ratingandreviews' 
            }
        });

        return res.json({
            success:true,
            message:"fetched category wise rating successfully",
            data:data
        })
        




    }
    catch(err){
        return res.json({
            success:false,
            message:err.message,
        })
    }
}

exports.getuserreviews=async (req,res)=>{
    try{
        logger.debug('getuserreviews called')
        const {email}=req.body;
        const data=await User.findOne({email:email}).populate("ratingandreviews");
        return res.json({
            success:true,
            message:"User reviews fetched successfully",
            data:data
        })

    }
    catch(err){
        return res.json({
            success:false,
            message:err.message,
        })
    }
}