const crypto = require("node:crypto");
const mongoose = require("mongoose");
const { z } = require("zod");
const ChatThread = require("../models/ChatThread");
const ChatMessage = require("../models/ChatMessage");
const Product = require("../models/Product");
const MeetingLocation = require("../models/MeetingLocation");
const Notification = require("../models/Notification");
const { emitToUsers } = require("../realtime/events");
const logger = require("../utils/logger");

const OFFER_LIFETIME_MS = 24 * 60 * 60 * 1000;
const fail = (message, status = 400) => { throw Object.assign(new Error(message), { status }); };
const validId = (id) => typeof id === "string" && mongoose.isObjectIdOrHexString(id);
const id = z.string().refine(validId, "Invalid identifier");
const clientId = z.string().uuid();
const amount = z.number().finite().min(1).max(10000000).multipleOf(0.01);
const parse = (schema, input) => {
    const result = schema.safeParse(input);
    if (!result.success) fail(result.error.issues[0]?.message || "Invalid request");
    return result.data;
};
const sendSchema = z.object({ threadId: id, clientId, kind: z.enum(["text", "offer"]), body: z.string().trim().max(1000).default(""), amount: amount.optional() })
    .superRefine((data, ctx) => {
        if (data.kind === "text" && !data.body) ctx.addIssue({ code: "custom", message: "Write a message" });
        if (data.kind === "offer" && data.amount === undefined) ctx.addIssue({ code: "custom", message: "Enter a valid price" });
    });
const offerChangeSchema = z.object({ threadId: id, messageId: id, clientId: clientId.optional(), amount: amount.optional() });
const meetupSchema = z.object({ threadId: id, clientId, locationId: id, meetupAt: z.coerce.date() });

const getThread = async (userId, threadId) => {
    if (!validId(threadId)) fail("Invalid conversation");
    const thread = await ChatThread.findOne({ _id: threadId, $or: [{ buyer: userId }, { seller: userId }] }).lean();
    if (!thread) fail("Conversation not found", 404);
    return thread;
};
const other = (thread, userId) => String(thread.buyer) === String(userId) ? thread.seller : thread.buyer;
const notifyThread = (thread) => emitToUsers([thread.buyer, thread.seller], "chat:changed", { threadId: String(thread._id) });
const notify = (data) => Notification.create(data).catch((error) => logger.error("Chat notification failed: %s", error.message));
const touch = (threadId, message, set) => ChatThread.updateOne({ _id: threadId }, { $max: { lastMessageAt: message.createdAt }, ...(set ? { $set: set } : {}) });
const systemMessage = async (thread, actor, body) => {
    const message = await ChatMessage.create({ thread: thread._id, sender: actor, recipient: other(thread, actor), clientId: crypto.randomUUID(), kind: "system", body });
    await touch(thread._id, message);
    return message;
};
const requireAvailableProduct = async (productId, message) => {
    const product = await Product.findById(productId).select("status publicationStatus").lean();
    if (!product || product.status !== "Forsale" || product.publicationStatus !== "published") fail(message, 409);
};
const expirePendingOffers = async ({ threadId } = {}) => {
    const filter = { kind: "offer", offerStatus: "pending", offerExpiresAt: { $lte: new Date() } };
    if (threadId) filter.thread = threadId;
    const candidates = await ChatMessage.find(filter).select("_id thread").lean();
    if (!candidates.length) return 0;
    const result = await ChatMessage.updateMany({ _id: { $in: candidates.map((x) => x._id) }, offerStatus: "pending" }, { $set: { offerStatus: "expired", respondedAt: new Date() } });
    const threads = await ChatThread.find({ _id: { $in: candidates.map((x) => x.thread) } }).select("buyer seller").lean();
    await Promise.all(candidates.map((x) => ChatThread.updateOne({ _id: x.thread, activeOffer: x._id }, { $unset: { activeOffer: 1 } })));
    threads.forEach(notifyThread);
    return result.modifiedCount;
};

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
    const data = parse(sendSchema, input);
    const thread = await getThread(userId, data.threadId);
    const existing = await ChatMessage.findOne({ sender: userId, clientId: data.clientId }).lean();
    if (existing) {
        if (String(existing.thread) !== data.threadId) fail("Message identifier already used", 409);
        return existing;
    }
    if (data.kind === "offer") {
        await expirePendingOffers({ threadId: thread._id });
        await requireAvailableProduct(thread.product, "This listing is no longer accepting offers");
        const active = await ChatMessage.findOne({ thread: thread._id, kind: "offer", offerStatus: "pending" }).lean();
        if (active) fail("Revise or withdraw the active offer first", 409);
    }
    const recipient = other(thread, userId);
    let message;
    try {
        message = await ChatMessage.create({ thread: thread._id, sender: userId, recipient, clientId: data.clientId, kind: data.kind, body: data.body,
            ...(data.kind === "offer" ? { amount: data.amount, offerStatus: "pending", offerExpiresAt: new Date(Date.now() + OFFER_LIFETIME_MS) } : {}) });
    } catch (error) {
        if (error.code !== 11000) throw error;
        const duplicate = await ChatMessage.findOne({ sender: userId, clientId: data.clientId }).lean();
        if (duplicate) return duplicate;
        fail("Another offer is already active", 409);
    }
    await touch(thread._id, message, data.kind === "offer" ? { activeOffer: message._id } : null);
    notifyThread(thread);
    await notify({ recipient, audience: String(recipient) === String(thread.buyer) ? "buyer" : "seller", type: "chat_message", title: data.kind === "offer" ? "New price offer" : "New message",
        message: data.kind === "offer" ? `You received an offer of ₹${data.amount.toLocaleString("en-IN")}.` : data.body.slice(0, 160), chat: thread._id, chatMessage: message._id, product: thread.product });
    return message.toObject();
};

