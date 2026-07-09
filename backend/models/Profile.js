const mongoose=require("mongoose");


const profileschema=new mongoose.Schema({
    gender:{
        type:String,
        enum:["Male","Female"],
    },
    enrollmentno:{
        type:String,
    },
    about:{
        type:String,
    },
    contactno:{
        type:Number,
    },
    graduationyr:{
        type:Number,
    },
    
});

module.exports=mongoose.model("Profile",profileschema);