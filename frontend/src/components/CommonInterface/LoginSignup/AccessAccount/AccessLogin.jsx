import React from 'react';
import './AccessLogin.css';

import { Link, useNavigate } from 'react-router-dom';

const AccessLogin = () => {
  const navigate = useNavigate(); // Obtain navigate function from useNavigate hook

  return (
    <div className='accessLogin'>
      <div className='access-account buyer-account'>
        <div className='access-account-head'>For <span>Sellers</span></div>
        <div className='access-account-text'>Turn unused books, electronics, and campus essentials into value for another student.</div>
        <button onClick={() => navigate('/student-login')}>Login</button>
        <div className='access-account-below'>Don't have an account?</div>
        <div className='access-link'><Link to='/student-signup'>Sign Up</Link></div>
      </div>
      <div className='access-account'>
        <div className='access-account-head'>For <span>Buyers</span></div>
        <div className='access-account-text'>Find affordable second-hand essentials and arrange a safe exchange at an approved campus location.</div>
        <button onClick={() => navigate('/student-login')}>Login</button>
        <div className='access-account-below'>Don't have an account?</div>
        <div className='access-link'><Link to='/student-signup'>Sign Up</Link></div>
      </div>
    </div>
  );
}

export default AccessLogin;
