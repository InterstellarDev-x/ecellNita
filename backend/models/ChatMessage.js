const mongoose = require("mongoose");
const schema = new mongoose.Schema({
    thread: { type: mongoose.Schema.Types.ObjectId, ref: "ChatThread", required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    clientId: { type: String, required: true, maxlength: 100 },
    kind: { type: String, enum: ["text", "offer", "meetup", "system", "image"], required: true },
    body: { type: String, trim: true, maxlength: 1000, default: "" },
    amount: { type: Number, min: 1, max: 10000000 },
    offerStatus: { type: String, enum: ["pending", "accepted", "declined", "withdrawn", "expired", "revised"] },
    offerExpiresAt: Date,
    replacesOffer: { type: mongoose.Schema.Types.ObjectId, ref: "ChatMessage" },
    meetupStatus: { type: String, enum: ["proposed", "accepted", "declined", "changed"] },
    meetingLocation: { type: mongoose.Schema.Types.ObjectId, ref: "MeetingLocation" },
    meetupAt: Date,
    replacesMeetup: { type: mongoose.Schema.Types.ObjectId, ref: "ChatMessage" },
    attachment: {
        url: { type: String, trim: true, maxlength: 2000 },
        publicId: { type: String, trim: true, maxlength: 500 },
        mimeType: { type: String, enum: ["image/jpeg", "image/png", "image/webp"] },
        bytes: { type: Number, min: 1, max: 3 * 1024 * 1024 },
        width: { type: Number, min: 1 },
        height: { type: Number, min: 1 },
    },
    respondedAt: Date,
    readAt: Date,
}, { timestamps: true });
schema.index({ thread: 1, _id: -1 });
schema.index({ sender: 1, clientId: 1 }, { unique: true });
schema.index({ recipient: 1, readAt: 1, thread: 1 });
schema.index({ kind: 1, offerStatus: 1, offerExpiresAt: 1 });
schema.index({ thread: 1 }, { name: "one_pending_offer_per_thread", unique: true, partialFilterExpression: { kind: "offer", offerStatus: "pending" } });
schema.index({ thread: 1 }, { name: "one_pending_meetup_per_thread", unique: true, partialFilterExpression: { kind: "meetup", meetupStatus: "proposed" } });
module.exports = mongoose.model("ChatMessage", schema);
