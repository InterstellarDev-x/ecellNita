const express = require("express");
const { auth } = require("../middlewares/auth");
const questions = require("../controllers/questions");

const router = express.Router();
router.use(auth);
router.post("/", questions.createQuestion);
router.get("/buyer", questions.listBuyerQuestions);
router.get("/seller", questions.listSellerQuestions);
router.delete("/:questionId", questions.deleteQuestion);
router.post("/:questionId/answer", questions.answerQuestion);
router.post("/:questionId/report", questions.reportQuestionContent);

module.exports = router;
