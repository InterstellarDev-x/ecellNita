const mongoose = require("mongoose");

const completedTransactionSchema = new mongoose.Schema({
    requestid: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        unique: true,
        index: true,
        immutable: true,
    },
    buyer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
        immutable: true,
    },
    seller: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
        immutable: true,
    },
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true,
        index: true,
        immutable: true,
    },
    productSnapshot: {
        name: { type: String, required: true, trim: true, maxlength: 200 },
        image: { type: String, trim: true },
        unitPrice: { type: Number, required: true, min: 0 },
        quantity: { type: Number, required: true, min: 1 },
    },
    completedAt: {
        type: Date,
        required: true,
        default: Date.now,
        index: true,
        immutable: true,
    },
}, { timestamps: true });

completedTransactionSchema.index({ buyer: 1, completedAt: -1 });
completedTransactionSchema.index({ seller: 1, completedAt: -1 });

module.exports = mongoose.model("CompletedTransaction", completedTransactionSchema);
