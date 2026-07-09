const express=require("express");
const router=express.Router();


const {auth}=require("../middlewares/auth");
const { createreview, getuserreviews,deletereview, getproductreviews, getcategoryreviews} = require("../controllers/ratingandreviews");



router.post("/createreview",auth,createreview);
router.post("/deletereview",auth,deletereview);
router.post("/getuserreviews",getuserreviews);
router.post("/getproductreviews",getproductreviews);
router.post("/getcategoryreviews",getcategoryreviews );


module.exports=router; 