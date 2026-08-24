const express=require("express");
const { sendotp ,signup, login,forgotpasswordtoken,forgotpassword} = require("../controllers/Auth");
const {loginLimiter,otpLimiter,signupLimiter,passwordResetLimiter}=require("../middlewares/rateLimits");

const router=express.Router();

router.post("/sendotp",otpLimiter,sendotp);
router.post("/signup",signupLimiter,signup);
router.post("/login",loginLimiter,login);
router.post("/forgotpasswordtoken",passwordResetLimiter,forgotpasswordtoken);
router.post("/forgotpassword",passwordResetLimiter,forgotpassword);


module.exports = router
