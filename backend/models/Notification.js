const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
    },
    type: {
        type: String,
        enum: ["question_received", "question_answered", "review_requested"],
        required: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 160 },
    message: { type: String, required: true, trim: true, maxlength: 500 },
    question: { type: mongoose.Schema.Types.ObjectId, ref: "ProductQuestion" },
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    transaction: { type: mongoose.Schema.Types.ObjectId, ref: "CompletedTransaction" },
    readAt: Date,
}, { timestamps: true });

notificationSchema.index({ recipient: 1, readAt: 1, createdAt: -1 });
notificationSchema.index(
    { recipient: 1, type: 1, transaction: 1 },
    { unique: true, partialFilterExpression: { type: "review_requested", transaction: { $type: "objectId" } } }
);

module.exports = mongoose.model("Notification", notificationSchema);
