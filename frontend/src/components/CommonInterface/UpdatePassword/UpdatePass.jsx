import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import './UpdatePass.css'
import { apiConnector } from '../../../utils/Apiconnecter';
import { authroutes } from '../../../apis/apis';
import { useNavigate, useParams } from 'react-router-dom';
import SmallLoader from "../SmallLoader/SmallLoader";
import { resetPasswordSchema } from '../../../validation/auth';

function UpdatePass() {
    const navigate = useNavigate();
    const { token } = useParams();
    const [loading, setloading] = useState(false);
    const [passView, setPassView] = useState(false);
    const togglePassView = () => {
        if(passView){
            setPassView(false);
        }else{
            setPassView(true);
        }
    }

    const [errorMsg, setErrorMsg] = useState({
      msg: "",
      type: "",
    });

    const handlePasswordReset = async(e) => {
        e.preventDefault();
        const validation = resetPasswordSchema.safeParse(resetPasswordData);
        if (!validation.success) {
            setErrorMsg({ msg: validation.error.issues[0]?.message || "Enter a valid password", type: "validation" });
            return;
        }
        setloading(true);
        setErrorMsg({ msg: "", type: "" });
        try {
            const responseObj = await apiConnector(
                "POST",
                authroutes.RESET_PASSWORD,
                {
                    password: resetPasswordData.password,
                    confirmpassword: resetPasswordData.confirmpassword,
                    token
                }
            )
            if(responseObj.data.success){
              setloading(false);
              navigate('/student-login', { replace: true });
            }else{
              setErrorMsg({ msg: responseObj.data.message || "Could not reset password", type: "request" });
              setloading(false);
            }
        } catch (error) {
            console.error(error);
            setErrorMsg({ msg: error?.response?.data?.message || "Could not reset password", type: "request" });
            setloading(false);
        }
    }

    const [resetPasswordData, setResetPasswordData] = useState({
        password: '',
        confirmpassword: ''
    })

    const onChange  = (e) => {
        setResetPasswordData({...resetPasswordData, [e.target.name]: e.target.value});
    }

    const passMatched = resetPasswordData.password === resetPasswordData.confirmpassword;
  return (
    <div className="update-pass-main-contanier">
      <div className="update-pass-form-container">
        <form onSubmit={handlePasswordReset}>
          <div className="form-top">
            <h2>Campus Recycle</h2>
          </div>
          <div className="form-subject">
            <h3 className="subject">Reset Your Password</h3>
          </div>
          <div className="form-body">
              <div className="form-components">
                <p className="update-pass-error-msg">
                  {errorMsg.msg}
                </p>
              </div>
              <div className="form-components">
                <label htmlFor="password">Password</label>
                <div className="update-pass-password-div">
                    <input
                        type={passView ? "text" : "password"}
                        id="password"
                        name="password"
                        autoComplete="new-password"
                        value={resetPasswordData.password}
                        onChange={onChange}
                        required
                    />
                  <button type="button" onClick={togglePassView} aria-label={passView ? "Hide passwords" : "Show passwords"}>
                    {passView ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>
              <div className="form-components">
                <label htmlFor="confirmpassword">Confirm Password</label>
                <input
                    type={passView ? "text" : "password"}
                    id="confirmpassword"
                    name="confirmpassword"
                    autoComplete="new-password"
                    value={resetPasswordData.confirmpassword}
                    onChange={onChange}
                    required
                />
                <p className="update-pass-error-msg">{!passMatched && 'Password not matched'}</p>
              </div>
              <div className="form-components">
                <button type="submit" className={`${passMatched ? '' : 'update-pass-btn-disabled'} ${loading ? 'update-pass-btn-disabled' : ''}`} disabled={!passMatched || loading}>Reset password {loading && <SmallLoader className="update-pass-btn-spinner" size={13} />}</button>
              </div>
            </div>
        </form>
      </div>
    </div>
  )
}

export default UpdatePass
