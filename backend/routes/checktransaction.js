const express=require("express");
const { sendtransotp,verifytransotp} = require("../controllers/checktransaction");
const {auth}=require("../middlewares/auth");

const router=express.Router();

router.post("/sendtransotp",auth,sendtransotp);
router.post("/verifytransotp",auth,verifytransotp);



module.exports = router;