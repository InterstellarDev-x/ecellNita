const logger=require("../utils/logger");
const Category = require("../models/Category");
const Product = require("../models/Product");

const User=require("../models/User");
const {cloudinaryuploader}=require("../utils/cloudinaryuploader");
const {
    getReviewConfiguration, normaliseFiles, validateFiles, cleanupTempFiles,
    runAiReview, publishProduct, createSubmission,
} = require("../services/listingReview");

require("dotenv").config()

exports.createproduct=async (req,res)=>{
    try{
        const {id}=req.user;
        const imagearr=req.files?.images || req.files?.['images[]'];
        const {productname,productdescription,price,status,quantity,categoryid}=req.body;
        if(!id || !productname || !productdescription || !price || !status || !quantity || !categoryid){
            return res.status(400).json({
                success:false,
                message:"All fields are required"
            })
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

        const listing = { productname: productname.trim(), productdescription: productdescription.trim(), price: Number(price), status, quantity: Number(quantity), category: categoryid };
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
    
        
        const {id,email}=req.user;
        
        const {productid,productname,productdescription,price,status,quantity}=req.body;

        logger.debug("updateproduct body: %o", req.body)

        if(!productid){
            return res.json({
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
        if(productname!==undefined) updateData.productname=productname;
        if(productdescription!==undefined) updateData.productdescription=productdescription;
        if(price!==undefined) updateData.price=price;
        if(status!==undefined) updateData.status=status;
        if(quantity!==undefined) updateData.quantity=quantity;

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
                    cloudinaryuploader(file, process.env.FOLDER_NAME, 1000, 1000)
                        .then(result => ({ url: result.secure_url, publicId: result.public_id, assetId: result.asset_id, resourceType: result.resource_type }))
                )
            );
            updateData.images = uploadedAssets.map((asset) => asset.url);
            updateData.imageAssets = uploadedAssets;
        }
        if (configuration.mode === "ai_escalation") updateData.moderation = { policyVersion: configuration.policyVersion, finalDecision: "ai_approved", reviewedAt: new Date() };
        await cleanupTempFiles(files);
 

         logger.debug("uploaded image URLs: %o", updateData.images)

    

    const respones =     await Product.findByIdAndUpdate( productid , updateData,{new:true}
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
        
        const {id,email}=req.user;
        const {productid}=req.body;
        if(!productid){
            return res.json({
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

        const products=await Category.findById(categoryid).populate("products");
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

        const productpage=await Product.findById(productid)
            .populate("category","name")
            .populate("owner","firstname lastname email image")
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
            data:productpage
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
            {},
            "productname productdescription price images status quantity createdat owner category"
        )
        .populate("owner","firstname lastname email image")
        .populate("category","name")
        .lean();
        res.json({
            success:true,
            message:"All Products fetched successfully",
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
