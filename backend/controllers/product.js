const logger=require("../utils/logger");
const mongoose=require("mongoose");
const Category = require("../models/Category");
const Product = require("../models/Product");
const ListingSubmission = require("../models/ListingSubmission");
const { listingQuantitySchema, getFirstValidationMessage } = require("../validation/product");

const User=require("../models/User");
const {cloudinaryuploader}=require("../utils/cloudinaryuploader");
const {productImageUploadOptions}=require("../utils/productImageUpload");
const {
    getReviewConfiguration, normaliseFiles, validateFiles, cleanupTempFiles,
    runAiReview, publishProduct, createSubmission,
} = require("../services/listingReview");

require("dotenv").config()

const marketplaceProduct = (product) => ({
    ...product,
    owner: product.owner ? { _id: product.owner._id || product.owner } : null,
});

exports.createproduct=async (req,res)=>{
    try{
        const {id}=req.user;
        const imagearr=req.files?.images || req.files?.['images[]'];
        const {productname,productdescription,price,quantity,categoryid}=req.body;
        const numericPrice=Number(price);
        const quantityValidation=listingQuantitySchema.safeParse(quantity);
        if(!id || typeof productname!=="string" || !productname.trim() || typeof productdescription!=="string" || !productdescription.trim() || !mongoose.Types.ObjectId.isValid(categoryid)){
            return res.status(400).json({
                success:false,
                message:"All fields are required"
            })
        }
        if(!Number.isFinite(numericPrice) || numericPrice<1){
            return res.status(400).json({success:false,message:"Price must be at least 1"});
        }
        if(!quantityValidation.success){
            return res.status(400).json({success:false,message:getFirstValidationMessage(quantityValidation.error)});
        }
        if(!imagearr){
            return res.status(400).json({
                success:false,
                message:"At least one product image is required"
            })
        }
        const files = normaliseFiles(imagearr);
        validateFiles(files);
        const user=await User.findById(id);
        if(!user){
            return res.status(404).json({
                success:false,
                message:"User Not Registered",
            })
        }
        const category = await Category.findById(categoryid);
        if (!category) return res.status(400).json({ success: false, message: "Category not found" });

        const listing = { productname: productname.trim(), productdescription: productdescription.trim(), price: numericPrice, status: "Forsale", quantity: quantityValidation.data, category: categoryid };
        const configuration = await getReviewConfiguration();
        let response;
        if (configuration.mode === "no_review") {
            const productdetails = await publishProduct({ listing, files, ownerId: id, decision: { policyVersion: configuration.policyVersion, finalDecision: "no_review" } });
            response = { success: true, published: true, message: "Product created successfully", data: productdetails };
        } else if (configuration.mode === "human") {
            const submission = await createSubmission({ seller: id, listing, files, reviewMode: "human" });
            response = { success: true, pendingReview: true, message: "Listing submitted for human review", data: submission };
        } else {
            const aiDecision = await runAiReview({ files, listing, configuration });
            if (aiDecision.decision === "approved") {
                const productdetails = await publishProduct({ listing, files, ownerId: id, decision: { policyVersion: configuration.policyVersion, finalDecision: "ai_approved" } });
                await require("../models/ModerationReview").create({ product: productdetails._id, reviewerType: "ai", decision: "approved", reasonCodes: aiDecision.reasonCodes, sellerMessage: aiDecision.sellerMessage, ai: aiDecision.ai });
                response = { success: true, published: true, message: "Product created successfully", data: productdetails };
            } else if (aiDecision.decision === "rejected") {
                response = { success: false, status: 422, message: aiDecision.sellerMessage || "Product is not aligned with marketplace policy", reasons: aiDecision.reasonCodes };
            } else {
                const submission = await createSubmission({ seller: id, listing, files, reviewMode: "ai_escalation", aiDecision });
                response = { success: true, pendingReview: true, message: aiDecision.sellerMessage, data: submission };
            }
        }
        await cleanupTempFiles(files);
        return res.status(response.status || 200).json(response);

}
catch(err){
    const imagearr=req.files?.images || req.files?.['images[]'];
    if (imagearr) await cleanupTempFiles(normaliseFiles(imagearr));
    return res.json({
        success:false,
        message:err.message,
    })
}

}


