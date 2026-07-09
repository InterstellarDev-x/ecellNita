import React, { useEffect, useState } from "react";
import "./ActivitySection.css";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import Spinner from "react-bootstrap/Spinner";
import HCaptcha from "@hcaptcha/react-hcaptcha";
import { authroutes } from "../../../../apis/apis";
import { apiConnector } from "../../../../utils/Apiconnecter";

function ActivitySection() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState({ msg: "", type: "" });
  const [passView, setPassView] = useState(false);
  const [activity, setActivity] = useState(false); // false=login, true=signup
  const [otp, setOtp] = useState("");
  const [verificationStage, setVerificationStage] = useState(false);
  const [passMatched, setPassMatched] = useState(false);
  const [recaptchaVerified, setRecaptchaVerified] = useState(false);
  const [recaptchaVerifiedRegister, setRecaptchaVerifiedRegister] = useState(false);

  const [signUpDetails, setSignUpDetails] = useState({
    email: "", firstname: "", lastname: "",
    password: "", confirmpassword: "", otp: "", accounttype: "Buyer",
  });
  const [loginDetails, setLoginDetails] = useState({ email: "", password: "" });

  const toggleActivity = () => {
    setActivity((p) => !p);
    setVerificationStage(false);
    setErrorMsg({ msg: "", type: "" });
  };

  useEffect(() => {
    if (window.location.pathname.split("-")[1] === "signup") setActivity(true);
  }, []);

  useEffect(() => {
    setPassMatched(signUpDetails.password === signUpDetails.confirmpassword);
  }, [signUpDetails.password, signUpDetails.confirmpassword]);

  const handleOnchangeSignup = (e) =>
    setSignUpDetails({ ...signUpDetails, [e.target.name]: e.target.value });
  const handleOnchangelogin = (e) =>
    setLoginDetails({ ...loginDetails, [e.target.name]: e.target.value });

  const toggleVerificationStage = async (e) => {
    e.preventDefault();
    if (!recaptchaVerifiedRegister)
      return setErrorMsg({ msg: "Please verify the captcha", type: "Captcha not verified while registration" });
    setLoading(true);
    try {
      const res = await apiConnector("POST", authroutes.SEND_OTP_API, { email: signUpDetails.email });
      if (res.data.success) {
        setSignUpDetails({ ...signUpDetails, otp: res.data.data.otp });
        setVerificationStage(true);
      } else {
        if (res.data.message === "User already Registered")
          setErrorMsg({ msg: "User already registered", type: "email already exists" });
      }
    } catch (e) { console.log(e); }
    setLoading(false);
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    if (signUpDetails.otp !== otp) {
      setLoading(false);
      return setErrorMsg({ msg: "Incorrect OTP", type: "otp did not matched" });
    }
    try {
      const res = await apiConnector("POST", authroutes.SIGNUP_API, signUpDetails);
      if (res.data.success) { setLoading(false); navigate("/getstarted"); }
      else {
        if (res.data.message === "User already Registered")
          setErrorMsg({ msg: "User already registered", type: "email already exists" });
        setLoading(false);
      }
    } catch (e) { console.log(e); setLoading(false); }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!recaptchaVerified)
      return setErrorMsg({ msg: "Please verify the captcha", type: "Captcha not verified" });
    setLoading(true);
    try {
      const res = await apiConnector("POST", authroutes.LOGIN_API, loginDetails);
      if (res.data.success) {
        localStorage.setItem("campusrecycletoken", res.data.token);
        localStorage.setItem("campusrecycleuser", JSON.stringify(res.data.data));
        setLoading(false);
        navigate("/getstarted");
      } else {
        if (res.data.message === "User Not Registered")
          setErrorMsg({ msg: "No account found with this email", type: "email does not exists" });
        else if (res.data.message === "Password is Incorrect")
          setErrorMsg({ msg: "Incorrect password", type: "wrong password" });
        setLoading(false);
      }
    } catch (e) { console.log(e); setLoading(false); }
  };

  return (
    <div className="auth-page">
      {/* ── Left branding panel ── */}
      <div className="auth-left">
        <div className="auth-left-top">
          <img src="/logo.png" alt="Campus Recycle" className="auth-brand-logo" onClick={() => navigate("/")} />
        </div>

        <div className="auth-left-body">
          <span className="auth-left-badge">🌱 Campus Marketplace</span>
          <h2 className="auth-left-heading">
            Give your stuff<br />a second life.
          </h2>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="auth-right">
        <button className="auth-back-home" onClick={() => navigate("/")}>← Home</button>

        {!activity ? (
          /* ── LOGIN ── */
          <form className="auth-form" onSubmit={handleLogin}>
            <div className="auth-form-header">
              <h2>Welcome back</h2>
              <p className="auth-switch-text">
                New here? <Link onClick={toggleActivity}>Create an account</Link>
              </p>
            </div>

            <div className="auth-field">
              <label>Email</label>
              <input type="email" placeholder="you@nita.ac.in" name="email"
                value={loginDetails.email} onChange={handleOnchangelogin} required />
              {errorMsg.type === "email does not exists" && <span className="auth-error">{errorMsg.msg}</span>}
            </div>

            <div className="auth-field">
              <label>Password</label>
              <div className="auth-password-wrap">
                <input type={passView ? "text" : "password"} placeholder="Enter your password"
                  name="password" value={loginDetails.password} onChange={handleOnchangelogin} required />
                <button type="button" className="auth-eye" onClick={() => setPassView((o) => !o)}>
                  {passView ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
              {errorMsg.type === "wrong password" && <span className="auth-error">{errorMsg.msg}</span>}
            </div>

            <Link to="/forgotpassword" className="auth-forgot">Forgot password?</Link>

            <HCaptcha sitekey="979e4300-1752-49e6-8e58-1388e9befe64" onVerify={() => setRecaptchaVerified(true)} />
            {errorMsg.type === "Captcha not verified" && <span className="auth-error">{errorMsg.msg}</span>}

            <button type="submit" className={`auth-submit${loading ? " auth-submit--loading" : ""}`} disabled={loading}>
              {loading ? <><Spinner size="sm" animation="border" /> Signing in…</> : "Sign In"}
            </button>
          </form>

        ) : !verificationStage ? (
          /* ── SIGN UP ── */
          <form className="auth-form" onSubmit={toggleVerificationStage}>
            <div className="auth-form-header">
              <h2>Create account</h2>
              <p className="auth-switch-text">
                Already have one? <Link onClick={toggleActivity}>Sign in</Link>
              </p>
            </div>

            <div className="auth-field auth-field--row">
              <div className="auth-field">
                <label>First Name</label>
                <input type="text" placeholder="John" name="firstname"
                  value={signUpDetails.firstname} onChange={handleOnchangeSignup} required />
              </div>
              <div className="auth-field">
                <label>Last Name</label>
                <input type="text" placeholder="Doe" name="lastname"
                  value={signUpDetails.lastname} onChange={handleOnchangeSignup} required />
              </div>
            </div>

            <div className="auth-field">
              <label>Email</label>
              <input type="email" placeholder="you@nita.ac.in" name="email"
                value={signUpDetails.email} onChange={handleOnchangeSignup} required />
              {errorMsg.type === "email already exists" && <span className="auth-error">{errorMsg.msg}</span>}
            </div>

            <div className="auth-field">
              <label>Password</label>
              <div className="auth-password-wrap">
                <input type={passView ? "text" : "password"} placeholder="Create a password"
                  name="password" value={signUpDetails.password} onChange={handleOnchangeSignup} required />
                <button type="button" className="auth-eye" onClick={() => setPassView((o) => !o)}>
                  {passView ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            <div className="auth-field">
              <label>Confirm Password</label>
              <div className="auth-password-wrap">
                <input type={passView ? "text" : "password"} placeholder="Repeat your password"
                  name="confirmpassword" value={signUpDetails.confirmpassword} onChange={handleOnchangeSignup} required />
                <button type="button" className="auth-eye" onClick={() => setPassView((o) => !o)}>
                  {passView ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
              {signUpDetails.confirmpassword && !passMatched &&
                <span className="auth-error">Passwords don't match</span>}
            </div>

            <HCaptcha sitekey="342a82a4-2f5c-4348-942e-999cd9eccc3a" onVerify={() => setRecaptchaVerifiedRegister(true)} />
            {errorMsg.type === "Captcha not verified while registration" && <span className="auth-error">{errorMsg.msg}</span>}

            <button type="submit"
              className={`auth-submit${(!passMatched || loading) ? " auth-submit--loading" : ""}`}
              disabled={!passMatched || loading}>
              {loading ? <><Spinner size="sm" animation="border" /> Sending OTP…</> : "Continue →"}
            </button>
          </form>

        ) : (
          /* ── OTP VERIFY ── */
          <form className="auth-form" onSubmit={handleSignup}>
            <div className="auth-form-header">
              <h2>Verify your email</h2>
              <p className="auth-switch-text">
                OTP sent to <strong>{signUpDetails.email}</strong>
              </p>
            </div>

            <div className="auth-field">
              <label>One-Time Password</label>
              <input type="text" placeholder="Enter 6-digit OTP"
                value={otp} onChange={(e) => setOtp(e.target.value)} required />
              {errorMsg.type === "otp did not matched" && <span className="auth-error">{errorMsg.msg}</span>}
            </div>

            <button type="submit" className={`auth-submit${loading ? " auth-submit--loading" : ""}`} disabled={loading}>
              {loading ? <><Spinner size="sm" animation="border" /> Verifying…</> : "Verify & Sign Up"}
            </button>

            <p className="auth-switch-text" style={{ textAlign: "center" }}>
              <Link onClick={toggleActivity}>← Back to Sign in</Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}

export default ActivitySection;
