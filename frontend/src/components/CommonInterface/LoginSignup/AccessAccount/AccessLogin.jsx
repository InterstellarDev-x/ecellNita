import React from 'react';
import './AccessLogin.css';

import { Link, useNavigate } from 'react-router-dom';

const AccessLogin = () => {
  const navigate = useNavigate(); // Obtain navigate function from useNavigate hook

  return (
    <div className='accessLogin'>
      <div className='access-account buyer-account'>
        <div className='access-account-head'>For <span>Companies</span></div>
        <div className='access-account-text'>We are the market–leading technical interview platform to identify and hire developers with the right skills.</div>
        <button onClick={e => navigate('/seller-login')}>Login</button>
        <div className='access-account-below'>Don't have an account?</div>
        <div className='access-link'><Link to='/seller-signup'>Sign Up</Link></div>
      </div>
      <div className='access-account'>
        <div className='access-account-head'>For <span>Developers</span></div>
        <div className='access-account-text'>Join over 21 million developers, practice coding skills, prepare for interviews, and get hired.</div>
        <button onClick={e => navigate('/student-login')}>Login</button>
        <div className='access-account-below'>Don't have an account?</div>
        <div className='access-link'><Link to='/buyer-signup'>Sign Up</Link></div>
      </div>
    </div>
  );
}

export default AccessLogin;
