const mongoose = require("mongoose");

const productReportSchema = new mongoose.Schema({
    reporter: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true, index: true },
    reason: { type: String, required: true },
    details: { type: String, trim: true, maxlength: 1000 },
    status: { type: String, enum: ["open", "reviewing", "resolved", "dismissed"], default: "open", index: true },
    resolution: String,
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });

productReportSchema.index({ reporter: 1, product: 1, status: 1 });

module.exports = mongoose.model("ProductReport", productReportSchema);
