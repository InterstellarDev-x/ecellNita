// fallow-ignore-file unused-file -- Node's test runner discovers this file without an import.
const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const crypto = require("node:crypto");
const express = require("express");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const { io: createClient } = require("socket.io-client");

const User = require("../models/User");
const Product = require("../models/Product");
const ChatThread = require("../models/ChatThread");
const ChatMessage = require("../models/ChatMessage");
const Notification = require("../models/Notification");
const MeetingLocation = require("../models/MeetingLocation");
const chat = require("../services/chat");
const { attachRealtime } = require("../realtime/server");

process.env.JWT_SECRET = "chat-realtime-integration-secret";

let memoryServer;
let httpServer;
let ioServer;
let baseUrl;
let buyer;
let seller;
let stranger;
let product;
let thread;
let meetingLocation;
const clients = new Set();

const tokenFor = (user) => jwt.sign({ id: String(user._id), email: user.email }, process.env.JWT_SECRET, { expiresIn: "10m" });

const connect = (token) => new Promise((resolve, reject) => {
  const socket = createClient(baseUrl, {
    auth: { token },
    forceNew: true,
    reconnection: false,
    transports: ["websocket"],
  });
  clients.add(socket);
  const timer = setTimeout(() => reject(new Error("Socket connection timed out")), 4000);
  socket.once("connect", () => { clearTimeout(timer); resolve(socket); });
  socket.once("connect_error", (error) => { clearTimeout(timer); reject(error); });
});

const rejectedConnection = (token, options = {}) => new Promise((resolve, reject) => {
  const socket = createClient(baseUrl, { auth: { token }, forceNew: true, reconnection: false, transports: ["websocket"], ...options });
  clients.add(socket);
  const timer = setTimeout(() => reject(new Error("Expected connection rejection")), 4000);
  socket.once("connect", () => { clearTimeout(timer); reject(new Error("Unauthorized socket connected")); });
  socket.once("connect_error", (error) => { clearTimeout(timer); resolve(error); });
});

const emitAck = (socket, event, input) => new Promise((resolve, reject) => {
  const timer = setTimeout(() => reject(new Error(`${event} acknowledgement timed out`)), 4000);
  socket.emit(event, input, (result) => { clearTimeout(timer); resolve(result); });
});

const waitFor = async (predicate, message, timeout = 4000) => {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    if (predicate()) return;
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
  throw new Error(message);
};

test.before(async () => {
  memoryServer = await MongoMemoryServer.create();
  await mongoose.connect(memoryServer.getUri());
  await Promise.all([User.init(), Product.init(), ChatThread.init(), ChatMessage.init(), Notification.init(), MeetingLocation.init()]);

  [buyer, seller, stranger] = await User.create([
    { firstname: "Buyer", lastname: "Student", email: "buyer@nita.ac.in", hashedpassword: "fixture-hash" },
    { firstname: "Seller", lastname: "Student", email: "seller@nita.ac.in", hashedpassword: "fixture-hash" },
    { firstname: "Other", lastname: "Student", email: "other@nita.ac.in", hashedpassword: "fixture-hash" },
  ]);
  product = await Product.create({
    productname: "Desk lamp",
    productdescription: "A working study lamp",
    price: 500,
    images: ["https://example.test/lamp.jpg"],
    owner: seller._id,
  });
  thread = await chat.startThread(String(buyer._id), String(product._id));
  meetingLocation = await MeetingLocation.create({ name: "Student Activity Centre", address: "Main campus", startTime: "00:00", endTime: "23:59", active: true });

  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use("/api/v1/chats", require("../routes/chat"));
  httpServer = http.createServer(app);
  ioServer = attachRealtime(httpServer, {
    cors: { origin: "http://allowed.test", credentials: true },
    allowedOrigins: new Set(["http://allowed.test"]),
  });
  await new Promise((resolve) => httpServer.listen(0, "127.0.0.1", resolve));
  const address = httpServer.address();
  baseUrl = `http://127.0.0.1:${address.port}`;
});

