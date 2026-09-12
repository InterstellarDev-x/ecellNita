const mongoose = require("mongoose");
const { z } = require("zod");
const ChatThread = require("../models/ChatThread");
const ChatMessage = require("../models/ChatMessage");
const Product = require("../models/Product");
const Notification = require("../models/Notification");
const { emitToUsers } = require("../realtime/events");
const fail = (message, status = 400) => { throw Object.assign(new Error(message), { status }); };
const validId = (id) => typeof id === "string" && mongoose.isObjectIdOrHexString(id);
const sendSchema = z.object({
    threadId: z.string().refine(validId),
    clientId: z.string().uuid(),
    kind: z.enum(["text", "offer"]),
    body: z.string().trim().max(1000).default(""),
    amount: z.number().finite().min(1).max(10000000).multipleOf(0.01).optional(),
}).superRefine((data, ctx) => {
    if (data.kind === "text" && !data.body) ctx.addIssue({ code: "custom", message: "Write a message" });
    if (data.kind === "offer" && data.amount === undefined) ctx.addIssue({ code: "custom", message: "Enter a valid price" });
});
const getThread = async (userId, threadId) => {
    if (!validId(threadId)) fail("Invalid conversation");
    const thread = await ChatThread.findOne({ _id: threadId, $or: [{ buyer: userId }, { seller: userId }] }).lean();
    if (!thread) fail("Conversation not found", 404);
    return thread;
};
const notifyThread = (thread) => emitToUsers([thread.buyer, thread.seller], "chat:changed", { threadId: String(thread._id) });
const startThread = async (userId, productId) => {
    if (!validId(productId)) fail("Invalid product");
    const product = await Product.findById(productId).select("owner status publicationStatus").lean();
    if (!product || product.publicationStatus !== "published" || product.status !== "Forsale") fail("This listing is no longer available", 404);
    if (String(product.owner) === String(userId)) fail("You cannot chat with yourself", 403);
    const key = { product: product._id, buyer: userId, seller: product.owner };
    let thread;
    try { thread = await ChatThread.findOneAndUpdate(key, { $setOnInsert: key }, { upsert: true, new: true }).lean(); }
    catch (error) { if (error.code !== 11000) throw error; thread = await ChatThread.findOne(key).lean(); }
    notifyThread(thread);
    return thread;
};
const sendMessage = async (userId, input) => {
    const parsed = sendSchema.safeParse(input);
    if (!parsed.success) fail(parsed.error.issues[0]?.message || "Invalid message");
    const data = parsed.data;
    const thread = await getThread(userId, data.threadId);
    const existing = await ChatMessage.findOne({ sender: userId, clientId: data.clientId }).lean();
    if (existing) {
        if (String(existing.thread) !== data.threadId) fail("Message identifier already used", 409);
        return existing;
    }
    if (data.kind === "offer") {
        const product = await Product.findById(thread.product).select("status publicationStatus").lean();
        if (!product || product.status !== "Forsale" || product.publicationStatus !== "published") fail("This listing is no longer accepting offers", 409);
    }
    const recipient = String(thread.buyer) === String(userId) ? thread.seller : thread.buyer;
    let message;
    try {
        message = await ChatMessage.create({ thread: thread._id, sender: userId, recipient, clientId: data.clientId,
            kind: data.kind, body: data.body, ...(data.kind === "offer" ? { amount: data.amount, offerStatus: "pending" } : {}) });
    } catch (error) {
        if (error.code !== 11000) throw error;
        return ChatMessage.findOne({ sender: userId, clientId: data.clientId }).lean();
    }
    // The message is durable before its acknowledgement or live event is sent.
    await ChatThread.updateOne({ _id: thread._id }, { $max: { lastMessageAt: message.createdAt } });
    notifyThread(thread);
    await Notification.create({ recipient, audience: String(recipient) === String(thread.buyer) ? "buyer" : "seller", type: "chat_message", title: data.kind === "offer" ? "New price offer" : "New message",
        message: data.kind === "offer" ? `You received an offer of ₹${data.amount.toLocaleString("en-IN")}.` : data.body.slice(0, 160),
        chat: thread._id, chatMessage: message._id, product: thread.product }).catch((error) => require("../utils/logger").error("Chat notification failed: %s", error.message));
    return message.toObject();
};
const respondToOffer = async (userId, { threadId, messageId, decision } = {}) => {
    if (!validId(messageId) || !["accepted", "declined"].includes(decision)) fail("Invalid offer response");
    const thread = await getThread(userId, threadId);
    const offer = await ChatMessage.findOne({ _id: messageId, thread: threadId, recipient: userId, kind: "offer" }).lean();
    if (!offer) fail("Offer not found", 404);
    if (offer.offerStatus === decision) return offer;
    if (offer.offerStatus !== "pending") fail("This offer has already been answered", 409);
    if (decision === "accepted") {
        const product = await Product.findById(thread.product).select("status publicationStatus").lean();
        if (!product || product.status !== "Forsale" || product.publicationStatus !== "published") fail("This listing is no longer available", 409);
    }
    const result = await ChatMessage.findOneAndUpdate({ _id: messageId, recipient: userId, offerStatus: "pending" },
        { $set: { offerStatus: decision, respondedAt: new Date() } }, { new: true }).lean();
    if (!result) fail("This offer has already been answered", 409);
    notifyThread(thread);
    await Notification.create({ recipient: offer.sender, audience: String(offer.sender) === String(thread.buyer) ? "buyer" : "seller", type: "offer_response", title: `Price offer ${decision}`,
        message: `Your offer of ₹${offer.amount.toLocaleString("en-IN")} was ${decision}.`, chat: thread._id, chatMessage: offer._id, product: thread.product })
        .catch((error) => require("../utils/logger").error("Offer notification failed: %s", error.message));
    return result;
};
const markRead = async (userId, { threadId, throughId } = {}) => {
    const thread = await getThread(userId, threadId);
    if (!validId(throughId)) fail("Invalid read position");
    const last = await ChatMessage.findOne({ _id: throughId, thread: threadId }).lean();
    if (!last) fail("Message not found", 404);
    const result = await ChatMessage.updateMany({ thread: threadId, recipient: userId, readAt: null, _id: { $lte: throughId } }, { $set: { readAt: new Date() } });
    await Notification.updateMany({ recipient: userId, chat: threadId, readAt: null, chatMessage: { $lte: throughId } }, { $set: { readAt: new Date() } });
    if (result.modifiedCount) notifyThread(thread);
    return { threadId };
};
const continueQuestion = async (userId, questionId) => {
    if (!validId(questionId)) fail("Invalid previous question");
    const question = await require("../models/ProductQuestion").findOne({ _id: questionId, $or: [{ buyer: userId }, { seller: userId }] }).lean();
    if (!question) fail("Previous question not found", 404);
    const key = { product: question.product, buyer: question.buyer, seller: question.seller };
    let thread;
    try { thread = await ChatThread.findOneAndUpdate(key, { $setOnInsert: key }, { upsert: true, new: true }).lean(); }
    catch (error) { if (error.code !== 11000) throw error; thread = await ChatThread.findOne(key).lean(); }
    notifyThread(thread);
    return thread;
};
module.exports = { getThread, startThread, continueQuestion, sendMessage, respondToOffer, markRead, sendSchema };
