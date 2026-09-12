const mongoose = require("mongoose");
const ChatThread = require("../models/ChatThread");
const ChatMessage = require("../models/ChatMessage");
const chat = require("../services/chat");
const run = (fn) => async (req, res) => {
    try { return res.json({ success: true, data: await fn(req) }); }
    catch (error) { return res.status(error.status || 500).json({ success: false, message: error.status ? error.message : "Could not load this conversation" }); }
};
exports.start = run((req) => chat.startThread(req.user.id, req.body.productid));
exports.continueQuestion = run((req) => chat.continueQuestion(req.user.id, req.body.questionId));
exports.detail = run(async (req) => {
    await chat.getThread(req.user.id, req.params.threadId);
    return ChatThread.findById(req.params.threadId).populate("product", "productname images price status").populate("buyer seller", "firstname lastname image").lean();
});
exports.list = run(async (req) => {
    const field = req.query.audience === "seller" ? "seller" : "buyer";
    const threads = await ChatThread.find({ [field]: req.user.id }).populate("product", "productname images price status")
        .populate("buyer seller", "firstname lastname image").sort({ lastMessageAt: -1 }).limit(100).lean();
    const unread = await ChatMessage.aggregate([
        { $match: { recipient: new mongoose.Types.ObjectId(req.user.id), readAt: null } },
        { $group: { _id: "$thread", count: { $sum: 1 } } },
    ]);
    const counts = new Map(unread.map((row) => [String(row._id), row.count]));
    return threads.map((thread) => ({ ...thread, unreadCount: counts.get(String(thread._id)) || 0 }));
});
exports.messages = run(async (req) => {
    await chat.getThread(req.user.id, req.params.threadId);
    const filter = { thread: req.params.threadId };
    if (req.query.before) {
        if (!mongoose.isObjectIdOrHexString(req.query.before)) throw Object.assign(new Error("Invalid page cursor"), { status: 400 });
        filter._id = { $lt: req.query.before };
    }
    const messages = await ChatMessage.find(filter).sort({ _id: -1 }).limit(51).lean();
    const hasMore = messages.length > 50;
    const page = messages.slice(0, 50);
    return { messages: page.reverse(), nextCursor: hasMore ? String(page[0]._id) : null };
});
