const express=require("express");
const router=express.Router();


const {auth}=require("../middlewares/auth");
const { updateproduct,deleteproduct, createproduct,
    getproductpagedetails,getproductsviacategory,getallproduct,getmyproducts,getmarketplacestats } = require("../controllers/product");
const {createProductReport}=require("../controllers/productReports");




    
router.post("/updateproduct",auth,updateproduct);
router.post("/createproduct",auth,createproduct);
router.post("/deleteproduct",auth,deleteproduct);
router.post("/getproductpagedetails",auth,getproductpagedetails);
router.post("/getproductsviacategory",getproductsviacategory);
router.post("/getallproduct",auth,getallproduct);
router.get("/mine",auth,getmyproducts);
router.post("/reports",auth,createProductReport);
router.get("/stats",getmarketplacestats);


module.exports=router;
