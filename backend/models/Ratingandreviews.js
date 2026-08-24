const mongoose=require("mongoose");


const ratingandreivewsschema=new mongoose.Schema({
    rating:{
        type:Number,
        required:true,
        min:1,
        max:5,
    },
    comment:{
        type:String,
        required:true,
        trim:true,
        maxlength:1000,
    },
    reviewer:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true,
        index:true,
    },
    product:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Product",
        required:true,
        index:true,
    },
    
},{timestamps:true});

ratingandreivewsschema.index(
    {reviewer:1,product:1},
    {unique:true,partialFilterExpression:{reviewer:{$type:"objectId"},product:{$type:"objectId"}}}
);

module.exports=mongoose.model("Ratingandreviews",ratingandreivewsschema);
