const mongoose = require("mongoose");

const transactionReviewSchema = new mongoose.Schema({
    transaction: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "CompletedTransaction",
        required: true,
        index: true,
        immutable: true,
    },
    reviewer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
        immutable: true,
    },
    reviewedUser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
        immutable: true,
    },
    direction: {
        type: String,
        enum: ["buyer_to_seller", "seller_to_buyer"],
        required: true,
        index: true,
        immutable: true,
    },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, trim: true, maxlength: 1000, default: "" },
    tags: [{ type: String, trim: true, maxlength: 50 }],
    visibility: {
        type: String,
        enum: ["pending", "published"],
        default: "pending",
        index: true,
    },
    visibleAfter: {
        type: Date,
        required: true,
        default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        index: true,
    },
}, { timestamps: true });

transactionReviewSchema.index({ transaction: 1, reviewer: 1 }, { unique: true });
transactionReviewSchema.index({ reviewedUser: 1, direction: 1, visibility: 1, visibleAfter: 1 });

module.exports = mongoose.model("TransactionReview", transactionReviewSchema);
