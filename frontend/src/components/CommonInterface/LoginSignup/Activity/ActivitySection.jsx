import React, { useState } from "react";
import "./ActivitySection.css";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import SmallLoader from "../../SmallLoader/SmallLoader";
import { authroutes } from "../../../../apis/apis";
import { apiConnector } from "../../../../utils/Apiconnecter";
import { signupDetailsSchema, signupSchema } from "../../../../validation/auth";

function ActivitySection() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState({ msg: "", type: "" });
  const [signupErrors, setSignupErrors] = useState({});
  const [passView, setPassView] = useState(false);
  const [activity, setActivity] = useState(() => window.location.pathname.includes("student-signup")); // false=login, true=signup
  const [otp, setOtp] = useState("");
  const [verificationStage, setVerificationStage] = useState(false);

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

  const passMatched = signUpDetails.password === signUpDetails.confirmpassword;

  const handleOnchangeSignup = (e) => {
    const { name, value } = e.target;
    setSignUpDetails({ ...signUpDetails, [name]: value });
    setSignupErrors((current) => ({ ...current, [name]: undefined }));
    setErrorMsg({ msg: "", type: "" });
  };
  const handleOnchangelogin = (e) =>
    setLoginDetails({ ...loginDetails, [e.target.name]: e.target.value });

  const getFieldErrors = (validationError) => validationError.flatten().fieldErrors;

  const validateSignup = (schema, values) => {
    const result = schema.safeParse(values);
    if (result.success) {
      setSignupErrors({});
      return true;
    }
    setSignupErrors(getFieldErrors(result.error));
    return false;
  };

  const applyApiValidationErrors = (error) => {
    const responseData = error?.response?.data;
    if (responseData?.errors) setSignupErrors(responseData.errors);
    setErrorMsg({
      msg: responseData?.message || "Something went wrong. Please try again.",
      type: "signup error",
    });
  };

  const toggleVerificationStage = async (e) => {
    e.preventDefault();
    if (!validateSignup(signupDetailsSchema, signUpDetails)) return;
    setLoading(true);
    try {
      const res = await apiConnector("POST", authroutes.SEND_OTP_API, { email: signUpDetails.email });
      if (res.data.success) {
        setVerificationStage(true);
      } else {
        setErrorMsg({ msg: res.data.message || "Could not send OTP", type: "signup error" });
      }
    } catch (e) { console.error(e); applyApiValidationErrors(e); }
    setLoading(false);
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!validateSignup(signupSchema, { ...signUpDetails, otp })) return;
    setLoading(true);
    try {
      const res = await apiConnector("POST", authroutes.SIGNUP_API, { ...signUpDetails, otp });
      if (res.data.success) {
        setLoginDetails({ email: signUpDetails.email, password: "" });
        setActivity(false);
        setVerificationStage(false);
        setOtp("");
        setErrorMsg({ msg: "Account created. Sign in to continue.", type: "login success" });
        setLoading(false);
        navigate("/student-login");
      }
      else {
        setErrorMsg({ msg: res.data.message || "Could not create account", type: "signup error" });
        setLoading(false);
      }
    } catch (e) { console.error(e); applyApiValidationErrors(e); setLoading(false); }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
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
        else setErrorMsg({ msg: res.data.message || "Could not sign in", type: "login error" });
        setLoading(false);
      }
    } catch (e) {
      console.error(e);
      setErrorMsg({ msg: e?.response?.data?.message || "Could not sign in. Please try again.", type: "login error" });
      setLoading(false);
    }
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
                New here? <Link to="/student-signup" onClick={toggleActivity}>Create an account</Link>
              </p>
            </div>

            <div className="auth-field">
              <label htmlFor="login-email">Email</label>
              <input id="login-email" type="email" placeholder="you@nita.ac.in" name="email" autoComplete="email"
                value={loginDetails.email} onChange={handleOnchangelogin} required />
              {errorMsg.type === "email does not exists" && <span className="auth-error">{errorMsg.msg}</span>}
            </div>

            <div className="auth-field">
              <label htmlFor="login-password">Password</label>
              <div className="auth-password-wrap">
                <input id="login-password" type={passView ? "text" : "password"} placeholder="Enter your password"
                  name="password" autoComplete="current-password" value={loginDetails.password} onChange={handleOnchangelogin} required />
                <button type="button" className="auth-eye" aria-label={passView ? "Hide password" : "Show password"} aria-controls="login-password" onClick={() => setPassView((o) => !o)}>
                  {passView ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
              {errorMsg.type === "wrong password" && <span className="auth-error">{errorMsg.msg}</span>}
              {errorMsg.type === "login error" && <span className="auth-error">{errorMsg.msg}</span>}
              {errorMsg.type === "login success" && <span className="auth-success" role="status">{errorMsg.msg}</span>}
            </div>

            <Link to="/forgotpassword" className="auth-forgot">Forgot password?</Link>

            <button type="submit" className={`auth-submit${loading ? " auth-submit--loading" : ""}`} disabled={loading}>
              {loading ? <><SmallLoader size={13} /> Signing in…</> : "Sign In"}
            </button>
          </form>

        ) : !verificationStage ? (
          /* ── SIGN UP ── */
          <form className="auth-form" onSubmit={toggleVerificationStage}>
            <div className="auth-form-header">
              <h2>Create account</h2>
              <p className="auth-switch-text">
                Already have one? <Link to="/student-login" onClick={toggleActivity}>Sign in</Link>
              </p>
            </div>

            <div className="auth-field auth-field--row">
              <div className="auth-field">
                <label htmlFor="signup-firstname">First Name</label>
                <input id="signup-firstname" type="text" placeholder="John" name="firstname" autoComplete="given-name"
                  value={signUpDetails.firstname} onChange={handleOnchangeSignup} required aria-invalid={Boolean(signupErrors.firstname)} />
                {signupErrors.firstname?.[0] && <span className="auth-error">{signupErrors.firstname[0]}</span>}
              </div>
              <div className="auth-field">
                <label htmlFor="signup-lastname">Last Name</label>
                <input id="signup-lastname" type="text" placeholder="Doe" name="lastname" autoComplete="family-name"
                  value={signUpDetails.lastname} onChange={handleOnchangeSignup} required aria-invalid={Boolean(signupErrors.lastname)} />
                {signupErrors.lastname?.[0] && <span className="auth-error">{signupErrors.lastname[0]}</span>}
              </div>
            </div>

            <div className="auth-field">
              <label htmlFor="signup-email">Email</label>
              <input id="signup-email" type="email" placeholder="you@nita.ac.in" name="email" autoComplete="email"
                value={signUpDetails.email} onChange={handleOnchangeSignup} required aria-invalid={Boolean(signupErrors.email)} />
              {signupErrors.email?.[0] && <span className="auth-error">{signupErrors.email[0]}</span>}
              {errorMsg.type === "email already exists" && <span className="auth-error">{errorMsg.msg}</span>}
            </div>

            <div className="auth-field">
              <label htmlFor="signup-password">Password</label>
              <div className="auth-password-wrap">
                <input id="signup-password" type={passView ? "text" : "password"} placeholder="Create a password"
                  name="password" autoComplete="new-password" value={signUpDetails.password} onChange={handleOnchangeSignup} required aria-invalid={Boolean(signupErrors.password)} />
                <button type="button" className="auth-eye" aria-label={passView ? "Hide passwords" : "Show passwords"} aria-controls="signup-password signup-confirm-password" onClick={() => setPassView((o) => !o)}>
                  {passView ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
              {signupErrors.password?.[0] && <span className="auth-error">{signupErrors.password[0]}</span>}
            </div>

            <div className="auth-field">
              <label htmlFor="signup-confirm-password">Confirm Password</label>
              <div className="auth-password-wrap">
                <input id="signup-confirm-password" type={passView ? "text" : "password"} placeholder="Repeat your password"
                  name="confirmpassword" autoComplete="new-password" value={signUpDetails.confirmpassword} onChange={handleOnchangeSignup} required aria-invalid={Boolean(signupErrors.confirmpassword)} />
                <button type="button" className="auth-eye" aria-label={passView ? "Hide passwords" : "Show passwords"} aria-controls="signup-password signup-confirm-password" onClick={() => setPassView((o) => !o)}>
                  {passView ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
              {signupErrors.confirmpassword?.[0]
                ? <span className="auth-error">{signupErrors.confirmpassword[0]}</span>
                : signUpDetails.confirmpassword && !passMatched &&
                <span className="auth-error">Passwords don't match</span>}
            </div>

            {errorMsg.type === "signup error" && <span className="auth-error">{errorMsg.msg}</span>}

            <button type="submit"
              className={`auth-submit${(!passMatched || loading) ? " auth-submit--loading" : ""}`}
              disabled={!passMatched || loading}>
              {loading ? <><SmallLoader size={13} /> Sending OTP…</> : "Continue →"}
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
              <label htmlFor="signup-otp">One-Time Password</label>
              <input id="signup-otp" type="text" inputMode="numeric" pattern="[0-9]*" autoComplete="one-time-code" maxLength="6" placeholder="Enter 6-digit OTP"
                value={otp} onChange={(e) => {
                  setOtp(e.target.value.replace(/\D/g, ""));
                  setSignupErrors((current) => ({ ...current, otp: undefined }));
                  setErrorMsg({ msg: "", type: "" });
                }} required aria-invalid={Boolean(signupErrors.otp)} />
              {signupErrors.otp?.[0] && <span className="auth-error">{signupErrors.otp[0]}</span>}
              {errorMsg.type === "otp did not matched" && <span className="auth-error">{errorMsg.msg}</span>}
              {errorMsg.type === "signup error" && <span className="auth-error">{errorMsg.msg}</span>}
            </div>

            <button type="submit" className={`auth-submit${loading ? " auth-submit--loading" : ""}`} disabled={loading}>
              {loading ? <><SmallLoader size={13} /> Verifying…</> : "Verify & Sign Up"}
            </button>

            <p className="auth-switch-text" style={{ textAlign: "center" }}>
              <Link to="/student-login" onClick={toggleActivity}>← Back to Sign in</Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}

export default ActivitySection;
