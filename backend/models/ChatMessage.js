const mongoose = require("mongoose");
const schema = new mongoose.Schema({
    thread: { type: mongoose.Schema.Types.ObjectId, ref: "ChatThread", required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    clientId: { type: String, required: true, maxlength: 100 },
    kind: { type: String, enum: ["text", "offer"], required: true },
    body: { type: String, trim: true, maxlength: 1000, default: "" },
    amount: { type: Number, min: 1, max: 10000000 },
    offerStatus: { type: String, enum: ["pending", "accepted", "declined"] },
    respondedAt: Date,
    readAt: Date,
}, { timestamps: true });
schema.index({ thread: 1, _id: -1 });
schema.index({ sender: 1, clientId: 1 }, { unique: true });
schema.index({ recipient: 1, readAt: 1, thread: 1 });
module.exports = mongoose.model("ChatMessage", schema);