exports.updateproduct=async (req,res)=>{
    try{
    
        
        const {id}=req.user;
        
        const {productid,productname,productdescription,price,status,quantity}=req.body;

        logger.debug("updateproduct body: %o", req.body)

        if(!mongoose.Types.ObjectId.isValid(productid)){
            return res.status(400).json({
                success:false,
                message:"Product id is required"
            })
        }

        const productdetails=await Product.findById(productid);
        if(!productdetails){
            return res.json({
                success:false,
                message:"Product not found"
            })
        }

        if(productdetails.owner.toString()!==id){
            return res.json({
                success:false,
                message:"You are not authorized to update this product"
            })
        }

        const updateData={};
        if(productname!==undefined) updateData.productname=String(productname).trim();
        if(productdescription!==undefined) updateData.productdescription=String(productdescription).trim();
        if(price!==undefined) updateData.price=Number(price);
        if(status!==undefined) updateData.status=status;
        if(quantity!==undefined){
            const quantityValidation=listingQuantitySchema.safeParse(quantity);
            if(!quantityValidation.success){
                return res.status(400).json({success:false,message:getFirstValidationMessage(quantityValidation.error)});
            }
            updateData.quantity=quantityValidation.data;
        }
        if((updateData.productname!==undefined && !updateData.productname) || (updateData.productdescription!==undefined && !updateData.productdescription)){
            return res.status(400).json({success:false,message:"Product name and description cannot be empty"});
        }
        if(updateData.price!==undefined && (!Number.isFinite(updateData.price) || updateData.price<1)){
            return res.status(400).json({success:false,message:"Price must be at least 1"});
        }
        if(updateData.status!==undefined && !["Forsale","Sold","Purchased"].includes(updateData.status)){
            return res.status(400).json({success:false,message:"Invalid product status"});
        }

        const imagearr = req.files?.['images[]'] || req.files?.images;
        const files = imagearr ? normaliseFiles(imagearr) : [];
        if (files.length) validateFiles(files);
        const listing = {
            productname: updateData.productname ?? productdetails.productname,
            productdescription: updateData.productdescription ?? productdetails.productdescription,
            price: Number(updateData.price ?? productdetails.price),
            status: updateData.status ?? productdetails.status,
            quantity: Number(updateData.quantity ?? productdetails.quantity),
            category: productdetails.category,
        };
        const configuration = await getReviewConfiguration();
        if (configuration.mode === "human") {
            const submission = await createSubmission({ seller: id, product: productdetails._id, listing, files, reviewMode: "human" });
            await cleanupTempFiles(files);
            return res.json({ success: true, pendingReview: true, message: "Product changes submitted for human review", data: submission });
        }
        if (configuration.mode === "ai_escalation") {
            const aiDecision = await runAiReview({ files, listing, configuration });
            if (aiDecision.decision === "rejected") {
                await cleanupTempFiles(files);
                return res.status(422).json({ success: false, message: aiDecision.sellerMessage, reasons: aiDecision.reasonCodes });
            }
            if (aiDecision.decision === "escalated") {
                const submission = await createSubmission({ seller: id, product: productdetails._id, listing, files, reviewMode: "ai_escalation", aiDecision });
                await cleanupTempFiles(files);
                return res.json({ success: true, pendingReview: true, message: aiDecision.sellerMessage, data: submission });
            }
        }
        if(files.length){
            const uploadedAssets = await Promise.all(
                files.map(file =>
                    cloudinaryuploader(file, process.env.FOLDER_NAME, null, null, productImageUploadOptions())
                        .then(result => ({ url: result.secure_url, publicId: result.public_id, assetId: result.asset_id, resourceType: result.resource_type }))
                )
            );
            updateData.images = uploadedAssets.map((asset) => asset.url);
            updateData.imageAssets = uploadedAssets;
        }
        if (configuration.mode === "ai_escalation") updateData.moderation = { policyVersion: configuration.policyVersion, finalDecision: "ai_approved", reviewedAt: new Date() };
        await cleanupTempFiles(files);
 

         logger.debug("uploaded image URLs: %o", updateData.images)

    

    const respones =     await Product.findByIdAndUpdate( productid , updateData,{new:true,runValidators:true}
        )


        logger.debug("updateproduct done")
        




    
        res.json({
            success:true,
            message:"Product updated successfully",
            data:respones
        })
}
catch(err){
    return res.json({
        success:false,
        message:err.message,
    })
}

}



