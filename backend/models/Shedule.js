const mongoose=require("mongoose");
const {mailsender}=require("../utils/SendMail");

const sheduleschema=new mongoose.Schema({
    requestid:{
        type:mongoose.Schema.Types.ObjectId,
        required:true,
        ref:"Request"
    },
    venue:{
        type:String
    },
    date:{
        type:String
        
    },
    time:{
        type:String
        
    }
})


module.exports=mongoose.model("Shedule",sheduleschema);