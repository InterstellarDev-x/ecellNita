const express=require("express");
const router=express.Router();


const {auth}=require("../middlewares/auth");
const { updateprofile, updateuser } = require("../controllers/user");


router.use(auth)

router.post("/updateprofile",updateprofile);
router.post("/updateuser",updateuser);



module.exports=router;