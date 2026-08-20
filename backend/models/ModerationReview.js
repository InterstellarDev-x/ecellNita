const mongoose = require("mongoose");

const moderationReviewSchema = new mongoose.Schema({
    submission: { type: mongoose.Schema.Types.ObjectId, ref: "ListingSubmission", index: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", index: true },
    reviewerType: { type: String, enum: ["ai", "human", "system"], required: true },
    decision: { type: String, enum: ["approved", "rejected", "escalated"], required: true },
    reasonCodes: [String],
    sellerMessage: String,
    ai: {
        provider: String,
        model: String,
        policyVersion: String,
        confidence: Number,
        categoryScores: mongoose.Schema.Types.Mixed,
    },
    reviewer: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });

module.exports = mongoose.model("ModerationReview", moderationReviewSchema);
