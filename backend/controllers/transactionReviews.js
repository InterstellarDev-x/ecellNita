const mongoose = require("mongoose");
const CompletedTransaction = require("../models/CompletedTransaction");
const Notification = require("../models/Notification");
const TransactionReview = require("../models/TransactionReview");
const { getReputationSummary, visibleReviewFilter } = require("../services/reputation");

const REVIEW_TAGS = {
    buyer_to_seller: ["Item as described", "Good communication", "On time", "Smooth handoff"],
    seller_to_buyer: ["Good communication", "On time", "Smooth transaction", "Respectful"],
};

const participantContext = (transaction, userId) => {
    if (String(transaction.buyer?._id || transaction.buyer) === String(userId)) {
        return { direction: "buyer_to_seller", reviewedUser: transaction.seller };
    }
    if (String(transaction.seller?._id || transaction.seller) === String(userId)) {
        return { direction: "seller_to_buyer", reviewedUser: transaction.buyer };
    }
    return null;
};

exports.getReviewContext = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.transactionId)) {
            return res.status(400).json({ success: false, message: "A valid transaction is required" });
        }
        const transaction = await CompletedTransaction.findById(req.params.transactionId)
            .populate("buyer seller", "firstname lastname image")
            .lean();
        if (!transaction) return res.status(404).json({ success: false, message: "Transaction not found" });
        const context = participantContext(transaction, req.user.id);
        if (!context) return res.status(403).json({ success: false, message: "You cannot review this transaction" });
        const existingReview = await TransactionReview.findOne({ transaction: transaction._id, reviewer: req.user.id }).select("_id").lean();
        const reviewedUser = context.direction === "buyer_to_seller" ? transaction.seller : transaction.buyer;
        return res.json({
            success: true,
            data: {
                transaction: { _id: transaction._id, productSnapshot: transaction.productSnapshot, completedAt: transaction.completedAt },
                reviewedUser,
                direction: context.direction,
                allowedTags: REVIEW_TAGS[context.direction],
                alreadyReviewed: Boolean(existingReview),
            },
        });
    } catch (_error) {
        return res.status(500).json({ success: false, message: "Could not load this review request" });
    }
};

exports.createTransactionReview = async (req, res) => {
    try {
        const { transactionId } = req.params;
        const numericRating = Number(req.body.rating);
        const comment = typeof req.body.comment === "string" ? req.body.comment.trim() : "";
        const tags = Array.isArray(req.body.tags) ? [...new Set(req.body.tags.map(String))] : [];
        if (!mongoose.Types.ObjectId.isValid(transactionId) || !Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5) {
            return res.status(400).json({ success: false, message: "Choose a rating from 1 to 5" });
        }
        if (comment.length > 1000) return res.status(400).json({ success: false, message: "Review comments must be 1000 characters or fewer" });

        const transaction = await CompletedTransaction.findById(transactionId).lean();
        if (!transaction) return res.status(404).json({ success: false, message: "Transaction not found" });
        const context = participantContext(transaction, req.user.id);
        if (!context) return res.status(403).json({ success: false, message: "You cannot review this transaction" });
        if (tags.length > 4 || tags.some((tag) => !REVIEW_TAGS[context.direction].includes(tag))) {
            return res.status(400).json({ success: false, message: "Choose only the available experience tags" });
        }

        const review = await TransactionReview.create({
            transaction: transaction._id,
            reviewer: req.user.id,
            reviewedUser: context.reviewedUser,
            direction: context.direction,
            rating: numericRating,
            comment,
            tags,
        });
        const reviewCount = await TransactionReview.countDocuments({ transaction: transaction._id });
        if (reviewCount >= 2) {
            await TransactionReview.updateMany({ transaction: transaction._id }, { $set: { visibility: "published" } });
            review.visibility = "published";
        }
        await Notification.deleteMany({ recipient: req.user.id, type: "review_requested", transaction: transaction._id });
        return res.status(201).json({ success: true, message: "Thanks for sharing your experience", data: review });
    } catch (error) {
        if (error?.code === 11000) return res.status(409).json({ success: false, message: "You have already reviewed this transaction" });
        return res.status(500).json({ success: false, message: "Could not save your review" });
    }
};

exports.getUserReputation = async (req, res) => {
    try {
        const userId = req.params.userId === "me" ? req.user.id : req.params.userId;
        if (!mongoose.Types.ObjectId.isValid(userId)) return res.status(400).json({ success: false, message: "A valid user is required" });
        const [summary, reviews] = await Promise.all([
            getReputationSummary(userId),
            TransactionReview.find({ reviewedUser: userId, ...visibleReviewFilter() })
                .sort({ createdAt: -1 })
                .limit(20)
                .populate("reviewer", "firstname lastname image")
                .populate("transaction", "productSnapshot completedAt")
                .lean(),
        ]);
        return res.json({ success: true, data: { summary, reviews } });
    } catch (_error) {
        return res.status(500).json({ success: false, message: "Could not load reputation" });
    }
};

exports.REVIEW_TAGS = REVIEW_TAGS;
