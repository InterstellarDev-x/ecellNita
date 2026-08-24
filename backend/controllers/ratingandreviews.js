const logger=require("../utils/logger");
const mongoose=require("mongoose");
const Category = require("../models/Category");
const Product = require("../models/Product");
const User=require("../models/User");
const Ratingandreviews=require("../models/Ratingandreviews");


require("dotenv").config()

exports.createreview=async (req,res)=>{
    try{
        const {id}=req.user;
        const {rating,comment,productid}=req.body;
        const numericRating=Number(rating);
        if(!mongoose.Types.ObjectId.isValid(productid) || !Number.isInteger(numericRating) || numericRating<1 || numericRating>5 || typeof comment!=="string" || !comment.trim()){
            return res.status(400).json({
                success:false,
                message:"A product, a rating from 1 to 5, and a comment are required"
            })
        }

        const user=await User.findById(id);
        if(!user){
            return res.status(404).json({
                success:false,
                message:"User Not Registered",
            })
        }

        const product=await Product.findOne({_id:productid,publicationStatus:"published"});
        if(!product) return res.status(404).json({success:false,message:"Product not found"});
        if(String(product.owner)===String(id)) return res.status(403).json({success:false,message:"You cannot review your own product"});

        const ratedetails=await Ratingandreviews.create({
            rating:numericRating,
            comment:comment.trim(),
            reviewer:id,
            product:productid,
        })
        
        try{
            const [,productupdate]=await Promise.all([
                User.findByIdAndUpdate(id,{$addToSet:{ratingandreviews:ratedetails._id}}),
                Product.findByIdAndUpdate(productid,{$addToSet:{ratingandreviews:ratedetails._id}}),
            ]);
            logger.debug("product review updated: %s",productupdate?._id)
        }catch(updateError){
            await Ratingandreviews.findByIdAndDelete(ratedetails._id);
            throw updateError;
        }

        return res.json({
            success:true,
            message: "Review Created Successfully"
        })


    }
    catch(err){
        if(err?.code===11000){
            return res.status(409).json({success:false,message:"You have already reviewed this product"});
        }
        logger.error("Could not create review: %s",err.message);
        return res.status(500).json({
            success:false,
            message:"Could not create the review",
        })
    }
}


exports.deletereview=async (req,res)=>{
    try{


        const {id}=req.user;
        const {reviewid}=req.body;
        if(!mongoose.Types.ObjectId.isValid(reviewid)){
            return res.status(400).json({
                success:false,
                message:"A valid review id is required"
            })
        }

        const user=await User.findById(id);
        if(!user){
            return res.status(404).json({
                success:false,
                message:"User Not Registered",
            })
        }
        
        const review=await Ratingandreviews.findOne({_id:reviewid,reviewer:id});
        if(!review){
            return res.status(404).json({
                success:false,
                message:"Review not found"
            })
        }

        await Promise.all([
            User.findByIdAndUpdate(id,{$pull:{ratingandreviews:review._id}}),
            Product.findByIdAndUpdate(review.product,{$pull:{ratingandreviews:review._id}}),
        ]);
        await review.deleteOne();

        return res.json({
            success:true,
            message:"Deleted Review Successfully"
        })




    }
    catch(err){
        logger.error("Could not delete review: %s",err.message);
        return res.status(500).json({
            success:false,
            message:"Could not delete the review",
        })
    }
}





exports.getproductreviews=async (req,res)=>{
    try{
        
        const {productid}=req.body;
        if(!mongoose.Types.ObjectId.isValid(productid)){
            return res.status(400).json({
                success:false,
                message:"Product id is required"
            })
        }
        const data=await Product.findById(productid).populate({path:"ratingandreviews",populate:{path:"reviewer",select:"firstname lastname image"}});
        if(!data){
            return res.status(404).json({
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
        const data=await User.findOne({email:String(email).trim().toLowerCase()})
            .select("firstname lastname image ratingandreviews")
            .populate("ratingandreviews");
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