exports.deleteproduct=async (req,res)=>{
    try{
        
        const {id}=req.user;
        const {productid}=req.body;
        if(!mongoose.Types.ObjectId.isValid(productid)){
            return res.status(400).json({
                success:false,
                message:"Product id is required"
            })
        }

        const product=await Product.findById(productid);
        if(!product){
            return res.json({
                success:false,
                message:"Product not found"
            })
        }

        if(product.owner.toString()!==id){
            return res.json({
                success:false,
                message:"You are not authorized to delete this product"
            })
        }

        const pendingSubmissions=await ListingSubmission.find({product:productid,state:"pending_human_review"});
        if(pendingSubmissions.length){
            const {destroyStagedAssets}=require("../services/listingReview");
            await Promise.all(pendingSubmissions.map((submission)=>destroyStagedAssets(submission.stagedAssets)));
            await ListingSubmission.deleteMany({_id:{$in:pendingSubmissions.map((submission)=>submission._id)}});
        }
        const prodel=await Product.findByIdAndDelete(productid);
        await User.findByIdAndUpdate(id,
            {$pull:{products:productid}}
        )
        
        await Category.findByIdAndUpdate(prodel.category,
            {$pull:{products:productid}}
        )

        res.json({
            success:true,
            message:"Product deleted successfully",
        })



}
catch(err){
    return res.json({
        success:false,
        message:err.message,
    })
}

}


exports.getproductsviacategory=async (req,res)=>{
    try{
        const {categoryid}=req.body;
        if(!categoryid){
            return res.json({
                success:false,
                message:"All fields are required"
            })
        }

        const products=await Category.findById(categoryid).populate({
            path:"products",
            match:{publicationStatus:"published",status:"Forsale",quantity:{$gt:0}},
            select:"productname productdescription price images status quantity createdat owner category",
        });
        if(!products){
            return res.json({
                success:false,
                message:"Category not found"
            })
        }

        res.json({
            success:true,
            message:"products via category fetched successfully",
            data:products
        })
    }
    catch(err){
        return res.json({
            success:false,
            message:err.message
        })
    }
}



exports.getproductpagedetails=async (req,res)=>{
    try{
        const {productid}=req.body;
        if(!productid){
            return res.json({
                success:false,
                message:"Product id is required"
            })
        }

        if(!mongoose.Types.ObjectId.isValid(productid)){
            return res.status(400).json({success:false,message:"A valid product id is required"});
        }
        const productpage=await Product.findOne({
            _id:productid,
            $or:[
                {publicationStatus:"published",status:"Forsale",quantity:{$gt:0}},
                {owner:req.user.id},
            ],
        })
            .populate("category","name")
            .lean();
        if(!productpage){
            return res.json({
                success:false,
                message:"Product not found"
            })
        }
        res.json({
            success:true,
            message:"Product details fetched successfully",
            data:marketplaceProduct(productpage)
        })
    }
    catch(err){
        return res.json({
            success:false,
            message:err.message
        })
    }
}

exports.getallproduct=async (req,res)=>{
    try{
        const products=await Product.find(
            {publicationStatus:"published",status:"Forsale",quantity:{$gt:0}},
            "productname productdescription price images status quantity createdat owner category"
        )
        .populate("category","name")
        .lean();
        res.json({
            success:true,
            message:"All Products fetched successfully",
            data:products.map(marketplaceProduct)
        })
    }
    catch(err){
        return res.json({
            success:false,
            message:err.message
        })
    }
}

exports.getmyproducts=async (req,res)=>{
    try{
        const [products,pendingSubmissions]=await Promise.all([
            Product.find({owner:req.user.id})
                .populate("category","name")
                .sort({createdat:-1})
                .lean(),
            ListingSubmission.find({seller:req.user.id,state:"pending_human_review"})
                .select("product operation listing state reviewMode createdAt")
                .sort({createdAt:-1})
                .lean(),
        ]);
        return res.json({
            success:true,
            message:"Seller inventory fetched successfully",
            data:{products,pendingSubmissions},
        });
    }catch(err){
        logger.error("Could not load seller inventory: %s",err.message);
        return res.status(500).json({success:false,message:"Could not load your products"});
    }
}

exports.getmarketplacestats=async (_req,res)=>{
    try{
        const Ratingandreviews=require("../models/Ratingandreviews");
        const [members,products,reviews,categories]=await Promise.all([
            User.countDocuments({accountStatus:"active"}),
            Product.countDocuments({publicationStatus:"published",status:"Forsale",quantity:{$gt:0}}),
            Ratingandreviews.countDocuments(),
            Category.countDocuments(),
        ]);
        return res.json({success:true,data:{members,products,reviews,categories}});
    }catch(err){
        logger.error("Could not load marketplace stats: %s",err.message);
        return res.status(500).json({success:false,message:"Could not load marketplace statistics"});
    }
}
