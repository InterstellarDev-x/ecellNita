const mongoose = require("mongoose");
const ChatThread = require("../models/ChatThread");
const ChatMessage = require("../models/ChatMessage");
const chat = require("../services/chat");
const { getPresence } = require("../realtime/presence");
const { cloudinaryuploader } = require("../utils/cloudinaryuploader");
const cloudinary = require("cloudinary").v2;
const fs = require("node:fs/promises");
const { validateChatImage, validateChatImageContent, CHAT_IMAGE_TRANSFORMATION } = require("../utils/chatImageUpload");
const { z } = require("zod");
const run = (fn) => async (req, res) => {
    try { return res.json({ success: true, data: await fn(req) }); }
    catch (error) { return res.status(error.status || 500).json({ success: false, message: error.status ? error.message : "Could not load this conversation" }); }
};
exports.start = run((req) => chat.startThread(req.user.id, req.body.productid));
exports.continueQuestion = run((req) => chat.continueQuestion(req.user.id, req.body.questionId));
exports.detail = run(async (req) => {
    await chat.getThread(req.user.id, req.params.threadId);
    const thread = await ChatThread.findById(req.params.threadId).populate("product", "productname images price status")
        .populate({ path: "buyer seller", select: "firstname lastname image additionaldetails", populate: { path: "additionaldetails", select: "department hostel enrollmentno" } })
        .populate("activeOffer").populate({ path: "activeMeetup", populate: { path: "meetingLocation", select: "name address startTime endTime active" } }).lean();
    for (const key of ["buyer", "seller"]) {
        const profile = thread[key]?.additionaldetails;
        if (profile) { profile.verified = Boolean(profile.enrollmentno); delete profile.enrollmentno; }
        thread[key].presence = getPresence(thread[key]._id);
    }
    return thread;
});
exports.list = run(async (req) => {
    await chat.expirePendingOffers();
    const audience = req.query.audience;
    const mode = req.query.mode || req.query.filter || "all";
    if (audience && !["buyer", "seller"].includes(audience)) throw Object.assign(new Error("Invalid audience"), { status: 400 });
    if (!["all", "buying", "selling", "offers_pending"].includes(mode)) throw Object.assign(new Error("Invalid chat filter"), { status: 400 });
    const role = audience || (mode === "buying" ? "buyer" : mode === "selling" ? "seller" : null);
    const threadFilter = role ? { [role]: req.user.id } : { $or: [{ buyer: req.user.id }, { seller: req.user.id }] };
    if (mode === "offers_pending") threadFilter.activeOffer = { $exists: true };
    let threads = await ChatThread.find(threadFilter).populate("product", "productname images price status")
        .populate({ path: "buyer seller", select: "firstname lastname image additionaldetails", populate: { path: "additionaldetails", select: "department hostel enrollmentno" } })
        .populate("activeOffer").populate({ path: "activeMeetup", populate: { path: "meetingLocation", select: "name address startTime endTime active" } }).sort({ lastMessageAt: -1 }).limit(100).lean();
    const search = typeof req.query.search === "string" ? req.query.search.trim().toLocaleLowerCase() : "";
    if (search.length > 100) throw Object.assign(new Error("Search is too long"), { status: 400 });
    if (search) threads = threads.filter((thread) => {
        const participant = String(thread.buyer?._id) === String(req.user.id) ? thread.seller : thread.buyer;
        return [thread.product?.productname, participant?.firstname, participant?.lastname, participant?.additionaldetails?.department, participant?.additionaldetails?.hostel]
            .filter(Boolean).some((value) => String(value).toLocaleLowerCase().includes(search));
    });
    const unread = await ChatMessage.aggregate([
        { $match: { recipient: new mongoose.Types.ObjectId(req.user.id), readAt: null } },
        { $group: { _id: "$thread", count: { $sum: 1 } } },
    ]);
    const latestMessages = threads.length ? await ChatMessage.aggregate([
        { $match: { thread: { $in: threads.map((thread) => thread._id) } } },
        { $sort: { _id: -1 } },
        { $group: {
            _id: "$thread",
            message: { $first: {
                _id: "$_id",
                sender: "$sender",
                kind: "$kind",
                body: "$body",
                amount: "$amount",
                offerStatus: "$offerStatus",
                offerExpiresAt: "$offerExpiresAt",
                meetupStatus: "$meetupStatus",
                meetingLocation: "$meetingLocation",
                meetupAt: "$meetupAt",
                attachment: "$attachment",
                createdAt: "$createdAt",
            } },
        } },
    ]) : [];
    const counts = new Map(unread.map((row) => [String(row._id), row.count]));
    const previews = new Map(latestMessages.map((row) => [String(row._id), row.message]));
    return threads.map((thread) => {
        for (const key of ["buyer", "seller"]) {
            const profile = thread[key]?.additionaldetails;
            if (profile) { profile.verified = Boolean(profile.enrollmentno); delete profile.enrollmentno; }
            if (thread[key]) thread[key].presence = getPresence(thread[key]._id);
        }
        return ({ ...thread,
        unreadCount: counts.get(String(thread._id)) || 0,
        lastMessage: previews.get(String(thread._id)) || null,
        });
    });
});
exports.messages = run(async (req) => {
    await chat.getThread(req.user.id, req.params.threadId);
    await chat.expirePendingOffers({ threadId: req.params.threadId });
    const filter = { thread: req.params.threadId };
    if (req.query.before) {
        if (!mongoose.isObjectIdOrHexString(req.query.before)) throw Object.assign(new Error("Invalid page cursor"), { status: 400 });
        filter._id = { $lt: req.query.before };
    }
    const messages = await ChatMessage.find(filter).populate("meetingLocation", "name address startTime endTime active").sort({ _id: -1 }).limit(51).lean();
    const hasMore = messages.length > 50;
    const page = messages.slice(0, 50);
    return { messages: page.reverse(), nextCursor: hasMore ? String(page[0]._id) : null };
});

