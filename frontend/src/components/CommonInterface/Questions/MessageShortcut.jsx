import React from "react";
import { MessageCircle } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useChats } from "../../../hooks/useChatQueries";
import "./MessageShortcut.css";

export default function MessageShortcut({ audience }) {
  const location = useLocation();
  const chats = useChats("all");
  const unreadCount = (chats.data || []).reduce((total, thread) => total + Number(thread.unreadCount || 0), 0);
  const destination = `/${audience === "seller" ? "seller" : "buyer"}/questions`;
  const active = location.pathname === destination;

  return (
    <Link
      to={destination}
      className={`message-shortcut${active ? " is-active" : ""}`}
      aria-label={unreadCount ? `Messages, ${unreadCount} unread` : "Messages"}
      aria-current={active ? "page" : undefined}
      title="Messages"
    >
      <MessageCircle size={19} />
      {unreadCount > 0 && <span>{unreadCount > 9 ? "9+" : unreadCount}</span>}
    </Link>
  );
}
