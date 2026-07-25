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
        if(!id || !email  || !reviewid || !productid){
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
        
        if(!user.ratingandreviews.some(review => review.toString()===reviewid)){
            return res.json({
                success:false,
                message:"You are not authorized to delete this review"
            })
        }

        const prodel=await Ratingandreviews.findByIdAndDelete(reviewid);
        if(!prodel){
            return res.json({
                success:false,
                message:"Review not found"
            })
        }

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
        if(!productid){
            return res.status(400).json({
                success:false,
                message:"Product id is required"
            })
        }
        const data=await Product.findById(productid).populate("ratingandreviews");
        if(!data){
            return res.json({
                success:false,
                message:"Product not found"
            })
        }
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
        if(!cateid){
            return res.status(400).json({
                success:false,
                message:"Category id is required"
            })
        }
        const data=await Category.findById(cateid).populate({
            path: 'products', 
            populate: { 
                path: 'ratingandreviews', 
                model: 'Ratingandreviews' 
            }
        });

        if(!data){
            return res.json({
                success:false,
                message:"Category not found"
            })
        }

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
        if(!email){
            return res.status(400).json({
                success:false,
                message:"Email is required"
            })
        }
        const data=await User.findOne({email:email}).populate("ratingandreviews");
        if(!data){
            return res.json({
                success:false,
                message:"User not found"
            })
        }
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