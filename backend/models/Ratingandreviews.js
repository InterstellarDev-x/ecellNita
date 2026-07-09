const mongoose=require("mongoose");


const ratingandreivewsschema=new mongoose.Schema({
    rating:{
        type:Number,
        required:true
    },
    comment:{
        type:String,
        required:true
    },
    
});

module.exports=mongoose.model("Ratingandreviews",ratingandreivewsschema);