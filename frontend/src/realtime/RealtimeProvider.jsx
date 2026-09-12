import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { io } from "socket.io-client";
import { useQueryClient } from "@tanstack/react-query";

const RealtimeContext = createContext({ socket: null, connected: false });
const apiBase = import.meta.env.VITE_BASE_URL || import.meta.env.REACT_APP_BASE_URL || "http://localhost:4000/api/v1";
const socketUrl = import.meta.env.VITE_SOCKET_URL || new URL(apiBase, window.location.origin).origin;
export const useRealtime = () => useContext(RealtimeContext);
export function RealtimeProvider({ children }) {
  const client = useQueryClient();
  const [token, setToken] = useState(() => localStorage.getItem("campusrecycletoken"));
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  useEffect(() => {
    const sync = () => setToken(localStorage.getItem("campusrecycletoken"));
    window.addEventListener("storage", sync);
    window.addEventListener("campusrecycle-auth-changed", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("campusrecycle-auth-changed", sync);
    };
  }, []);
  useEffect(() => {
    if (!token) { setSocket(null); setConnected(false); return; }
    const live = io(socketUrl, { auth: { token }, transports: ["websocket"], autoConnect: false });
    setSocket(live);
    const invalidate = (keys) => keys.forEach((key) => client.invalidateQueries({ queryKey: [key] }));
    const chatChanged = () => invalidate(["chats", "chat-messages"]);
    const notificationsChanged = () => invalidate(["in-app-notifications", "private-product-questions", "buyer-requests", "seller-requests", "buyer-request-schedule"]);
    live.on("connect", () => { setConnected(true); chatChanged(); notificationsChanged(); });
    live.on("disconnect", () => setConnected(false));
    live.on("connect_error", () => setConnected(false));
    live.on("chat:changed", chatChanged);
    live.on("notifications:changed", notificationsChanged);
    const refresh = () => {
      if (document.visibilityState === "visible") { if (!live.connected) live.connect(); chatChanged(); notificationsChanged(); }
    };
    document.addEventListener("visibilitychange", refresh);
    live.connect();
    return () => { document.removeEventListener("visibilitychange", refresh); live.removeAllListeners(); live.disconnect(); setConnected(false); };
  }, [token, client]);
  const value = useMemo(() => ({ socket, connected }), [socket, connected]);
  return <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>;
}
export const emitAcknowledged = (socket, event, payload) => new Promise((resolve, reject) => {
  if (!socket?.connected) { reject(new Error("Reconnecting… Your message has not been sent. Try again when connected.")); return; }
  socket.timeout(10000).emit(event, payload, (error, result) => {
    if (error) reject(new Error("Delivery not confirmed. Retry to check or resend this message."));
    else if (!result?.success) reject(new Error(result?.message || "Could not complete this action"));
    else resolve(result.data);
  });
});
