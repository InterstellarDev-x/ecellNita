const logger=require("../utils/logger");
const Category = require("../models/Category");
const Product = require("../models/Product");

const User=require("../models/User");
const {cloudinaryuploader}=require("../utils/cloudinaryuploader");

require("dotenv").config()

exports.createproduct=async (req,res)=>{
    logger.debug("createproduct body: %o", req.body);
    try{
        const {id,email}=req.user;
        const imagearr=req.files?.images || req.files?.['images[]'];
        logger.debug("createproduct files: %o", req.files)

        const {productname,productdescription,price,status,quantity,categoryid}=req.body;
        if(!id || !email || !productname || !productdescription || !price || !status || !quantity || !categoryid){
            return res.json({
                success:false,
                message:"All fields are required"
            })
        }
        if(!imagearr){
            return res.json({
                success:false,
                message:"At least one product image is required"
            })
        }

        const user=await User.findById(id);
        if(!user){
            return res.json({
                success:false,
                message:"User Not Registered",
            })
        }
        const files=Array.isArray(imagearr) ? imagearr : [imagearr];
        const images = await Promise.all(
            files.map(file =>
                cloudinaryuploader(file, process.env.FOLDER_NAME, 1000, 1000)
                    .then(result => result.secure_url)
            )
        );

        const productdetails=await Product.create({
            productname,
            productdescription,
            price,
            images,
            status,
            quantity,
            owner:id,
            category:categoryid
        })

        logger.info("product created: %s", productdetails._id);
        const userproupdate=await User.findByIdAndUpdate(id,
            {$push:{products:productdetails._id}}
        )

        const categorydetails=await Category.findByIdAndUpdate(
            categoryid,
            {$push:{products:productdetails._id}})
        
        res.json({
            success:true,
            message:"Created Product successfully",
            data:productdetails
        })

}
catch(err){
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
        if(imagearr){
            const files=Array.isArray(imagearr) ? imagearr : [imagearr];
            updateData.images = await Promise.all(
                files.map(file =>
                    cloudinaryuploader(file, process.env.FOLDER_NAME, 1000, 1000)
                        .then(result => result.secure_url)
                )
            );
        }
 

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