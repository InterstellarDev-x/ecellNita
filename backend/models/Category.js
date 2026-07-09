const mongoose=require("mongoose");


const categoryschema=new mongoose.Schema({
    name:{
        type:String,
        required:true,
        trim:true,
    },
    products:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Product"
    }]
})


module.exports=mongoose.model("Category",categoryschema);