const respondToOffer = async (userId, { threadId, messageId, decision } = {}) => {
    if (!validId(messageId) || !["accepted", "declined"].includes(decision)) fail("Invalid offer response");
    const thread = await getThread(userId, threadId);
    await expirePendingOffers({ threadId });
    const offer = await ChatMessage.findOne({ _id: messageId, thread: threadId, recipient: userId, kind: "offer" }).lean();
    if (!offer) fail("Offer not found", 404);
    if (offer.offerStatus === decision) return offer;
    if (offer.offerStatus !== "pending") fail(offer.offerStatus === "expired" ? "This offer has expired" : "This offer has already been answered", 409);
    if (decision === "accepted") await requireAvailableProduct(thread.product, "This listing is no longer available");
    const result = await ChatMessage.findOneAndUpdate({ _id: messageId, recipient: userId, offerStatus: "pending", offerExpiresAt: { $gt: new Date() } }, { $set: { offerStatus: decision, respondedAt: new Date() } }, { new: true }).lean();
    if (!result) fail("This offer has already been answered", 409);
    await ChatThread.updateOne({ _id: thread._id, activeOffer: offer._id }, { $unset: { activeOffer: 1 } });
    await systemMessage(thread, userId, `Offer of ₹${offer.amount.toLocaleString("en-IN")} ${decision}.`);
    notifyThread(thread);
    await notify({ recipient: offer.sender, audience: String(offer.sender) === String(thread.buyer) ? "buyer" : "seller", type: "offer_response", title: `Price offer ${decision}`,
        message: `Your offer of ₹${offer.amount.toLocaleString("en-IN")} was ${decision}.`, chat: thread._id, chatMessage: offer._id, product: thread.product });
    return result;
};

const withdrawOffer = async (userId, input = {}) => {
    const data = parse(offerChangeSchema, input);
    const thread = await getThread(userId, data.threadId);
    await expirePendingOffers({ threadId: data.threadId });
    const offer = await ChatMessage.findOneAndUpdate({ _id: data.messageId, thread: data.threadId, sender: userId, kind: "offer", offerStatus: "pending", offerExpiresAt: { $gt: new Date() } },
        { $set: { offerStatus: "withdrawn", respondedAt: new Date() } }, { new: true }).lean();
    if (!offer) fail("Only your active offer can be withdrawn", 409);
    await ChatThread.updateOne({ _id: thread._id, activeOffer: offer._id }, { $unset: { activeOffer: 1 } });
    await systemMessage(thread, userId, `Offer of ₹${offer.amount.toLocaleString("en-IN")} withdrawn.`);
    notifyThread(thread);
    await notify({ recipient: offer.recipient, audience: String(offer.recipient) === String(thread.buyer) ? "buyer" : "seller", type: "offer_changed", title: "Offer withdrawn", message: "The active price offer was withdrawn.", chat: thread._id, chatMessage: offer._id, product: thread.product });
    return offer;
};

