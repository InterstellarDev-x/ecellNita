const mongoose = require("mongoose");
const schema = new mongoose.Schema({
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    buyer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    seller: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    activeOffer: { type: mongoose.Schema.Types.ObjectId, ref: "ChatMessage" },
    activeMeetup: { type: mongoose.Schema.Types.ObjectId, ref: "ChatMessage" },
    lastMessageAt: { type: Date, default: Date.now },
}, { timestamps: true });
schema.index({ product: 1, buyer: 1, seller: 1 }, { unique: true });
schema.index({ buyer: 1, lastMessageAt: -1 });
schema.index({ seller: 1, lastMessageAt: -1 });
module.exports = mongoose.model("ChatThread", schema);