test("offer lifecycle, meetup lifecycle, unified filters, and presence remain participant-scoped", async () => {
  const threadId = String(thread._id);
  const buyerSocket = await connect(tokenFor(buyer));
  const sellerSocket = await connect(tokenFor(seller));
  const strangerSocket = await connect(tokenFor(stranger));

  const offer = await emitAck(buyerSocket, "chat:send", { threadId, clientId: crypto.randomUUID(), kind: "offer", amount: 450, body: "" });
  assert.equal(offer.success, true);
  assert.ok(new Date(offer.data.offerExpiresAt) > new Date());
  let storedThread = await ChatThread.findById(threadId).lean();
  assert.equal(String(storedThread.activeOffer), String(offer.data._id));

  const blockedSecond = await emitAck(sellerSocket, "chat:send", { threadId, clientId: crypto.randomUUID(), kind: "offer", amount: 475, body: "" });
  assert.equal(blockedSecond.success, false);
  assert.match(blockedSecond.message, /active offer|revise or withdraw/i);

  const revisionClientId = crypto.randomUUID();
  const revision = await emitAck(buyerSocket, "chat:offer-revise", { threadId, messageId: String(offer.data._id), clientId: revisionClientId, amount: 440 });
  const repeatedRevision = await emitAck(buyerSocket, "chat:offer-revise", { threadId, messageId: String(offer.data._id), clientId: revisionClientId, amount: 440 });
  assert.equal(revision.success, true);
  assert.equal(String(repeatedRevision.data._id), String(revision.data._id));
  assert.equal((await ChatMessage.findById(offer.data._id).lean()).offerStatus, "revised");

  const unauthorizedWithdraw = await emitAck(strangerSocket, "chat:offer-withdraw", { threadId, messageId: String(revision.data._id) });
  assert.equal(unauthorizedWithdraw.success, false);
  const withdrawn = await emitAck(buyerSocket, "chat:offer-withdraw", { threadId, messageId: String(revision.data._id) });
  assert.equal(withdrawn.success, true);
  assert.equal(withdrawn.data.offerStatus, "withdrawn");
  storedThread = await ChatThread.findById(threadId).lean();
  assert.equal(storedThread.activeOffer, undefined);

  const expiring = await emitAck(buyerSocket, "chat:send", { threadId, clientId: crypto.randomUUID(), kind: "offer", amount: 430, body: "" });
  await ChatMessage.updateOne({ _id: expiring.data._id }, { $set: { offerExpiresAt: new Date(Date.now() - 1000) } });
  assert.equal(await chat.expirePendingOffers({ threadId }), 1);
  assert.equal((await ChatMessage.findById(expiring.data._id).lean()).offerStatus, "expired");
  const acceptExpired = await emitAck(sellerSocket, "chat:offer-response", { threadId, messageId: String(expiring.data._id), decision: "accepted" });
  assert.equal(acceptExpired.success, false);
  assert.match(acceptExpired.message, /expired/i);

  const meetupAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
  const meetup = await emitAck(buyerSocket, "chat:meetup-propose", { threadId, clientId: crypto.randomUUID(), locationId: String(meetingLocation._id), meetupAt });
  assert.equal(meetup.success, true);
  assert.equal(meetup.data.meetupStatus, "proposed");
  const ownMeetupResponse = await emitAck(buyerSocket, "chat:meetup-response", { threadId, messageId: String(meetup.data._id), decision: "accepted" });
  assert.equal(ownMeetupResponse.success, false);
  const acceptedMeetup = await emitAck(sellerSocket, "chat:meetup-response", { threadId, messageId: String(meetup.data._id), decision: "accepted" });
  assert.equal(acceptedMeetup.success, true);
  const changedMeetup = await emitAck(sellerSocket, "chat:meetup-change", { threadId, messageId: String(meetup.data._id), clientId: crypto.randomUUID(), locationId: String(meetingLocation._id), meetupAt });
  assert.equal(changedMeetup.success, true);
  assert.equal((await ChatMessage.findById(meetup.data._id).lean()).meetupStatus, "changed");
  const declinedMeetup = await emitAck(buyerSocket, "chat:meetup-response", { threadId, messageId: String(changedMeetup.data._id), decision: "declined" });
  assert.equal(declinedMeetup.success, true);

  const presence = await emitAck(buyerSocket, "chat:presence-get", { threadId });
  assert.equal(presence.success, true);
  assert.equal(presence.data.userId, String(seller._id));
  assert.equal(presence.data.online, true);

  const unifiedResponse = await fetch(`${baseUrl}/api/v1/chats?mode=all&search=desk`, { headers: { Authorization: `Bearer ${tokenFor(buyer)}` } });
  const unified = await unifiedResponse.json();
  assert.equal(unifiedResponse.status, 200);
  assert.ok(Array.isArray(unified.data));
  assert.equal(String(unified.data[0]._id), threadId);
  const pendingResponse = await fetch(`${baseUrl}/api/v1/chats?mode=offers_pending`, { headers: { Authorization: `Bearer ${tokenFor(buyer)}` } });
  assert.deepEqual((await pendingResponse.json()).data, []);
  assert.ok(await ChatMessage.exists({ thread: threadId, kind: "system" }));
});

