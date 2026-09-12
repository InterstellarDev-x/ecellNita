import React, { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Check, CheckCheck, IndianRupee, MessageCircle, Send, Wifi, WifiOff } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useNotifications } from "../../../hooks/useQuestionQueries";
import { chatUserId, useChatMessages, useChats, useChatThread } from "../../../hooks/useChatQueries";
import { emitAcknowledged, useRealtime } from "../../../realtime/RealtimeProvider";
import LegacyQuestions from "./LegacyQuestions";
import "./Chat.css";

const money = (amount) => `₹${Number(amount).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
const personName = (person) => [person?.firstname, person?.lastname].filter(Boolean).join(" ") || "Campus member";
const time = (date) => new Date(date).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

function ChatConversation({ thread, audience, onBack }) {
  const { socket, connected } = useRealtime();
  const client = useQueryClient();
  const query = useChatMessages(thread._id);
  const notifications = useNotifications();
  const messages = useMemo(() => [...(query.data?.pages || [])].reverse().flatMap((page) => page.messages), [query.data]);
  const userId = chatUserId();
  const other = audience === "seller" ? thread.buyer : thread.seller;
  const [body, setBody] = useState("");
  const [amount, setAmount] = useState("");
  const [offerMode, setOfferMode] = useState(false);
  const [sending, setSending] = useState(false);
  const [responding, setResponding] = useState(null);
  const [error, setError] = useState("");
  const [typing, setTyping] = useState(false);
  const pending = useRef(null);
  const bottom = useRef(null);
  const lastTyping = useRef(0);
  const readThrough = useRef(null);
  const lastMessageId = messages.at(-1)?._id;
  const unreadIds = messages.filter((message) => message.recipient === userId && !message.readAt).map((message) => message._id).join(",");
  const unreadNotifications = (notifications.data?.notifications || []).filter((item) => item.chat === thread._id && !item.readAt).map((item) => item._id).join(",");
  useEffect(() => { bottom.current?.scrollIntoView({ block: "nearest" }); }, [lastMessageId]);
  useEffect(() => {
    if (!socket || !connected || !lastMessageId || (!unreadIds && !unreadNotifications)) return;
    const readKey = `${lastMessageId}:${unreadIds}:${unreadNotifications}`;
    const read = () => {
      if (document.visibilityState !== "visible" || readThrough.current === readKey) return;
      readThrough.current = readKey;
      emitAcknowledged(socket, "chat:read", { threadId: thread._id, throughId: lastMessageId })
        .catch(() => { readThrough.current = null; });
    };
    read();
    document.addEventListener("visibilitychange", read);
    return () => document.removeEventListener("visibilitychange", read);
  }, [socket, connected, thread._id, lastMessageId, unreadIds, unreadNotifications]);
  useEffect(() => {
    let timer;
    const update = (event) => {
      if (event.threadId !== thread._id) return;
      setTyping(event.typing);
      clearTimeout(timer);
      timer = setTimeout(() => setTyping(false), 3000);
    };
    socket?.on("chat:typing", update);
    return () => { socket?.off("chat:typing", update); clearTimeout(timer); };
  }, [socket, thread._id]);
  const updateBody = (value) => {
    setBody(value); pending.current = null;
    if (connected && Date.now() - lastTyping.current > 1500) {
      lastTyping.current = Date.now();
      emitAcknowledged(socket, "chat:typing", { threadId: thread._id, typing: Boolean(value) }).catch(() => {});
    }
  };
  const refresh = () => {
    client.invalidateQueries({ queryKey: ["chats"] });
    client.invalidateQueries({ queryKey: ["chat-messages", userId, thread._id] });
  };
  const send = async (event) => {
    event.preventDefault();
    if (sending) return;
    if (offerMode && (!Number.isFinite(Number(amount)) || Number(amount) < 1 || Number(amount) > 10000000)) { setError("Enter an offer between ₹1 and ₹1,00,00,000."); return; }
    if (!offerMode && !body.trim()) return;
    const payload = pending.current || { threadId: thread._id, clientId: crypto.randomUUID(), kind: offerMode ? "offer" : "text", body: body.trim(), ...(offerMode ? { amount: Number(amount) } : {}) };
    pending.current = payload;
    setSending(true); setError("");
    try {
      await emitAcknowledged(socket, "chat:send", payload);
      pending.current = null; setBody(""); setAmount(""); setOfferMode(false);
      refresh();
      emitAcknowledged(socket, "chat:typing", { threadId: thread._id, typing: false }).catch(() => {});
    } catch (err) { setError(err.message); }
    finally { setSending(false); }
  };
  const respond = async (messageId, decision) => {
    if (responding) return;
    setResponding(messageId); setError("");
    try { await emitAcknowledged(socket, "chat:offer-response", { threadId: thread._id, messageId, decision }); refresh(); }
    catch (err) { setError(err.message); }
    finally { setResponding(null); }
  };
  return <section className="campus-chat__conversation" aria-label={`Chat with ${personName(other)}`}>
    <header className="campus-chat__header">
      <button className="campus-chat__back" type="button" onClick={onBack} aria-label="Back to conversations"><ArrowLeft size={20} /></button>
      <img src={thread.product?.images?.[0] || "/logo192.png"} alt="" />
      <div><strong>{personName(other)}</strong><small>{thread.product?.productname || "Listing removed"} {thread.product && `· ${money(thread.product.price)}`}</small></div>
      {audience === "buyer" && thread.product && <Link to={`/buyer/products/${thread.product._id}`}>View listing</Link>}
    </header>
    <div className="campus-chat__messages" role="log" aria-label="Conversation messages" aria-live="polite">
      {query.hasNextPage && <button className="campus-chat__older" type="button" onClick={() => query.fetchNextPage()} disabled={query.isFetchingNextPage}>{query.isFetchingNextPage ? "Loading…" : "Load earlier messages"}</button>}
      {query.isLoading ? <p className="campus-chat__hint">Loading messages…</p> : query.isError ? <div className="campus-chat__hint" role="alert">Could not load messages. <button type="button" onClick={() => query.refetch()}>Retry</button></div> : messages.length === 0 && <p className="campus-chat__hint">Say hello, ask about the listing, or make a price offer.</p>}
      {messages.map((message, index) => {
        const mine = message.sender === userId;
        const newDay = !index || new Date(messages[index - 1].createdAt).toDateString() !== new Date(message.createdAt).toDateString();
        return <React.Fragment key={message._id}>
          {newDay && <div className="campus-chat__day">{new Date(message.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</div>}
          <article className={`campus-chat__bubble ${mine ? "is-mine" : ""} ${message.kind === "offer" ? "is-offer" : ""}`}>
            {message.kind === "offer" && <div className="campus-chat__offer"><span><IndianRupee size={15} /> {mine ? "Your price offer" : "Price offer"}</span><strong>{money(message.amount)}</strong><small className={`offer-${message.offerStatus}`}>{message.offerStatus === "pending" ? "Awaiting response" : `Offer ${message.offerStatus}`}</small></div>}
            {message.body && <p>{message.body}</p>}
            {message.kind === "offer" && message.offerStatus === "pending" && !mine && <div className="campus-chat__offer-actions"><button type="button" disabled={!connected || Boolean(responding)} onClick={() => respond(message._id, "accepted")}>{responding === message._id ? "Saving…" : "Accept"}</button><button type="button" disabled={!connected || Boolean(responding)} onClick={() => respond(message._id, "declined")}>Decline</button></div>}
            {message.offerStatus === "accepted" && <small className="campus-chat__agreement">Price agreed. Arrange your request and pickup separately.</small>}
            <footer><time dateTime={message.createdAt}>{time(message.createdAt)}</time>{mine && <span aria-label={message.readAt ? "Read" : "Sent"} title={message.readAt ? "Read" : "Sent"}>{message.readAt ? <CheckCheck size={15} /> : <Check size={15} />}</span>}</footer>
          </article>
        </React.Fragment>;
      })}
      <div ref={bottom} />
    </div>
    <div className="campus-chat__typing" aria-live="polite">{typing ? `${personName(other)} is typing…` : ""}</div>
    <form className="campus-chat__composer" onSubmit={send}>
      {!connected && <p className="campus-chat__connection-note">Connecting to live chat… Your draft stays here.</p>}
      {error && <p role="alert" className="campus-chat__error">{error}</p>}
      {offerMode && <label className="campus-chat__amount">Your offer (₹)<input type="number" aria-label="Offer amount" min="1" max="10000000" step="0.01" required value={amount} disabled={sending} onChange={(event) => { setAmount(event.target.value); pending.current = null; }} placeholder="Enter price" /></label>}
      <div className="campus-chat__compose-row"><textarea aria-label="Message" value={body} disabled={sending} onChange={(event) => updateBody(event.target.value)} maxLength={1000} rows={2} placeholder={offerMode ? "Add a note to your offer (optional)" : "Write a message…"} /><button type="submit" aria-label={offerMode ? "Send offer" : "Send message"} disabled={!connected || sending || (!offerMode && !body.trim())}><Send size={19} /><span>{sending ? "Sending…" : offerMode ? "Send offer" : "Send"}</span></button></div>
      <div className="campus-chat__compose-tools"><button type="button" aria-pressed={offerMode} disabled={sending || thread.product?.status !== "Forsale"} onClick={() => { setOfferMode(!offerMode); pending.current = null; }}><IndianRupee size={15} />{offerMode ? "Cancel offer" : "Make an offer"}</button><small>{body.length}/1000</small></div>
    </form>
  </section>;
}

export default function PrivateQuestions({ audience, embedded = false }) {
  const [params, setParams] = useSearchParams();
  const query = useChats(audience);
  const { connected } = useRealtime();
  const threads = query.data || [];
  const selectedId = params.get("chat");
  const listedThread = threads.find((item) => item._id === selectedId);
  const detail = useChatThread(selectedId, !listedThread);
  const thread = listedThread || detail.data;
  const [legacy, setLegacy] = useState(false);
  const select = (id) => setParams((current) => { const next = new URLSearchParams(current); if (id) next.set("chat", id); else next.delete("chat"); return next; });
  return <div className={`campus-chat ${embedded ? "is-embedded" : ""}`}>
    <div className="campus-chat__title"><div><span>PRIVATE CONVERSATIONS</span><h1>Messages</h1><p>Talk details. Find a fair price. Meet on campus.</p></div><span className={`campus-chat__live ${connected ? "is-connected" : ""}`}>{connected ? <Wifi size={15} /> : <WifiOff size={15} />}{connected ? "Live" : "Reconnecting"}</span></div>
    <div className={`campus-chat__layout ${thread ? "has-selection" : ""}`}>
      <aside className="campus-chat__inbox" aria-label="Conversations"><header><strong>Your conversations</strong><span>{threads.length}</span></header>
        {query.isLoading ? <p>Loading conversations…</p> : query.isError ? <p role="alert">Could not load conversations. <button type="button" onClick={() => query.refetch()}>Retry</button></p> : threads.length === 0 ? <div className="campus-chat__empty"><MessageCircle size={30} /><strong>No conversations yet</strong><p>{audience === "seller" ? "Buyer messages about your listings will appear here." : "Open a listing and choose Chat with seller."}</p></div> : threads.map((item) => <button key={item._id} type="button" className={`campus-chat__thread ${item._id === selectedId ? "is-active" : ""}`} onClick={() => select(item._id)} aria-current={item._id === selectedId ? "true" : undefined}><img src={item.product?.images?.[0] || "/logo192.png"} alt="" /><span><strong>{personName(audience === "seller" ? item.buyer : item.seller)}</strong><small>{item.product?.productname || "Listing removed"}</small><time>{new Date(item.lastMessageAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</time></span>{item.unreadCount > 0 && <b aria-label={`${item.unreadCount} unread messages`}>{item.unreadCount}</b>}</button>)}
      </aside>
      {thread ? <ChatConversation key={thread._id} thread={thread} audience={audience} onBack={() => select(null)} /> : <section className="campus-chat__placeholder"><MessageCircle size={42} /><h2>{selectedId ? "Conversation unavailable" : "A good deal starts with a conversation"}</h2><p>{selectedId ? "Choose a conversation from your inbox." : "Select a chat to send messages and negotiate a price."}</p></section>}
    </div>
    <details className="campus-chat__legacy" onToggle={(event) => setLegacy(event.currentTarget.open)}><summary>Previous questions & replies</summary>{legacy && <LegacyQuestions audience={audience} embedded />}</details>
  </div>;
}
