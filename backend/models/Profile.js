const mongoose=require("mongoose");


const profileschema=new mongoose.Schema({
    gender:{
        type:String,
        enum:["Male","Female"],
    },
    enrollmentno:{
        type:String,
        trim:true,
        maxlength:30,
    },
    about:{
        type:String,
        trim:true,
        maxlength:500,
    },
    contactno:{
        type:Number,
        min:1000000000,
        max:9999999999,
    },
    graduationyr:{
        type:Number,
        enum:[1,2,3,4],
    },
    
});

module.exports=mongoose.model("Profile",profileschema);
