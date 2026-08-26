const mongoose=require("mongoose");
const { MAX_LISTING_QUANTITY } = require("../validation/product");

const productschema=new mongoose.Schema({
    productname:{
        type:String,
        required:true,
        trim:true,
    },
    productdescription:{
        type:String,
        required:true,
        trim:true,
    },
    price:{
        type:Number,
        min:[1,"Price cannot be less than 1"],
        required:true,
    },
    images:{
        type:[String],
        required:true,
    },
    status:{
        type:String,
        enum:["Sold","Purchased","Forsale"],
        default:"Forsale",
    },
    publicationStatus:{
        type:String,
        enum:["published","hidden","removed"],
        default:"published",
        index:true,
    },
    moderation:{
        policyVersion:String,
        finalDecision:{
            type:String,
            enum:["no_review","ai_approved","human_approved"]
        },
        reviewedAt:Date,
        reviewedBy:{
            type:mongoose.Schema.Types.ObjectId,
            ref:"User"
        }
    },
    imageAssets:[{
        url:String,
        publicId:String,
        assetId:String,
        resourceType:String,
    }],
    
    quantity:{
        type:Number,
        min:[1,"Quantity cannot be less than 1"],
        max:[MAX_LISTING_QUANTITY,`Quantity cannot exceed ${MAX_LISTING_QUANTITY}`],
        validate:{
            validator:Number.isSafeInteger,
            message:"Quantity must be a safe whole number",
        },
        default:1,
    },
    owner:{
        type:mongoose.Schema.Types.ObjectId,
        required:true,
        ref:"User"
    },
    category:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Category"
    },
    createdat:{
        type:Date,
        default:Date.now,
     },
    ratingandreviews:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Ratingandreviews",
    }],

})

productschema.index({ owner: 1, createdat: -1 });
productschema.index({ publicationStatus: 1, createdat: -1 });


module.exports=mongoose.model("Product",productschema);
