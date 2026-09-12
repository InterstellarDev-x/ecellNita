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
        enum: ["question_received", "question_answered", "review_requested", "meeting_proposed", "chat_message", "offer_response"],
        required: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 160 },
    message: { type: String, required: true, trim: true, maxlength: 500 },
    question: { type: mongoose.Schema.Types.ObjectId, ref: "ProductQuestion" },
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    request: { type: mongoose.Schema.Types.ObjectId, ref: "Request" },
    transaction: { type: mongoose.Schema.Types.ObjectId, ref: "CompletedTransaction" },
    audience: { type: String, enum: ["buyer", "seller"] },
    chatMessage: { type: mongoose.Schema.Types.ObjectId, ref: "ChatMessage" },
    chat: { type: mongoose.Schema.Types.ObjectId, ref: "ChatThread" },
    readAt: Date,
}, { timestamps: true });

notificationSchema.index({ recipient: 1, readAt: 1, createdAt: -1 });
notificationSchema.index(
    { recipient: 1, type: 1, transaction: 1 },
    { unique: true, partialFilterExpression: { type: "review_requested", transaction: { $type: "objectId" } } }
);

// Observe every existing notification write path, including upserts and bulk reads/deletes.
const { emitToUsers } = require("../realtime/events");
notificationSchema.post("save", function (doc) {
    emitToUsers([doc.recipient], "notifications:changed");
});
notificationSchema.post("insertMany", function (docs) {
    emitToUsers(docs.map((doc) => doc.recipient), "notifications:changed");
});
for (const operation of ["updateOne", "updateMany", "findOneAndUpdate", "deleteOne", "deleteMany", "findOneAndDelete"]) {
    notificationSchema.pre(operation, async function () {
        const filter = this.getFilter();
        const recipients = await this.model.distinct("recipient", filter);
        const update = this.getUpdate?.() || {};
        const direct = filter.recipient;
        if (direct && (typeof direct === "string" || direct instanceof mongoose.Types.ObjectId)) recipients.push(direct);
        if (update.$setOnInsert?.recipient) recipients.push(update.$setOnInsert.recipient);
        this.$notificationRecipients = recipients;
    });
    notificationSchema.post(operation, function () {
        emitToUsers(this.$notificationRecipients || [], "notifications:changed");
    });
}
module.exports = mongoose.model("Notification", notificationSchema);
