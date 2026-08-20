const mongoose=require("mongoose");


const requestschema=new mongoose.Schema({
    buyer:{
        type:mongoose.Schema.Types.ObjectId,
        required:true,
        ref:"User",
        index:true,
    },
    seller:{
        type:mongoose.Schema.Types.ObjectId,
        required:true,
        ref:"User",
        index:true,
    },
    product:{
        type:mongoose.Schema.Types.ObjectId,
        required:true,
        ref:"Product",
    },
    requestdate:{
        type:Date,
        default:Date.now,
    },
    quantity:{
        type : Number,
        required:true,
        min:[1, "Requested quantity must be at least 1"]
    }
})




requestschema.index({ buyer: 1, product: 1 }, { unique: true });

module.exports=mongoose.model("Request",requestschema);
