const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { setServer, userRoom, emitToUsers } = require("./events");
const chat = require("../services/chat");

function attachRealtime(httpServer, { cors, allowedOrigins } = {}) {
    const io = new Server(httpServer, {
        cors, maxHttpBufferSize: 16384,
        allowRequest: (req, done) => done(null, !req.headers.origin || !allowedOrigins || allowedOrigins.has(req.headers.origin.replace(/\/$/, ""))),
    });
    setServer(io);
    io.use(async (socket, next) => {
        try {
            const claims = jwt.verify(socket.handshake.auth?.token, process.env.JWT_SECRET);
            const user = await User.findById(claims.id).select("accountStatus").lean();
            if (!user || (user.accountStatus && user.accountStatus !== "active")) throw new Error();
            socket.data.userId = String(user._id);
            socket.data.expiresAt = claims.exp * 1000;
            next();
        } catch { next(new Error("Please sign in again to connect to live updates")); }
    });
    io.on("connection", (socket) => {
        const userId = socket.data.userId;
        socket.join(userRoom(userId));
        const expiration = setTimeout(() => socket.disconnect(true), Math.max(0, socket.data.expiresAt - Date.now()));
        expiration.unref();
        let windowStart = Date.now();
        let operations = 0;
        const handle = (event, action) => socket.on(event, async (input, acknowledge) => {
            if (typeof acknowledge !== "function") return;
            try {
                if (Date.now() - windowStart > 60000) { windowStart = Date.now(); operations = 0; }
                if (++operations > 120) throw Object.assign(new Error("Too many messages. Please wait a moment."), { status: 429 });
                const user = await User.findById(userId).select("accountStatus").lean();
                if (Date.now() >= socket.data.expiresAt || !user || (user.accountStatus && user.accountStatus !== "active")) {
                    acknowledge({ success: false, message: "Please sign in again" });
                    return socket.disconnect(true);
                }
                const data = await action(userId, input);
                acknowledge({ success: true, data });
            } catch (error) {
                if (!error.status) require("../utils/logger").error("Realtime action failed: %s", error.message);
                acknowledge({ success: false, message: error.status ? error.message : "Could not complete this action. Please try again." });
            }
        });
        handle("chat:send", chat.sendMessage);
        handle("chat:offer-response", chat.respondToOffer);
        handle("chat:read", chat.markRead);
        handle("chat:typing", async (id, { threadId, typing } = {}) => {
            const thread = await chat.getThread(id, threadId);
            const other = String(thread.buyer) === id ? thread.seller : thread.buyer;
            emitToUsers([other], "chat:typing", { threadId, typing: Boolean(typing) });
            return {};
        });
        socket.on("disconnect", () => clearTimeout(expiration));
    });
    return io;
}
module.exports = { attachRealtime };
