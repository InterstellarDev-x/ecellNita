import React, { useEffect, useState } from "react";
import "./OfflineFallback.css";

function OfflineFallback({ children }) {
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);
  const [retrying, setRetrying] = useState(false);
  const [retryMessage, setRetryMessage] = useState("");

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setRetryMessage("");
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const checkConnection = () => {
    setRetrying(true);
    setRetryMessage("");

    window.setTimeout(() => {
      const connected = navigator.onLine;
      setIsOnline(connected);
      setRetrying(false);
      if (!connected) setRetryMessage("Still offline. We’ll reconnect automatically when the network returns.");
    }, 450);
  };

  if (isOnline) return children;

  return (
    <main className="offline-page">
      <div className="offline-page__glow offline-page__glow--top" />
      <div className="offline-page__glow offline-page__glow--bottom" />

      <section className="offline-card" aria-labelledby="offline-title">
        <div className="offline-card__brand" aria-label="Campus Recycle">
          <span className="offline-card__brand-mark" aria-hidden="true">↻</span>
          <span>Campus Recycle</span>
        </div>

        <div className="offline-card__signal" aria-hidden="true">
          <span className="offline-card__signal-ring offline-card__signal-ring--outer" />
          <span className="offline-card__signal-ring offline-card__signal-ring--inner" />
          <span className="offline-card__signal-dot" />
          <span className="offline-card__signal-slash" />
        </div>

        <p className="offline-card__eyebrow">Connection paused</p>
        <h1 id="offline-title">You’re offline, not out of the loop.</h1>
        <p className="offline-card__copy">
          Campus Recycle needs an internet connection to load listings and messages. Check your Wi-Fi or mobile data and try again.
        </p>

        <button type="button" className="offline-card__retry" onClick={checkConnection} disabled={retrying}>
          <span aria-hidden="true">↻</span>
          {retrying ? "Checking connection…" : "Try again"}
        </button>

        <p className="offline-card__status" role="status" aria-live="polite">
          {retryMessage || "This page will recover automatically once you’re back online."}
        </p>
      </section>
    </main>
  );
}

export default OfflineFallback;
