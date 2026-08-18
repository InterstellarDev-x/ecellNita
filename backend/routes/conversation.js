const express=require("express");
const router=express.Router();


const {auth}=require("../middlewares/auth");
const {productrequest,shedulemeet,deleterequest, all_send_request, all_received_request,
    get_shedule_data,delete_shedule_data
}=require("../controllers/conversation");

router.use(auth);

router.post("/productrequest",productrequest);
router.post("/shedulemeet",shedulemeet);
router.post("/deleterequest",deleterequest);
router.post("/all_send_request",all_send_request);
router.post("/all_received_request",all_received_request);
router.post("/get_shedule_data",get_shedule_data);
router.post("/delete_shedule_data",delete_shedule_data);



module.exports=router;