const reviseOffer = async (userId, input = {}) => {
    const data = parse(offerChangeSchema.extend({ clientId, amount }), input);
    const thread = await getThread(userId, data.threadId);
    await expirePendingOffers({ threadId: data.threadId });
    await requireAvailableProduct(thread.product, "This listing is no longer accepting offers");
    const existing = await ChatMessage.findOne({ sender: userId, clientId: data.clientId }).lean();
    if (existing) {
        if (String(existing.thread) !== data.threadId || String(existing.replacesOffer) !== data.messageId) fail("Message identifier already used", 409);
        return existing;
    }
    const old = await ChatMessage.findOneAndUpdate({ _id: data.messageId, thread: data.threadId, sender: userId, kind: "offer", offerStatus: "pending", offerExpiresAt: { $gt: new Date() } },
        { $set: { offerStatus: "revised", respondedAt: new Date() } }, { new: false }).lean();
    if (!old) fail("Only your active offer can be revised", 409);
    let next;
    try {
        next = await ChatMessage.create({ thread: thread._id, sender: userId, recipient: old.recipient, clientId: data.clientId, kind: "offer", amount: data.amount,
            offerStatus: "pending", offerExpiresAt: new Date(Date.now() + OFFER_LIFETIME_MS), replacesOffer: old._id });
    } catch (error) {
        await ChatMessage.updateOne({ _id: old._id, offerStatus: "revised" }, { $set: { offerStatus: "pending" }, $unset: { respondedAt: 1 } });
        throw error;
    }
    await touch(thread._id, next, { activeOffer: next._id });
    await systemMessage(thread, userId, `Offer revised to ₹${data.amount.toLocaleString("en-IN")}.`);
    notifyThread(thread);
    await notify({ recipient: old.recipient, audience: String(old.recipient) === String(thread.buyer) ? "buyer" : "seller", type: "offer_changed", title: "Offer revised", message: `The price offer is now ₹${data.amount.toLocaleString("en-IN")}.`, chat: thread._id, chatMessage: next._id, product: thread.product });
    return next.toObject();
};

const validateMeetupTime = (value) => {
    if (!(value instanceof Date) || Number.isNaN(value.valueOf()) || value <= new Date()) fail("Choose a future meetup time");
    if (value > new Date(Date.now() + 180 * 86400000)) fail("Meetup must be within the next 180 days");
};
const validateLocationHours = (location, meetupAt) => {
    const local = meetupAt.toLocaleTimeString("en-GB", { timeZone: process.env.APP_TIME_ZONE || "Asia/Kolkata", hour: "2-digit", minute: "2-digit", hour12: false });
    if (local < location.startTime || local > location.endTime) fail(`Choose a time between ${location.startTime} and ${location.endTime}`);
};
const proposeMeetup = async (userId, input = {}) => {
    const data = parse(meetupSchema, input); validateMeetupTime(data.meetupAt);
    const thread = await getThread(userId, data.threadId);
    const existing = await ChatMessage.findOne({ sender: userId, clientId: data.clientId }).lean();
    if (existing) { if (String(existing.thread) !== data.threadId) fail("Message identifier already used", 409); return existing; }
    if (thread.activeMeetup && await ChatMessage.exists({ _id: thread.activeMeetup, meetupStatus: { $in: ["proposed", "accepted"] } })) fail("Respond to or change the active meetup proposal first", 409);
    const location = await MeetingLocation.findOne({ _id: data.locationId, active: true }).lean();
    if (!location) fail("Meeting location is unavailable", 404); validateLocationHours(location, data.meetupAt);
    const recipient = other(thread, userId);
    let message;
    try { message = await ChatMessage.create({ thread: thread._id, sender: userId, recipient, clientId: data.clientId, kind: "meetup", meetupStatus: "proposed", meetingLocation: location._id, meetupAt: data.meetupAt }); }
    catch (error) { if (error.code === 11000) fail("Another meetup proposal is already active", 409); throw error; }
    await touch(thread._id, message, { activeMeetup: message._id }); notifyThread(thread);
    await notify({ recipient, audience: String(recipient) === String(thread.buyer) ? "buyer" : "seller", type: "meetup_changed", title: "Campus meetup proposed", message: `${location.name} was proposed as the handoff location.`, chat: thread._id, chatMessage: message._id, product: thread.product });
    return message.toObject();
};
const respondToMeetup = async (userId, input = {}) => {
    const data = parse(z.object({ threadId: id, messageId: id, decision: z.enum(["accepted", "declined"]) }), input);
    const thread = await getThread(userId, data.threadId);
    const current = await ChatMessage.findOne({ _id: data.messageId, thread: data.threadId, recipient: userId, kind: "meetup" }).lean();
    if (!current) fail("Meetup proposal not found", 404);
    if (current.meetupStatus === data.decision) return current;
    const meetup = await ChatMessage.findOneAndUpdate({ _id: data.messageId, meetupStatus: "proposed" }, { $set: { meetupStatus: data.decision, respondedAt: new Date() } }, { new: true }).lean();
    if (!meetup) fail("Only an active meetup proposal can be answered", 409);
    if (data.decision === "declined") await ChatThread.updateOne({ _id: thread._id, activeMeetup: meetup._id }, { $unset: { activeMeetup: 1 } });
    await systemMessage(thread, userId, `Meetup proposal ${data.decision}.`); notifyThread(thread);
    await notify({ recipient: meetup.sender, audience: String(meetup.sender) === String(thread.buyer) ? "buyer" : "seller", type: "meetup_changed", title: `Meetup ${data.decision}`, message: `Your campus meetup proposal was ${data.decision}.`, chat: thread._id, chatMessage: meetup._id, product: thread.product });
    return meetup;
};
const changeMeetup = async (userId, input = {}) => {
    const data = parse(meetupSchema.extend({ messageId: id }), input); validateMeetupTime(data.meetupAt);
    const thread = await getThread(userId, data.threadId);
    const existing = await ChatMessage.findOne({ sender: userId, clientId: data.clientId }).lean();
    if (existing) { if (String(existing.thread) !== data.threadId || String(existing.replacesMeetup) !== data.messageId) fail("Message identifier already used", 409); return existing; }
    const location = await MeetingLocation.findOne({ _id: data.locationId, active: true }).lean();
    if (!location) fail("Meeting location is unavailable", 404); validateLocationHours(location, data.meetupAt);
    const old = await ChatMessage.findOneAndUpdate({ _id: data.messageId, thread: data.threadId, kind: "meetup", meetupStatus: { $in: ["proposed", "accepted"] } }, { $set: { meetupStatus: "changed", respondedAt: new Date() } }, { new: false }).lean();
    if (!old) fail("This meetup can no longer be changed", 409);
    const recipient = other(thread, userId);
    let next;
    try { next = await ChatMessage.create({ thread: thread._id, sender: userId, recipient, clientId: data.clientId, kind: "meetup", meetupStatus: "proposed", meetingLocation: location._id, meetupAt: data.meetupAt, replacesMeetup: old._id }); }
    catch (error) { await ChatMessage.updateOne({ _id: old._id, meetupStatus: "changed" }, { $set: { meetupStatus: old.meetupStatus }, $unset: { respondedAt: 1 } }); throw error; }
    await touch(thread._id, next, { activeMeetup: next._id }); await systemMessage(thread, userId, `Meetup changed to ${location.name}.`); notifyThread(thread);
    await notify({ recipient, audience: String(recipient) === String(thread.buyer) ? "buyer" : "seller", type: "meetup_changed", title: "Meetup changed", message: `${location.name} was proposed as the new handoff location.`, chat: thread._id, chatMessage: next._id, product: thread.product });
    return next.toObject();
};

