import React from 'react';
import WelcomeRocket from '../../../images/welcome-rocket.png';
import './SellerWelcomePage.css';
import { useNavigate } from 'react-router-dom';

function SellerWelcomePage() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("campusrecycleuser") || "{}");
  const firstName = user?.firstname || user?.name?.split(" ")[0] || "there";
  return (
    <div className='seller-welcome-page'>
        <div className="seller-welcome-page-container">
          <img src={WelcomeRocket} alt="" />
          <div className="heading">
            <h3>Hey {firstName} &#128075;</h3>
            <h3>Welcome to our app</h3>
          </div>
          <div className="body">
            Let's start with a quick product tour and we will have you up and running in no time
          </div>
          <div className="get-started-button">
            <button onClick={()=>navigate('/seller/seller-dashboard')}>Get started</button>
          </div>
        </div>
    </div>
  )
}

export default SellerWelcomePage