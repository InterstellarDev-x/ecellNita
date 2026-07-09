const mongoose=require("mongoose");

const Checktransactionschema=new mongoose.Schema({
    buyermail:{
        type:String,
    },
    productid:{
        type:mongoose.Schema.Types.ObjectId
    },
    otp:{
        type:String,
    },
    cretedat:{
        type:Date,
        default:Date.now,
        expires:5*60,
    },
})



module.exports=mongoose.model("Checktransaction",Checktransactionschema);