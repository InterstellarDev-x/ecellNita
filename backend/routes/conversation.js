const express=require("express");
const router=express.Router();


const {auth}=require("../middlewares/auth");
const {productrequest,shedulemeet,deleterequest, all_send_request, all_received_request,
    get_shedule_data,delete_shedule_data
}=require("../controllers/conversation");


router.post("/productrequest",auth,productrequest);
router.post("/shedulemeet",auth,shedulemeet);
router.post("/deleterequest",auth,deleterequest);
router.post("/all_send_request",auth,all_send_request);
router.post("/all_received_request",auth,all_received_request);
router.post("/get_shedule_data",auth,get_shedule_data);
router.post("/delete_shedule_data",auth,delete_shedule_data);



module.exports=router;