exports.uploadImage = async (req, res) => {
    let uploaded;
    try {
        await chat.getThread(req.user.id, req.params.threadId);
        const clientId = z.string().uuid().safeParse(req.body.clientId);
        if (!clientId.success) return res.status(400).json({ success: false, message: "Invalid message identifier" });
        const existing = await ChatMessage.findOne({ sender: req.user.id, clientId: clientId.data }).lean();
        if (existing) {
            if (String(existing.thread) !== req.params.threadId || existing.kind !== "image") return res.status(409).json({ success: false, message: "Message identifier already used" });
            return res.json({ success: true, data: existing });
        }
        const file = validateChatImage(req.files?.image);
        await validateChatImageContent(file);
        uploaded = await cloudinaryuploader(file, "chat-images", null, null, { type: "authenticated", resource_type: "image", transformation: CHAT_IMAGE_TRANSFORMATION });
        await fs.unlink(file.tempFilePath).catch(() => undefined);
        const message = await chat.sendImage(req.user.id, {
            threadId: req.params.threadId, clientId: req.body.clientId,
            body: req.body.body,
            attachment: { url: cloudinary.url(uploaded.public_id, { type: "authenticated", resource_type: "image", secure: true, sign_url: true }), publicId: uploaded.public_id,
                mimeType: file.mimetype, bytes: file.size, width: uploaded.width, height: uploaded.height },
        });
        return res.status(201).json({ success: true, data: message });
    } catch (error) {
        if (uploaded?.public_id) cloudinary.uploader.destroy(uploaded.public_id, { type: "authenticated", resource_type: "image", invalidate: true }).catch(() => undefined);
        if (req.files?.image?.tempFilePath) fs.unlink(req.files.image.tempFilePath).catch(() => undefined);
        return res.status(error.status || 500).json({ success: false, message: error.status ? error.message : "Could not upload this image" });
    }
};

exports.meetingLocations = run(() => require("../models/MeetingLocation").find({ active: true }).select("name address startTime endTime").sort({ name: 1 }).lean());
