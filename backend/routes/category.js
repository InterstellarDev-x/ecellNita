const express=require("express");
const { createcategory,deletecategory,getcategories} = require("../controllers/category");
const {auth}=require("../middlewares/auth");

const router=express.Router();

router.post("/createcategory",auth,createcategory);
router.post("/deletecategory",auth,deletecategory);
router.post("/getcategories",getcategories);


module.exports = router