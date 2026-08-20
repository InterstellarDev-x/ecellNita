const mongoose = require("mongoose");

const reviewConfigurationSchema = new mongoose.Schema({
    key: { type: String, unique: true, default: "global_listing_review" },
    mode: {
        type: String,
        enum: ["no_review", "human", "ai_escalation"],
        default: "no_review",
    },
    ai: {
        provider: { type: String, default: "openai" },
        moderationModel: { type: String, default: "omni-moderation-latest" },
        visionModel: { type: String, default: "gpt-4.1-mini" },
        autoApproveThreshold: { type: Number, default: 0.9, min: 0, max: 1 },
        autoRejectThreshold: { type: Number, default: 0.9, min: 0, max: 1 },
        timeoutMs: { type: Number, default: 20000 },
        onProviderFailure: {
            type: String,
            enum: ["hold_for_human", "reject"],
            default: "hold_for_human",
        },
    },
    policyVersion: { type: String, default: "2026-08-20" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });

module.exports = mongoose.model("ReviewConfiguration", reviewConfigurationSchema);
