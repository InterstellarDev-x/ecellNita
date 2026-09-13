import React, { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, CalendarDays, Check, CheckCheck, Clock3, Image as ImageIcon, IndianRupee, MapPin, MessageCircle, Paperclip, Pencil, Search, Send, ShieldCheck, Smile, Trash2, X } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useActiveMeetingLocations } from "../../../hooks/useBuyerQueries";
import { useNotifications } from "../../../hooks/useQuestionQueries";
import { chatUserId, useChatMessages, useChats, useChatThread, useUploadChatImage } from "../../../hooks/useChatQueries";
import { emitAcknowledged, useRealtime } from "../../../realtime/RealtimeProvider";
import LegacyQuestions from "./LegacyQuestions";
import "./Chat.css";

const QUICK_REPLIES = ["Is this still available?", "Is the price negotiable?", "Where can we meet?"];
const QUICK_EMOJIS = ["👍", "😊", "🙏", "✅", "📍", "💸", "🎉", "👋"];
const money = (amount) => `₹${Number(amount || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
const personName = (person) => [person?.firstname, person?.lastname].filter(Boolean).join(" ") || "Campus member";
const entityId = (value) => String(value?._id || value || "");
const time = (date) => date ? new Date(date).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "";
const shortDate = (date) => {
  if (!date) return "";
  const value = new Date(date);
  const today = new Date();
  if (value.toDateString() === today.toDateString()) return time(date);
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
  if (value.toDateString() === yesterday.toDateString()) return "Yesterday";
  return value.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
};
const roleFor = (thread, userId) => entityId(thread.seller) === String(userId) ? "seller" : "buyer";
const otherFor = (thread, userId) => roleFor(thread, userId) === "seller" ? thread.buyer : thread.seller;
const offerFor = (thread, messages = []) => thread.activeOffer || [...messages].reverse().find((message) => message.kind === "offer" && message.offerStatus === "pending");
const meetingFor = (thread) => thread.activeMeetup || thread.meetup || thread.meeting || thread.schedule || null;
const identityLabels = (person) => {
  const details = person?.additionaldetails || person?.additionalDetails || person?.profile || {};
  return [details.hostel || person?.hostel, details.department || person?.department].filter(Boolean).slice(0, 2);
};
const presence = (person) => ({ online: Boolean(person?.online ?? person?.isOnline ?? person?.presence?.online), lastActiveAt: person?.lastActiveAt || person?.lastSeenAt || person?.presence?.lastActiveAt });
const threadPreview = (thread, userId) => {
  const message = thread.lastMessage;
  if (!message) return "Start the conversation";
  const prefix = entityId(message.sender) === String(userId) ? "You: " : "";
  if (message.kind === "offer") return `${prefix}Price offer ${money(message.amount)}`;
  if (message.kind === "image") return `${prefix}Photo`;
  if (["system", "meetup"].includes(message.kind)) return message.body || "Conversation updated";
  return `${prefix}${message.body || "New message"}`;
};
const imageUrlFor = (message) => message.imageUrl || message.attachment?.url || message.attachments?.[0]?.url;

function Identity({ person, compact = false }) {
  const labels = identityLabels(person);
  const verified = person?.verified || person?.isVerified || person?.additionaldetails?.verified || person?.profile?.verified;
  return <span className={`campus-chat__identity${compact ? " is-compact" : ""}`}>
    {verified && <span title="Verified student"><ShieldCheck size={11} /> Verified</span>}
    {labels.map((label) => <span key={label}>{label}</span>)}
  </span>;
}

function ActiveOffer({ offer, userId, connected, busy, onEdit, onWithdraw }) {
  if (!offer) return null;
  const mine = entityId(offer.sender) === String(userId);
  const expiresAt = offer.expiresAt || offer.offerExpiresAt;
  return <aside className="campus-chat__active-offer" aria-label="Active offer">
    <div><span><i /> Active offer</span><strong>{money(offer.amount)}</strong></div>
    <p>{mine ? "Waiting for the other participant's response." : "A price offer is waiting for your response."}</p>
    {expiresAt && <small>Expires {shortDate(expiresAt)} at {time(expiresAt)}</small>}
    {mine && <div className="campus-chat__active-offer-actions"><button type="button" onClick={onEdit} disabled={!connected || busy}><Pencil size={13} /> Edit price</button><button type="button" onClick={onWithdraw} disabled={!connected || busy}><Trash2 size={13} /> Withdraw</button></div>}
  </aside>;
}

function MeetupPanel({ thread, meeting, socket, connected, refresh }) {
  const locationsQuery = useActiveMeetingLocations();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ locationId: "", date: "", time: "" });
  const locations = locationsQuery.data || [];
  const selected = locations.find((location) => location._id === form.locationId);
  const status = meeting?.meetupStatus || meeting?.status;
  const proposedByMe = entityId(meeting?.proposedBy || meeting?.sender) === String(chatUserId());
  const location = meeting?.meetingLocation || meeting?.locationSnapshot || meeting?.location || {};
  const meetingDate = meeting?.meetupAt ? new Date(meeting.meetupAt) : null;
  const propose = async (event) => {
    event.preventDefault(); setBusy(true); setError("");
    const payload = { threadId: thread._id, clientId: crypto.randomUUID(), locationId: form.locationId, meetupAt: `${form.date}T${form.time}:00+05:30` };
    try { await emitAcknowledged(socket, meeting ? "chat:meetup-change" : "chat:meetup-propose", meeting ? { ...payload, messageId: meeting._id } : payload); setOpen(false); refresh(); }
    catch (err) { setError(err.message); } finally { setBusy(false); }
  };
  const accept = async () => {
    setBusy(true); setError("");
    try { await emitAcknowledged(socket, "chat:meetup-response", { threadId: thread._id, messageId: meeting?._id, decision: "accepted" }); refresh(); }
    catch (err) { setError(err.message); } finally { setBusy(false); }
  };
  const decline = async () => {
    setBusy(true); setError("");
    try { await emitAcknowledged(socket, "chat:meetup-response", { threadId: thread._id, messageId: meeting?._id, decision: "declined" }); refresh(); }
    catch (err) { setError(err.message); } finally { setBusy(false); }
  };
  if (!meeting && !open) return <button className="campus-chat__meetup-trigger" type="button" onClick={() => setOpen(true)}><MapPin size={14} /> Plan a campus meetup</button>;
  return <section className="campus-chat__meetup" aria-label="Campus meetup">
    {meeting && !open && <><div className="campus-chat__meetup-summary"><MapPin size={16} /><span><small>{status === "accepted" || status === "confirmed" ? "Meetup confirmed" : "Meetup proposed"}</small><strong>{location.name || meeting.venue || "Campus meeting point"}</strong><span>{meetingDate ? meetingDate.toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : `${meeting.date || ""} ${meeting.time ? `· ${meeting.time}` : ""}`}</span></span></div><div className="campus-chat__meetup-actions">{status === "proposed" && !proposedByMe && <><button type="button" onClick={accept} disabled={!connected || busy}><Check size={13} /> Accept</button><button type="button" onClick={decline} disabled={!connected || busy}>Decline</button></>}{["proposed", "accepted", "confirmed"].includes(status) && <button type="button" onClick={() => setOpen(true)} disabled={busy}>Change</button>}</div></>}
    {open && <form onSubmit={propose}><div className="campus-chat__meetup-form-title"><span><MapPin size={14} /> Safe meetup</span><button type="button" onClick={() => setOpen(false)} aria-label="Close meetup planner"><X size={15} /></button></div><label>Campus location<select aria-label="Campus location" value={form.locationId} required onChange={(event) => setForm((current) => ({ ...current, locationId: event.target.value, time: "" }))}><option value="">Choose an approved location</option>{locations.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}</select></label><div><label><CalendarDays size={13} /> Date<input aria-label="Meetup date" type="date" min={new Date().toLocaleDateString("en-CA")} value={form.date} required onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))} /></label><label><Clock3 size={13} /> Time<input aria-label="Meetup time" type="time" min={selected?.startTime} max={selected?.endTime} disabled={!selected} value={form.time} required onChange={(event) => setForm((current) => ({ ...current, time: event.target.value }))} /></label></div>{error && <p role="alert">{error}</p>}<button type="submit" disabled={!connected || busy || !form.locationId || !form.date || !form.time}>{busy ? "Sending…" : "Send meetup proposal"}</button></form>}
  </section>;
}

function ChatConversation({ thread, routeAudience, onBack }) {
  const { socket, connected } = useRealtime();
  const client = useQueryClient();
  const query = useChatMessages(thread._id);
  const uploadImage = useUploadChatImage();
  const notifications = useNotifications();
  const messages = useMemo(() => [...(query.data?.pages || [])].reverse().flatMap((page) => page.messages), [query.data]);
  const userId = chatUserId();
  const audience = roleFor(thread, userId) || routeAudience;
  const other = otherFor(thread, userId);
  const activeOffer = offerFor(thread, messages);
  const meeting = meetingFor(thread);
  const userPresence = presence(other);
  const [body, setBody] = useState("");
  const [amount, setAmount] = useState("");
  const [offerMode, setOfferMode] = useState(false);
  const [editingOffer, setEditingOffer] = useState(false);
  const [attachment, setAttachment] = useState(null);
  const [attachmentPreview, setAttachmentPreview] = useState("");
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [responding, setResponding] = useState(null);
  const [error, setError] = useState("");
  const [typing, setTyping] = useState(false);
  const pending = useRef(null); const fileInput = useRef(null); const bottom = useRef(null); const typingThrottle = useRef(null); const readThrough = useRef(null);
  const lastMessageId = messages.at(-1)?._id;
  const unreadIds = messages.filter((message) => entityId(message.recipient) === String(userId) && !message.readAt).map((message) => message._id).join(",");
  const unreadNotifications = (notifications.data?.notifications || []).filter((item) => item.chat === thread._id && !item.readAt).map((item) => item._id).join(",");
  useEffect(() => { bottom.current?.scrollIntoView({ block: "nearest" }); }, [lastMessageId]);
  useEffect(() => () => { if (attachmentPreview) URL.revokeObjectURL(attachmentPreview); }, [attachmentPreview]);
  useEffect(() => {
    if (!socket || !connected || !lastMessageId || (!unreadIds && !unreadNotifications)) return;
    const readKey = `${lastMessageId}:${unreadIds}:${unreadNotifications}`;
    const read = () => { if (document.visibilityState !== "visible" || readThrough.current === readKey) return; readThrough.current = readKey; emitAcknowledged(socket, "chat:read", { threadId: thread._id, throughId: lastMessageId }).catch(() => { readThrough.current = null; }); };
    read(); document.addEventListener("visibilitychange", read); return () => document.removeEventListener("visibilitychange", read);
  }, [socket, connected, thread._id, lastMessageId, unreadIds, unreadNotifications]);
  useEffect(() => {
    let timer; const update = (event) => { if (event.threadId !== thread._id) return; setTyping(event.typing); clearTimeout(timer); timer = setTimeout(() => setTyping(false), 3000); };
    socket?.on("chat:typing", update); return () => { socket?.off("chat:typing", update); clearTimeout(timer); };
  }, [socket, thread._id]);
  useEffect(() => () => clearTimeout(typingThrottle.current), []);
  const updateBody = (value) => { setBody(value); pending.current = null; if (connected && !typingThrottle.current) { emitAcknowledged(socket, "chat:typing", { threadId: thread._id, typing: Boolean(value) }).catch(() => {}); typingThrottle.current = setTimeout(() => { typingThrottle.current = null; }, 1500); } };
  const refresh = () => { client.invalidateQueries({ queryKey: ["chats"] }); client.invalidateQueries({ queryKey: ["chat-messages", userId, thread._id] }); };
  const clearAttachment = () => { setAttachment(null); setAttachmentPreview(""); if (fileInput.current) fileInput.current.value = ""; };
  const chooseAttachment = (event) => {
    const file = event.target.files?.[0]; if (!file) return;
    if (!new Set(["image/jpeg", "image/png", "image/webp"]).has(file.type) || file.size > 3 * 1024 * 1024) { setError("Choose a JPG, PNG, or WebP image up to 3MB."); event.target.value = ""; return; }
    setError(""); setAttachment(file); setAttachmentPreview(URL.createObjectURL(file)); pending.current = null;
  };
  const send = async (event) => {
    event.preventDefault(); if (sending) return;
    if (offerMode && (!Number.isFinite(Number(amount)) || Number(amount) < 1 || Number(amount) > 10000000)) { setError("Enter an offer between ₹1 and ₹1,00,00,000."); return; }
    if (!offerMode && !body.trim() && !attachment) return;
    setSending(true); setError("");
    try {
      if (attachment) await uploadImage.mutateAsync({ threadId: thread._id, file: attachment, body: body.trim() });
      else { const payload = pending.current || { threadId: thread._id, clientId: crypto.randomUUID(), kind: offerMode ? "offer" : "text", body: body.trim(), ...(offerMode ? { amount: Number(amount) } : {}) }; pending.current = payload; await emitAcknowledged(socket, "chat:send", payload); pending.current = null; }
      setBody(""); setAmount(""); setOfferMode(false); clearAttachment(); refresh(); emitAcknowledged(socket, "chat:typing", { threadId: thread._id, typing: false }).catch(() => {});
    } catch (err) { setError(err?.response?.data?.message || err.message || "Could not send your message."); } finally { setSending(false); }
  };
  const respond = async (messageId, decision) => { if (responding) return; setResponding(messageId); setError(""); try { await emitAcknowledged(socket, "chat:offer-response", { threadId: thread._id, messageId, decision }); refresh(); } catch (err) { setError(err.message); } finally { setResponding(null); } };
  const reviseOffer = async (event) => { event.preventDefault(); if (!activeOffer || Number(amount) < 1) return; setResponding(activeOffer._id); setError(""); try { await emitAcknowledged(socket, "chat:offer-revise", { threadId: thread._id, messageId: activeOffer._id, clientId: crypto.randomUUID(), amount: Number(amount) }); setEditingOffer(false); setAmount(""); refresh(); } catch (err) { setError(err.message); } finally { setResponding(null); } };
  const withdrawOffer = async () => { if (!activeOffer || responding) return; setResponding(activeOffer._id); setError(""); try { await emitAcknowledged(socket, "chat:offer-withdraw", { threadId: thread._id, messageId: activeOffer._id }); refresh(); } catch (err) { setError(err.message); } finally { setResponding(null); } };
  return <section className="campus-chat__conversation" aria-label={`Chat with ${personName(other)}`}>
    <header className="campus-chat__header"><button className="campus-chat__back" type="button" onClick={onBack} aria-label="Back to conversations"><ArrowLeft size={20} /></button><div className="campus-chat__product"><img src={thread.product?.images?.[0] || "/logo192.png"} alt="" /><div><span>Chat with</span><strong>{personName(other)} <i className={userPresence.online ? "is-online" : ""} aria-label={userPresence.online ? "Online" : "Offline"} /></strong><small>{thread.product?.productname || "Listing removed"} {thread.product && `· ${money(thread.product.price)}`}</small><Identity person={other} compact /></div></div><div className="campus-chat__header-actions">{thread.product && <span className={`campus-chat__availability ${thread.product.status === "Forsale" ? "is-available" : ""}`}>{thread.product.status === "Forsale" ? "Available" : "Unavailable"}</span>}{audience === "buyer" && thread.product && <Link to={`/buyer/products/${thread.product._id}`}>View listing</Link>}</div></header>
    {!userPresence.online && userPresence.lastActiveAt && <div className="campus-chat__last-active">Last active {shortDate(userPresence.lastActiveAt)} at {time(userPresence.lastActiveAt)}</div>}
    <MeetupPanel thread={thread} meeting={meeting} socket={socket} connected={connected} refresh={refresh} />
    <div className="campus-chat__messages" role="log" aria-label="Conversation messages" aria-live="polite">
      {query.hasNextPage && <button className="campus-chat__older" type="button" onClick={() => query.fetchNextPage()} disabled={query.isFetchingNextPage}>{query.isFetchingNextPage ? "Loading…" : "Load earlier messages"}</button>}
      {query.isLoading ? <p className="campus-chat__hint">Loading messages…</p> : query.isError ? <div className="campus-chat__hint" role="alert">Could not load messages. <button type="button" onClick={() => query.refetch()}>Retry</button></div> : messages.length === 0 && <p className="campus-chat__hint">Say hello, ask about the listing, or make a price offer.</p>}
      {messages.map((message, index) => {
        const mine = entityId(message.sender) === String(userId); const system = message.kind === "system"; const newDay = !index || new Date(messages[index - 1].createdAt).toDateString() !== new Date(message.createdAt).toDateString();
        if (system) return <React.Fragment key={message._id}>{newDay && <div className="campus-chat__day">{new Date(message.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</div>}<div className="campus-chat__system"><ShieldCheck size={13} /> {message.body || (message.kind === "meetup" ? "Meetup details updated" : "Conversation updated")}</div></React.Fragment>;
        const imageUrl = imageUrlFor(message);
        return <React.Fragment key={message._id}>{newDay && <div className="campus-chat__day">{new Date(message.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</div>}<article className={`campus-chat__bubble ${mine ? "is-mine" : ""} ${message.kind === "offer" ? "is-offer" : ""} ${message.kind === "meetup" ? "is-meetup" : ""} ${imageUrl ? "has-image" : ""}`}>{imageUrl && <a href={imageUrl} target="_blank" rel="noreferrer" className="campus-chat__message-image"><img src={imageUrl} alt={message.body || "Shared in chat"} /></a>}{message.kind === "offer" && <div className="campus-chat__offer"><span><IndianRupee size={15} /> {mine ? "Your price offer" : "Price offer"}</span><strong>{money(message.amount)}</strong><small className={`offer-${message.offerStatus}`}>{message.offerStatus === "pending" ? "Awaiting response" : `Offer ${message.offerStatus}`}</small></div>}{message.kind === "meetup" && <div className="campus-chat__offer"><span><MapPin size={15} /> Campus meetup</span><strong>{message.meetingLocation?.name || "Approved location"}</strong><small>{message.meetupAt ? new Date(message.meetupAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "Details proposed"} · {message.meetupStatus}</small></div>}{message.body && <p>{message.body}</p>}{message.kind === "offer" && message.offerStatus === "pending" && !mine && <div className="campus-chat__offer-actions"><button type="button" disabled={!connected || Boolean(responding)} onClick={() => respond(message._id, "accepted")}>{responding === message._id ? "Saving…" : "Accept"}</button><button type="button" disabled={!connected || Boolean(responding)} onClick={() => respond(message._id, "declined")}>Decline</button></div>}{message.offerStatus === "accepted" && <small className="campus-chat__agreement">Price agreed. Arrange a safe campus pickup.</small>}<footer><time dateTime={message.createdAt}>{time(message.createdAt)}</time>{mine && <span aria-label={message.readAt ? "Read" : "Sent"} title={message.readAt ? "Read" : "Sent"}>{message.readAt ? <CheckCheck size={15} /> : <Check size={15} />}</span>}</footer></article></React.Fragment>;
      })}<div ref={bottom} />
    </div>
    <ActiveOffer offer={activeOffer} userId={userId} connected={connected} busy={Boolean(responding)} onEdit={() => { setEditingOffer(true); setAmount(String(activeOffer.amount)); }} onWithdraw={withdrawOffer} />
    {editingOffer && <form className="campus-chat__edit-offer" onSubmit={reviseOffer}><label>Edit your offer<input aria-label="Revised offer amount" type="number" min="1" max="10000000" value={amount} onChange={(event) => setAmount(event.target.value)} autoFocus /></label><button type="submit" disabled={!connected || responding}>Save</button><button type="button" onClick={() => setEditingOffer(false)}>Cancel</button></form>}
    <div className={`campus-chat__typing${typing ? " is-active" : ""}`} aria-live="polite">{typing && <><span className="campus-chat__typing-dots" aria-hidden="true"><i /><i /><i /></span><span>{personName(other)} is typing</span></>}</div>
    <form className="campus-chat__composer" onSubmit={send}>{!connected && <p className="campus-chat__connection-note">Connecting to live chat… Your draft stays here.</p>}{error && <p role="alert" className="campus-chat__error">{error}</p>}<div className="campus-chat__quick-replies" aria-label="Quick replies">{QUICK_REPLIES.map((reply) => <button key={reply} type="button" onClick={() => updateBody(reply)}>{reply}</button>)}</div>{offerMode && <label className="campus-chat__amount">Your offer (₹)<input type="number" aria-label="Offer amount" min="1" max="10000000" step="0.01" required value={amount} disabled={sending} onChange={(event) => { setAmount(event.target.value); pending.current = null; }} placeholder="Enter price" /></label>}{attachmentPreview && <div className="campus-chat__attachment-preview"><img src={attachmentPreview} alt="Selected attachment preview" /><span><strong>{attachment.name}</strong><small>{(attachment.size / (1024 * 1024)).toFixed(1)} MB</small></span><button type="button" onClick={clearAttachment} aria-label="Remove attachment"><X size={16} /></button></div>}{emojiOpen && <div className="campus-chat__emoji-picker" aria-label="Choose an emoji">{QUICK_EMOJIS.map((emoji) => <button key={emoji} type="button" onClick={() => { updateBody(`${body}${emoji}`); setEmojiOpen(false); }}>{emoji}</button>)}</div>}<div className="campus-chat__compose-row"><button className="campus-chat__attach" type="button" onClick={() => fileInput.current?.click()} disabled={sending || offerMode} aria-label="Attach an image"><Paperclip size={18} /></button><input ref={fileInput} className="campus-chat__file-input" type="file" accept="image/jpeg,image/png,image/webp" onChange={chooseAttachment} tabIndex="-1" /><textarea aria-label="Message" value={body} disabled={sending} onChange={(event) => updateBody(event.target.value)} maxLength={1000} rows={1} placeholder={offerMode ? "Add a note to your offer (optional)" : attachment ? "Add a caption…" : "Write a message…"} /><button className="campus-chat__emoji-trigger" type="button" aria-label="Add emoji" aria-expanded={emojiOpen} onClick={() => setEmojiOpen((value) => !value)} disabled={sending}><Smile size={18} /></button><button className="campus-chat__send" type="submit" aria-label={offerMode ? "Send offer" : attachment ? "Send image" : "Send message"} disabled={!connected || sending || (!offerMode && !body.trim() && !attachment)}><Send size={19} /><span>{sending ? "Sending…" : offerMode ? "Send offer" : "Send"}</span></button></div><div className="campus-chat__compose-tools"><button type="button" aria-pressed={offerMode} disabled={sending || thread.product?.status !== "Forsale" || Boolean(activeOffer)} onClick={() => { setOfferMode(!offerMode); clearAttachment(); pending.current = null; }}><IndianRupee size={15} />{offerMode ? "Cancel offer" : "Make an offer"}</button><small>{body.length}/1000</small></div></form>
  </section>;
}

export default function PrivateQuestions({ audience, embedded = false }) {
  const [params, setParams] = useSearchParams(); const query = useChats("all"); const threads = query.data || []; const selectedId = params.get("chat"); const listedThread = threads.find((item) => item._id === selectedId); const detail = useChatThread(selectedId, !listedThread); const thread = listedThread || detail.data; const userId = chatUserId();
  const [legacy, setLegacy] = useState(false); const [search, setSearch] = useState(""); const [filter, setFilter] = useState("all");
  const counts = useMemo(() => ({ all: threads.length, buying: threads.filter((item) => roleFor(item, userId) === "buyer").length, selling: threads.filter((item) => roleFor(item, userId) === "seller").length, pending: threads.filter((item) => Boolean(offerFor(item))).length }), [threads, userId]);
  const visibleThreads = useMemo(() => {
    const needle = search.trim().toLocaleLowerCase();
    return threads.filter((item) => { const role = roleFor(item, userId); const matchesFilter = filter === "all" || filter === "pending" && Boolean(offerFor(item)) || filter === "buying" && role === "buyer" || filter === "selling" && role === "seller"; const person = otherFor(item, userId); const haystack = [personName(person), ...identityLabels(person), item.product?.productname, item.lastMessage?.body].filter(Boolean).join(" ").toLocaleLowerCase(); return matchesFilter && (!needle || haystack.includes(needle)); });
  }, [threads, userId, search, filter]);
  const select = (id) => setParams((current) => { const next = new URLSearchParams(current); if (id) next.set("chat", id); else next.delete("chat"); return next; });
  const filters = [["all", "All"], ["buying", "Buying"], ["selling", "Selling"], ["pending", "Offers pending"]];
  return <div className={`campus-chat ${embedded ? "is-embedded" : ""}${thread ? " has-selection" : ""}`}>
    <div className="campus-chat__search"><Search size={18} aria-hidden="true" /><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} aria-label="Search chats, items, or campus members" placeholder="Search chats, items, or campus members…" />{search && <button type="button" onClick={() => setSearch("")} aria-label="Clear search"><X size={15} /></button>}</div>
    <div className="campus-chat__filters" aria-label="Conversation filters">{filters.map(([value, label]) => <button key={value} type="button" className={filter === value ? "is-active" : ""} onClick={() => setFilter(value)} aria-pressed={filter === value}>{label} <span>{counts[value]}</span></button>)}</div>
    <div className={`campus-chat__layout ${thread ? "has-selection" : ""}`}><aside className="campus-chat__inbox" aria-label="Conversations"><header><div><span>Inbox</span><strong>Your conversations</strong></div><span>{visibleThreads.length}</span></header>
      {query.isLoading ? <div className="campus-chat__skeletons" aria-label="Loading conversations">{[0, 1, 2].map((item) => <div className="campus-chat__thread-skeleton" key={item}><i /><span><b /><b /></span></div>)}</div> : query.isError ? <p role="alert">Could not load conversations. <button type="button" onClick={() => query.refetch()}>Retry</button></p> : visibleThreads.length === 0 ? <div className="campus-chat__empty"><span className="campus-chat__empty-icon">{search || filter !== "all" ? <Search size={28} /> : <MessageCircle size={28} />}</span><strong>{search || filter !== "all" ? "No matching conversations" : "No conversations yet"}</strong><p>{search || filter !== "all" ? "Try another name, item, or inbox filter." : audience === "seller" ? "Buyer messages about your listings will appear here." : "Open a listing and choose Chat with seller."}</p>{audience === "buyer" && !search && filter === "all" && <Link to="/buyer/productlist">Browse marketplace</Link>}</div> : visibleThreads.map((item) => { const person = otherFor(item, userId); const role = roleFor(item, userId); const pendingOffer = offerFor(item); const online = presence(person).online; return <button key={item._id} type="button" className={`campus-chat__thread ${item._id === selectedId ? "is-active" : ""}`} onClick={() => select(item._id)} aria-current={item._id === selectedId ? "true" : undefined}><span className="campus-chat__thread-image"><img src={item.product?.images?.[0] || "/logo192.png"} alt="" />{online && <i aria-label="Online" />}</span><span className="campus-chat__thread-content"><span className="campus-chat__thread-heading"><strong>{personName(person)}</strong><time>{shortDate(item.lastMessage?.createdAt || item.lastMessageAt)}</time></span><span className="campus-chat__thread-product"><span>{item.product?.productname || "Listing removed"}</span>{item.product && <b>{money(item.product.price)}</b>}</span><span className="campus-chat__thread-meta"><em>{role === "buyer" ? "Buying" : "Selling"}</em>{pendingOffer && <em className="is-offer">Offer pending</em>}</span><span className="campus-chat__thread-preview">{threadPreview(item, userId)}</span></span>{item.unreadCount > 0 && <b aria-label={`${item.unreadCount} unread messages`}>{item.unreadCount}</b>}</button>; })}</aside>
      {thread ? <ChatConversation key={thread._id} thread={thread} routeAudience={audience} onBack={() => select(null)} /> : <section className="campus-chat__placeholder"><MessageCircle size={42} /><h2>{selectedId ? "Conversation unavailable" : "A good deal starts with a conversation"}</h2><p>{selectedId ? "Choose a conversation from your inbox." : "Select a chat to send messages, make an offer, and plan a safe meetup."}</p><span><ImageIcon size={15} /> Photos and price offers stay with the conversation.</span></section>}
    </div>
    <div className="campus-chat__safety"><ShieldCheck size={18} /><p><strong>Campus handoff tip</strong> Meet at an approved public location and inspect the item before sharing a transaction OTP.</p></div>
    <details className="campus-chat__legacy" onToggle={(event) => setLegacy(event.currentTarget.open)}><summary>Previous questions & replies</summary>{legacy && <LegacyQuestions audience={audience} embedded />}</details>
  </div>;
}
