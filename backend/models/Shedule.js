const mongoose=require("mongoose");


const sheduleschema=new mongoose.Schema({
    requestid:{
        type:mongoose.Schema.Types.ObjectId,
        required:true,
        ref:"Request"
    },
    venue:{
        type:String
    },
    location:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"MeetingLocation"
    },
    locationSnapshot:{
        name:String,
        address:String,
        startTime:String,
        endTime:String,
    },
    date:{
        type:String
        
    },
    time:{
        type:String
    },
    status:{
        type:String,
        enum:["proposed","confirmed"],
        default:"confirmed",
        index:true,
    },
    proposedBy:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    },
    confirmedAt:{
        type:Date
    }
}, { timestamps:true })

module.exports=mongoose.model("Shedule",sheduleschema);
