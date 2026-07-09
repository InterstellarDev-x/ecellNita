import React, { useState } from "react";
import "./Forgot.css";
import { apiConnector } from "../../../utils/Apiconnecter";
import { authroutes } from "../../../apis/apis";
import successCheck from "../../../images/success-check.png";
import Spinner from "react-bootstrap/Spinner";

function Forgot() {
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [loading, setloading] = useState(false);

  const [forgotPasswordData, setForgotPasswordData] = useState({
    email: "",
  });

  const onChange = (e) => {
    setForgotPasswordData({
      ...forgotPasswordData,
      [e.target.name]: e.target.value,
    });
  };

  const [errorMsg, setErrorMsg] = useState({
    msg: "",
    type: "",
  });

  const sendPasswordResetMail = async (e) => {
    setErrorMsg({
      msg: "",
      type: "",
    });
    setloading(true);
    e.preventDefault();
    try {
      const responseObj = await apiConnector(
        "POST",
        authroutes.FORGOT_PASSWORD_TOKEN_REQUEST,
        {
          email: forgotPasswordData.email,
        }
      );
      console.log(responseObj);
      if (responseObj.data.success) {
        console.log(responseObj.data.message);
        setloading(false);
        setResetEmailSent(true);
      } else {
        if (responseObj.data.message === "User not Found with given email") {
          setErrorMsg({
            msg: "User not Found with given email",
            type: "email does not exists",
          });
          setloading(false);
        }
      }
    } catch (error) {
      console.log(error);
      setloading(false);
    }
  };

  return (
    <div className="forgot-pass-main-contanier">
      <div className="forgot-pass-form-container">
        <form onSubmit={sendPasswordResetMail}>
          <div className="form-top">
            <h2>Campus Recycle</h2>
          </div>
          <div className="form-subject">
            <h3 className="subject">Reset Your Password</h3>
          </div>
          {!resetEmailSent && (
            <div className="form-body">
              <div className="form-components">
                <label htmlFor="email">Enter your verified email address</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  placeholder="Email"
                  value={forgotPasswordData.email}
                  onChange={onChange}
                  required
                />
                <p className="forgot-pass-error-msg">
                  {errorMsg.type === "email does not exists"
                    ? errorMsg.msg
                    : ""}
                </p>
              </div>
              <div className="form-components">
                <button type="submit" className={loading ? 'forgot-pass-btn-disabled' : ''} disabled={loading}>
                  Send password reset email {loading && <Spinner className="forgot-pass-btn-spinner" size="sm" animation="border" />}{" "}
                </button>
              </div>
            </div>
          )}
          {resetEmailSent && (
            <div className="form-body">
              <div className="forgot-pass-success-msg">
                <img src={successCheck} alt="" />
                <span>Password reset link has been sent to your email</span>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

export default Forgot;
