const mongoose = require("mongoose");

const contentReportSchema = new mongoose.Schema({
    question: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ProductQuestion",
        required: true,
        index: true,
    },
    targetType: {
        type: String,
        enum: ["question", "answer"],
        required: true,
    },
    reporter: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    reportedUser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
    },
    reason: { type: String, trim: true, maxlength: 500 },
    contentSnapshot: { type: String, required: true, maxlength: 1000 },
    status: {
        type: String,
        enum: ["pending", "dismissed", "actioned"],
        default: "pending",
        index: true,
    },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    reviewedAt: Date,
}, { timestamps: true });

contentReportSchema.index({ question: 1, targetType: 1, reporter: 1 }, { unique: true });

module.exports = mongoose.model("ContentReport", contentReportSchema);
