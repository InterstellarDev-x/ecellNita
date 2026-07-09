import React from 'react';
import WelcomeRocket from '../../../images/welcome-rocket.png';
import './BuyerWelcomePage.css';
import { useNavigate } from 'react-router-dom';

function BuyerWelcomePage() {
  const navigate = useNavigate();
  return (
    <div className='buyer-welcome-page'>
        <div className="buyer-welcome-page-container">
          <img src={WelcomeRocket} alt="" />
          <div className="heading">
            <h3>Hey Levi &#128075;</h3>
            <h3>Welcome to our app</h3>
          </div>
          <div className="body">
            Let's start with a quick product tour and we will have you up and running in no time
          </div>
          <div className="get-started-button">
            <button onClick={()=>navigate('/buyer/productlist')}>Get started</button>
          </div>
        </div>
    </div>
  )
}

export default BuyerWelcomePage