const express=require("express");
const { sendotp ,signup, login,forgotpasswordtoken,forgotpassword} = require("../controllers/Auth");

const router=express.Router();

router.post("/sendotp",sendotp);
router.post("/signup",signup);
router.post("/login",login);
router.post("/forgotpasswordtoken",forgotpasswordtoken);
router.post("/forgotpassword",forgotpassword);


module.exports = router