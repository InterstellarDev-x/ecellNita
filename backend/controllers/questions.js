const mongoose = require("mongoose");
const Product = require("../models/Product");
const ProductQuestion = require("../models/ProductQuestion");
const ContentReport = require("../models/ContentReport");
const Notification = require("../models/Notification");

const validId = (value) => mongoose.Types.ObjectId.isValid(value);

const publicProduct = (product) => product && ({
    _id: product._id,
    productname: product.productname,
    images: product.images,
    status: product.status,
});

const serializeQuestion = (question) => ({
    _id: question._id,
    product: publicProduct(question.product),
    question: question.questionHidden ? null : question.question,
    questionHidden: question.questionHidden,
    answer: question.answer?.body ? {
        body: question.answer.hidden ? null : question.answer.body,
        hidden: question.answer.hidden,
        respondedAt: question.answer.respondedAt,
    } : null,
    createdAt: question.createdAt,
    updatedAt: question.updatedAt,
});

exports.createQuestion = async (req, res) => {
    try {
        const { productid, question } = req.body;
        if (!validId(productid) || typeof question !== "string" || !question.trim()) {
            return res.status(400).json({ success: false, message: "A product and question are required" });
        }
        const product = await Product.findById(productid).select("owner status publicationStatus").lean();
        if (!product || product.publicationStatus !== "published" || product.status !== "Forsale") {
            return res.status(404).json({ success: false, message: "This product is not available for questions" });
        }
        if (String(product.owner) === String(req.user.id)) {
            return res.status(403).json({ success: false, message: "You cannot ask a question about your own product" });
        }

        const item = await ProductQuestion.create({
            product: product._id,
            buyer: req.user.id,
            seller: product.owner,
            question: question.trim(),
        });
        await Notification.create({
            recipient: product.owner,
            type: "question_received",
            title: "New product question",
            message: "A buyer asked a private question about one of your listings.",
            question: item._id,
            product: product._id,
        });
        return res.status(201).json({ success: true, message: "Question sent to the seller", data: serializeQuestion(item) });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Could not send the question" });
    }
};

const listFor = (field) => async (req, res) => {
    try {
        const items = await ProductQuestion.find({ [field]: req.user.id })
            .populate("product", "productname images status")
            .sort({ createdAt: -1 })
            .lean();
        return res.json({ success: true, data: items.map(serializeQuestion) });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Could not load questions" });
    }
};

exports.listBuyerQuestions = listFor("buyer");
exports.listSellerQuestions = listFor("seller");

exports.answerQuestion = async (req, res) => {
    try {
        const { questionId } = req.params;
        const { answer } = req.body;
        if (!validId(questionId) || typeof answer !== "string" || !answer.trim()) {
            return res.status(400).json({ success: false, message: "An answer is required" });
        }
        const question = await ProductQuestion.findOne({ _id: questionId, seller: req.user.id });
        if (!question) return res.status(404).json({ success: false, message: "Question not found" });
        if (question.questionHidden) return res.status(409).json({ success: false, message: "This question is hidden pending review" });
        if (question.answer?.body) return res.status(409).json({ success: false, message: "This question already has a reply" });

        question.answer = { body: answer.trim(), respondedAt: new Date(), hidden: false };
        await question.save();
        await Notification.create({
            recipient: question.buyer,
            type: "question_answered",
            title: "Your question was answered",
            message: "The seller replied to your private product question.",
            question: question._id,
            product: question.product,
        });
        const populated = await question.populate("product", "productname images status");
        return res.json({ success: true, message: "Reply sent", data: serializeQuestion(populated.toObject()) });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Could not send the reply" });
    }
};

exports.reportQuestionContent = async (req, res) => {
    try {
        const { questionId } = req.params;
        const { targetType, reason = "" } = req.body;
        if (!validId(questionId) || !["question", "answer"].includes(targetType)) {
            return res.status(400).json({ success: false, message: "A valid message to report is required" });
        }
        const question = await ProductQuestion.findById(questionId);
        if (!question) return res.status(404).json({ success: false, message: "Question not found" });
        const isBuyer = String(question.buyer) === String(req.user.id);
        const isSeller = String(question.seller) === String(req.user.id);
        const permitted = (targetType === "question" && isSeller) || (targetType === "answer" && isBuyer && question.answer?.body);
        if (!permitted) return res.status(403).json({ success: false, message: "You cannot report this message" });

        const contentSnapshot = targetType === "question" ? question.question : question.answer.body;
        const reportedUser = targetType === "question" ? question.buyer : question.seller;
        try {
            await ContentReport.create({ question: question._id, targetType, reporter: req.user.id, reportedUser, reason: String(reason).trim(), contentSnapshot });
        } catch (error) {
            if (error?.code === 11000) return res.status(409).json({ success: false, message: "You have already reported this message" });
            throw error;
        }
        if (targetType === "question") question.questionHidden = true;
        else question.answer.hidden = true;
        await question.save();
        return res.json({ success: true, message: "Message hidden and sent to the admin for review" });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Could not report this message" });
    }
};
