const mongoose=require("mongoose");
const {mailsender}=require("../utils/SendMail");

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
        type : String,
        required:true
    }
})




requestschema.index({ buyer: 1, product: 1 });

module.exports=mongoose.model("Request",requestschema);