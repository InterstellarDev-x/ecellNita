import React, { useState } from 'react';
import { Eye } from 'lucide-react';
import './UpdatePass.css'
import { apiConnector } from '../../../utils/Apiconnecter';
import { authroutes } from '../../../apis/apis';
import { useNavigate } from 'react-router-dom';
import SmallLoader from "../SmallLoader/SmallLoader";

function UpdatePass() {
    const navigate = useNavigate();
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
        setloading(true);
        e.preventDefault();
        try {
            const responseObj = await apiConnector(
                "POST",
                authroutes.RESET_PASSWORD,
                {
                    password: resetPasswordData.password,
                    confirmpassword: resetPasswordData.confirmpassword,
                    token: window.location.pathname.split("/")[window.location.pathname.split("/").length - 1]
                }
            )
            if(responseObj.data.success){
              setloading(false);
              navigate('/getstarted');
            }else{
              if(responseObj.data.message === "Invalid Token"){
                setErrorMsg({
                  msg: "Token expired! Do forgot password again",
                  type: "invalid token"
                })
              }
              setloading(false);
            }
        } catch (error) {
            console.error(error);
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
                  {errorMsg.type === "invalid token"
                    ? errorMsg.msg
                    : ""}
                </p>
              </div>
              <div className="form-components">
                <label htmlFor="password">Password</label>
                <div className="update-pass-password-div">
                    <input
                        type={passView ? "text" : "password"}
                        id="password"
                        name="password"
                        value={resetPasswordData.password}
                        onChange={onChange}
                        required
                    />
                  <Eye
                    size={20}
                    style={{ cursor: "pointer" }}
                    onClick={togglePassView}
                  />
                </div>
              </div>
              <div className="form-components">
                <label htmlFor="confirmpassword">Confirm Password</label>
                <input
                    type={passView ? "text" : "password"}
                    id="confirmpassword"
                    name="confirmpassword"
                    value={resetPasswordData.confirmpassword}
                    onChange={onChange}
                    required
                />
                <p className="update-pass-error-msg">{!passMatched && 'Password not matched'}</p>
              </div>
              <div className="form-components">
                <button type="submit" className={`${passMatched ? '' : 'update-pass-btn-disabled'} ${loading ? 'update-pass-btn-disabled' : ''}`} disabled={!passMatched}>Reset password {loading && <SmallLoader className="update-pass-btn-spinner" size={13} />}</button>
              </div>
            </div>
        </form>
      </div>
    </div>
  )
}

export default UpdatePass