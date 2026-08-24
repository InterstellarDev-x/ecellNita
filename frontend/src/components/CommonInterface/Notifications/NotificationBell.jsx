import React, { useEffect, useRef, useState } from "react";
import { Bell, CheckCheck, MessageCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useMarkNotificationRead, useNotifications } from "../../../hooks/useQuestionQueries";
import "./NotificationBell.css";

function NotificationBell({ audience }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();
  const { data, isLoading } = useNotifications();
  const markRead = useMarkNotificationRead();
  const notifications = data?.notifications || [];
  const unreadCount = data?.unreadCount || 0;

  useEffect(() => {
    const close = (event) => {
      if (ref.current && !ref.current.contains(event.target)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const openNotification = async (notification) => {
    if (!notification.readAt) await markRead.mutateAsync(notification._id);
    setOpen(false);
    navigate(audience === "seller" ? "/seller/questions" : "/buyer/questions");
  };

  return (
    <div className="notification-bell" ref={ref}>
      <button type="button" className="notification-bell__button" onClick={() => setOpen((value) => !value)} aria-label="Notifications">
        <Bell size={19} />
        {unreadCount > 0 && <span className="notification-bell__count">{unreadCount > 9 ? "9+" : unreadCount}</span>}
      </button>
      {open && (
        <section className="notification-bell__panel" aria-label="Notifications">
          <header><div><strong>Notifications</strong><span>{unreadCount ? `${unreadCount} unread` : "You're all caught up"}</span></div><CheckCheck size={18} /></header>
          <div className="notification-bell__items">
            {isLoading ? <p className="notification-bell__empty">Loading…</p> : notifications.length === 0 ? <p className="notification-bell__empty">No notifications yet.</p> : notifications.map((notification) => (
              <button key={notification._id} type="button" className={`notification-bell__item ${notification.readAt ? "" : "is-unread"}`} onClick={() => openNotification(notification)}>
                <MessageCircle size={17} />
                <span><strong>{notification.title}</strong><small>{notification.message}</small></span>
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default NotificationBell;
