const mongoose = require("mongoose");

const productQuestionSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true,
        index: true,
    },
    buyer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
    },
    seller: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
    },
    question: {
        type: String,
        required: true,
        trim: true,
        maxlength: 1000,
    },
    questionHidden: { type: Boolean, default: false },
    answer: {
        body: { type: String, trim: true, maxlength: 1000 },
        respondedAt: Date,
        hidden: { type: Boolean, default: false },
    },
}, { timestamps: true });

productQuestionSchema.index({ seller: 1, createdAt: -1 });
productQuestionSchema.index({ buyer: 1, createdAt: -1 });

module.exports = mongoose.model("ProductQuestion", productQuestionSchema);
