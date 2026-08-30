import React, { useCallback, useEffect, useState } from "react";
import { CheckCircle2, LockKeyhole, MessageSquareText, Phone } from "lucide-react";
import SmallLoader from "../SmallLoader/SmallLoader";
import { authroutes } from "../../../apis/apis";
import { apiConnector } from "../../../utils/Apiconnecter";
import "./PhoneVerification.css";

const authHeader = () => ({ Authorization: `Bearer ${localStorage.getItem("campusrecycletoken")}` });

function PhoneVerification({ initialPhone = "", onStatusChange, onVerified }) {
  const [status, setStatus] = useState({ loading: true, verified: false, phoneNumber: null });
  const [phoneNumber, setPhoneNumber] = useState(String(initialPhone || ""));
  const [otp, setOtp] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const applyStatus = useCallback((nextStatus) => {
    setStatus(nextStatus);
    onStatusChange?.(nextStatus);
  }, [onStatusChange]);

  useEffect(() => {
    let active = true;
    apiConnector("GET", authroutes.PHONE_VERIFICATION_STATUS, null, authHeader())
      .then((response) => {
        if (!active) return;
        const data = response.data?.data || {};
        applyStatus({ loading: false, verified: Boolean(data.verified), phoneNumber: data.phoneNumber || null });
      })
      .catch(() => {
        if (!active) return;
        applyStatus({ loading: false, verified: false, phoneNumber: null });
        setMessage({ type: "error", text: "Could not check phone verification status." });
      });
    return () => { active = false; };
  }, [applyStatus]);

  const sendCode = async () => {
    const normalized = phoneNumber.replace(/\D/g, "").replace(/^91(?=\d{10}$)/, "");
    if (!/^[6-9]\d{9}$/.test(normalized)) {
      setMessage({ type: "error", text: "Enter a valid 10-digit Indian mobile number." });
      return;
    }
    setBusy(true);
    setMessage({ type: "", text: "" });
    try {
      const response = await apiConnector("POST", authroutes.SEND_PHONE_OTP, { phoneNumber: normalized }, authHeader());
      if (!response.data.success) throw new Error(response.data.message || "Could not send the code");
      setPhoneNumber(normalized);
      setCodeSent(true);
      setOtp("");
      setMessage({ type: "success", text: response.data.message || "Verification code sent." });
    } catch (error) {
      setMessage({ type: "error", text: error?.response?.data?.message || error.message || "Could not send the code." });
    } finally {
      setBusy(false);
    }
  };

  const verifyCode = async () => {
    if (!/^\d{6}$/.test(otp)) {
      setMessage({ type: "error", text: "Enter the 6-digit verification code." });
      return;
    }
    setBusy(true);
    setMessage({ type: "", text: "" });
    try {
      const response = await apiConnector("POST", authroutes.VERIFY_PHONE_OTP, { otp }, authHeader());
      if (!response.data.success) throw new Error(response.data.message || "Could not verify the code");
      const nextStatus = { loading: false, verified: true, phoneNumber: response.data.data?.phoneNumber || null };
      applyStatus(nextStatus);
      onVerified?.(phoneNumber.slice(-10));
      setCodeSent(false);
      setOtp("");
      setMessage({ type: "success", text: "Phone verified. You can now publish products." });
    } catch (error) {
      setMessage({ type: "error", text: error?.response?.data?.message || error.message || "Could not verify the code." });
    } finally {
      setBusy(false);
    }
  };

  if (status.loading) {
    return <section className="phone-verification-card phone-verification-loading"><SmallLoader size={15} /> Checking phone verification…</section>;
  }

  if (status.verified) {
    return (
      <section className="phone-verification-card phone-verification-complete">
        <span className="phone-verification-icon"><CheckCircle2 size={22} /></span>
        <div><strong>Phone verified</strong><p>{status.phoneNumber || "Your verified number"} is approved for seller listings. You will not need an OTP again.</p></div>
      </section>
    );
  }

  return (
    <section className="phone-verification-card">
      <div className="phone-verification-heading">
        <span className="phone-verification-icon"><LockKeyhole size={22} /></span>
        <div><strong>Verify your phone once</strong><p>This one-time check is required before your first product listing.</p></div>
      </div>
      <div className="phone-verification-controls">
        <label>
          <span>Mobile number</span>
          <div><Phone size={16} /><b>+91</b><input type="tel" inputMode="numeric" value={phoneNumber} onChange={(event) => setPhoneNumber(event.target.value.replace(/\D/g, "").slice(0, 12))} placeholder="9876543210" disabled={busy || codeSent} /></div>
        </label>
        {!codeSent ? (
          <button type="button" onClick={sendCode} disabled={busy}>{busy ? <><SmallLoader size={13} /> Sending…</> : <><MessageSquareText size={16} /> Send OTP</>}</button>
        ) : (
          <>
            <label>
              <span>6-digit OTP</span>
              <div><LockKeyhole size={16} /><input type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, ""))} placeholder="123456" disabled={busy} /></div>
            </label>
            <button type="button" onClick={verifyCode} disabled={busy || otp.length !== 6}>{busy ? <><SmallLoader size={13} /> Verifying…</> : "Verify phone"}</button>
            <button type="button" className="phone-verification-link" onClick={() => { setCodeSent(false); setOtp(""); setMessage({ type: "", text: "" }); }} disabled={busy}>Change number</button>
          </>
        )}
      </div>
      {message.text && <p className={`phone-verification-message ${message.type}`} role="status">{message.text}</p>}
    </section>
  );
}

export default PhoneVerification;