test.after(async () => {
  for (const socket of clients) socket.disconnect();
  if (ioServer) await new Promise((resolve) => ioServer.close(resolve));
  if (httpServer?.listening) await new Promise((resolve) => httpServer.close(resolve));
  await mongoose.disconnect();
  if (memoryServer) await memoryServer.stop();
});

test("realtime authentication rejects missing, invalid, and inactive accounts", async () => {
  const missing = await rejectedConnection(undefined);
  assert.match(missing.message, /sign in again/i);
  const invalid = await rejectedConnection("not-a-token");
  assert.match(invalid.message, /sign in again/i);
  const disallowedOrigin = await rejectedConnection(tokenFor(buyer), { extraHeaders: { Origin: "http://untrusted.test" } });
  assert.match(disallowedOrigin.message, /websocket error|xhr poll error/i);

  await User.updateOne({ _id: stranger._id }, { accountStatus: "suspended" });
  const inactive = await rejectedConnection(tokenFor(stranger));
  assert.match(inactive.message, /sign in again/i);
  await User.updateOne({ _id: stranger._id }, { accountStatus: "active" });
});

test("chat authorization, idempotency, offer races, persistence, and private notification events", async () => {
  const threadId = String(thread._id);
  const strangerId = String(stranger._id);
  const unknownMessageId = String(new mongoose.Types.ObjectId());

  await assert.rejects(chat.getThread(strangerId, threadId), /Conversation not found/);
  await assert.rejects(chat.sendMessage(strangerId, {
    threadId, clientId: crypto.randomUUID(), kind: "text", body: "intrusion",
  }), /Conversation not found/);
  await assert.rejects(chat.markRead(strangerId, { threadId, throughId: unknownMessageId }), /Conversation not found/);
  await assert.rejects(chat.respondToOffer(strangerId, {
    threadId, messageId: unknownMessageId, decision: "accepted",
  }), /Conversation not found/);

  const buyerSocket = await connect(tokenFor(buyer));
  const sellerSocket = await connect(tokenFor(seller));
  const strangerSocket = await connect(tokenFor(stranger));

  const clientId = crypto.randomUUID();
  const firstSend = await emitAck(buyerSocket, "chat:send", { threadId, clientId, kind: "text", body: "Is this available?" });
  const repeatedSend = await emitAck(buyerSocket, "chat:send", { threadId, clientId, kind: "text", body: "Is this available?" });
  assert.equal(firstSend.success, true);
  assert.equal(repeatedSend.success, true);
  assert.equal(String(firstSend.data._id), String(repeatedSend.data._id));
  assert.equal(await ChatMessage.countDocuments({ sender: buyer._id, clientId }), 1);

  const strangerSend = await emitAck(strangerSocket, "chat:send", {
    threadId, clientId: crypto.randomUUID(), kind: "text", body: "intrusion",
  });
  const strangerRead = await emitAck(strangerSocket, "chat:read", {
    threadId, throughId: String(firstSend.data._id),
  });
  assert.equal(strangerSend.success, false);
  assert.equal(strangerRead.success, false);
  assert.match(strangerSend.message, /Conversation not found/i);
  assert.match(strangerRead.message, /Conversation not found/i);
  const strangerHistory = await fetch(`${baseUrl}/api/v1/chats/${threadId}/messages`, {
    headers: { Authorization: `Bearer ${tokenFor(stranger)}` },
  });
  assert.equal(strangerHistory.status, 404);

  for (const amount of [0, 425.555, "425.55"]) {
    const invalidOffer = await emitAck(buyerSocket, "chat:send", {
      threadId, clientId: crypto.randomUUID(), kind: "offer", body: "", amount,
    });
    assert.equal(invalidOffer.success, false, `expected offer amount ${amount} to be rejected`);
  }

  const offerSend = await emitAck(buyerSocket, "chat:send", {
    threadId, clientId: crypto.randomUUID(), kind: "offer", body: "", amount: 425.55,
  });
  assert.equal(offerSend.success, true);
  assert.equal(offerSend.data.amount, 425.55);
  const offerId = String(offerSend.data._id);
  const ownResponse = await emitAck(buyerSocket, "chat:offer-response", { threadId, messageId: offerId, decision: "accepted" });
  const strangerResponse = await emitAck(strangerSocket, "chat:offer-response", { threadId, messageId: offerId, decision: "accepted" });
  assert.equal(ownResponse.success, false);
  assert.equal(strangerResponse.success, false);
  assert.match(ownResponse.message, /Offer not found/i);
  assert.match(strangerResponse.message, /Conversation not found/i);

  const race = await Promise.all([
    emitAck(sellerSocket, "chat:offer-response", { threadId, messageId: offerId, decision: "accepted" }),
    emitAck(sellerSocket, "chat:offer-response", { threadId, messageId: offerId, decision: "declined" }),
  ]);
  assert.equal(race.filter((result) => result.success).length, 1);
  assert.equal(race.filter((result) => !result.success && /already been answered/i.test(result.message)).length, 1);
  const persistedOffer = await ChatMessage.findById(offerId).lean();
  assert.ok(["accepted", "declined"].includes(persistedOffer.offerStatus));

  buyerSocket.disconnect();
  const offlineBody = "Sent while the buyer is offline";
  const offlineSend = await emitAck(sellerSocket, "chat:send", {
    threadId, clientId: crypto.randomUUID(), kind: "text", body: offlineBody,
  });
  assert.equal(offlineSend.success, true);
  const reconnectedBuyer = await connect(tokenFor(buyer));
  assert.equal(reconnectedBuyer.connected, true);
  const historyResponse = await fetch(`${baseUrl}/api/v1/chats/${threadId}/messages`, {
    headers: { Authorization: `Bearer ${tokenFor(buyer)}` },
  });
  assert.equal(historyResponse.status, 200);
  const history = await historyResponse.json();
  assert.equal(history.success, true);
  assert.ok(history.data.messages.some((message) => message.body === offlineBody));

  const laterSend = await emitAck(sellerSocket, "chat:send", {
    threadId, clientId: crypto.randomUUID(), kind: "text", body: "This one should stay unread",
  });
  assert.equal(laterSend.success, true);
  const inboxResponse = await fetch(`${baseUrl}/api/v1/chats?audience=buyer`, {
    headers: { Authorization: `Bearer ${tokenFor(buyer)}` },
  });
  const inbox = await inboxResponse.json();
  assert.equal(inboxResponse.status, 200);
  assert.equal(inbox.data[0].lastMessage.body, "This one should stay unread");
  assert.equal(String(inbox.data[0].lastMessage.sender), String(seller._id));
  const readResult = await emitAck(reconnectedBuyer, "chat:read", {
    threadId, throughId: String(offlineSend.data._id),
  });
  assert.equal(readResult.success, true);
  const [readMessage, unreadMessage, readNotification, unreadNotification] = await Promise.all([
    ChatMessage.findById(offlineSend.data._id).lean(),
    ChatMessage.findById(laterSend.data._id).lean(),
    Notification.findOne({ recipient: buyer._id, chatMessage: offlineSend.data._id, type: "chat_message" }).lean(),
    Notification.findOne({ recipient: buyer._id, chatMessage: laterSend.data._id, type: "chat_message" }).lean(),
  ]);
  assert.ok(readMessage.readAt instanceof Date);
  assert.equal(unreadMessage.readAt ?? null, null);
  assert.ok(readNotification.readAt instanceof Date);
  assert.equal(unreadNotification.readAt ?? null, null);

  const recipientEvents = [];
  const sellerEvents = [];
  const strangerEvents = [];
  reconnectedBuyer.on("notifications:changed", () => recipientEvents.push(Date.now()));
  sellerSocket.on("notifications:changed", () => sellerEvents.push(Date.now()));
  strangerSocket.on("notifications:changed", () => strangerEvents.push(Date.now()));

  const created = await Notification.create({
    recipient: buyer._id, type: "chat_message", title: "Fixture notification", message: "Created",
    chat: thread._id, product: product._id,
  });
  await waitFor(() => recipientEvents.length >= 1, "Recipient did not receive create event");
  await Notification.updateOne({ _id: created._id }, { $set: { readAt: new Date() } });
  await waitFor(() => recipientEvents.length >= 2, "Recipient did not receive update event");
  const upsertId = new mongoose.Types.ObjectId();
  await Notification.updateOne(
    { _id: upsertId, recipient: buyer._id },
    { $setOnInsert: { recipient: buyer._id, type: "chat_message", title: "Upserted", message: "Upserted" } },
    { upsert: true }
  );
  await waitFor(() => recipientEvents.length >= 3, "Recipient did not receive upsert event");
  await Notification.deleteOne({ _id: upsertId });
  await waitFor(() => recipientEvents.length >= 4, "Recipient did not receive delete event");
  await new Promise((resolve) => setTimeout(resolve, 100));
  assert.equal(sellerEvents.length, 0);
  assert.equal(strangerEvents.length, 0);
});