const sendImage = async (userId, { threadId, clientId: client, attachment, body = "" }) => {
    const data = parse(z.object({ threadId: id, clientId, body: z.string().trim().max(1000).default("") }), { threadId, clientId: client, body });
    const thread = await getThread(userId, data.threadId);
    const existing = await ChatMessage.findOne({ sender: userId, clientId: data.clientId }).lean();
    if (existing) { if (String(existing.thread) !== data.threadId || existing.kind !== "image") fail("Message identifier already used", 409); return existing; }
    const recipient = other(thread, userId);
    const message = await ChatMessage.create({ thread: thread._id, sender: userId, recipient, clientId: data.clientId, kind: "image", body: data.body, attachment });
    await touch(thread._id, message); notifyThread(thread);
    await notify({ recipient, type: "chat_message", title: "New image", message: "You received an image.", chat: thread._id, chatMessage: message._id, product: thread.product });
    return message.toObject();
};
const markRead = async (userId, { threadId, throughId } = {}) => {
    const thread = await getThread(userId, threadId);
    if (!validId(throughId)) fail("Invalid read position");
    if (!await ChatMessage.exists({ _id: throughId, thread: threadId })) fail("Message not found", 404);
    const result = await ChatMessage.updateMany({ thread: threadId, recipient: userId, readAt: null, _id: { $lte: throughId } }, { $set: { readAt: new Date() } });
    await Notification.updateMany({ recipient: userId, chat: threadId, readAt: null, chatMessage: { $lte: throughId } }, { $set: { readAt: new Date() } });
    if (result.modifiedCount) notifyThread(thread); return { threadId };
};
const continueQuestion = async (userId, questionId) => {
    if (!validId(questionId)) fail("Invalid previous question");
    const question = await require("../models/ProductQuestion").findOne({ _id: questionId, $or: [{ buyer: userId }, { seller: userId }] }).lean();
    if (!question) fail("Previous question not found", 404);
    const key = { product: question.product, buyer: question.buyer, seller: question.seller };
    let thread;
    try { thread = await ChatThread.findOneAndUpdate(key, { $setOnInsert: key }, { upsert: true, new: true }).lean(); }
    catch (error) { if (error.code !== 11000) throw error; thread = await ChatThread.findOne(key).lean(); }
    notifyThread(thread); return thread;
};

module.exports = { OFFER_LIFETIME_MS, getThread, startThread, continueQuestion, sendMessage, sendImage, respondToOffer, withdrawOffer, reviseOffer, expirePendingOffers, proposeMeetup, respondToMeetup, changeMeetup, markRead, sendSchema };
