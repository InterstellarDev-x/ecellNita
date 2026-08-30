const express=require("express");
const { sendtransotp,verifytransotp} = require("../controllers/checktransaction");
const {auth}=require("../middlewares/auth");
const transactionReviews=require("../controllers/transactionReviews");

const router=express.Router();

router.post("/sendtransotp",auth,sendtransotp);
router.post("/verifytransotp",auth,verifytransotp);
router.get("/reputation/:userId",auth,transactionReviews.getUserReputation);
router.get("/:transactionId/review-context",auth,transactionReviews.getReviewContext);
router.post("/:transactionId/reviews",auth,transactionReviews.createTransactionReview);



module.exports = router;
