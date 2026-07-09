const express=require("express");
const router=express.Router();


const {auth}=require("../middlewares/auth");
const { updateproduct,deleteproduct, createproduct,
    getproductpagedetails,getproductsviacategory,getallproduct } = require("../controllers/product");



router.post("/updateproduct",auth,updateproduct);
router.post("/createproduct",auth,createproduct);
router.post("/deleteproduct",auth,deleteproduct);
router.post("/getproductpagedetails",getproductpagedetails);
router.post("/getproductsviacategory",getproductsviacategory);
router.post("/getallproduct",getallproduct);


module.exports=router;