test("request meeting changes persist in chat and reach both participants", async (t) => {
  t.mock.method(require("../utils/EmailQueue"), "sendEmailWithRetry", async () => undefined);
  const controller = require("../controllers/conversation");
  const Request = require("../models/Request");
  const request = await Request.create({ buyer: buyer._id, seller: seller._id, product: product._id, quantity: 1 });
  const buyerSocket = await connect(tokenFor(buyer));
  const sellerSocket = await connect(tokenFor(seller));
  const strangerSocket = await connect(tokenFor(stranger));
  const events = { buyer: [], seller: [], stranger: [] };
  buyerSocket.on("chat:changed", (event) => events.buyer.push(event));
  sellerSocket.on("chat:changed", (event) => events.seller.push(event));
  strangerSocket.on("chat:changed", (event) => events.stranger.push(event));
  const invoke = async (handler, user, fields = {}) => {
    const res = { status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } };
    await handler({ user: { id: String(user._id) }, body: { requestid: String(request._id), ...fields } }, res);
    return res.body;
  };
  const baseline = await ChatMessage.countDocuments({ thread: thread._id, kind: "system" });
  for (const [proposer, responder, date] of [[buyer, seller, "2099-09-01"], [seller, buyer, "2099-09-02"]]) {
    assert.equal((await invoke(controller.shedulemeet, proposer, { locationId: String(meetingLocation._id), date, time: "14:00" })).success, true);
    assert.equal((await invoke(controller.accept_shedule, proposer)).success, false);
    assert.equal((await invoke(controller.accept_shedule, responder)).success, true);
    assert.equal((await invoke(controller.accept_shedule, responder)).success, true);
  }
  assert.equal((await invoke(controller.delete_shedule_data, stranger)).success, false);
  assert.equal((await invoke(controller.delete_shedule_data, buyer)).success, true);
  assert.equal((await invoke(controller.delete_shedule_data, buyer)).success, true);
  const history = await ChatMessage.find({ thread: thread._id, kind: "system" }).sort({ _id: 1 }).skip(baseline).lean();
  assert.equal(history.length, 5, "Repeated confirmation/cancellation must not duplicate updates");
  assert.match(history[0].body, /Buyer proposed.*2099-09-01.*14:00/);
  assert.match(history[1].body, /Seller confirmed/);
  assert.match(history[2].body, /Seller proposed.*2099-09-02/);
  assert.match(history[3].body, /Buyer confirmed/);
  assert.match(history[4].body, /Buyer cancelled/);
  assert.equal(String(history[1].recipient), String(buyer._id));
  assert.equal(String(history[3].recipient), String(seller._id));
  await waitFor(() => events.buyer.length >= 5 && events.seller.length >= 5, "Meeting updates did not reach both participants");
  assert.ok(events.buyer.every((event) => event.threadId === String(thread._id)));
  assert.equal(events.stranger.length, 0);
});
