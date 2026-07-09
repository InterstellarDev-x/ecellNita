import React from 'react'
import './LandingStartApplying.css'
import { useNavigate } from 'react-router-dom'

function LandingStartApplying() {
  const navigate = useNavigate();
  return (
    <div className='landing-start-applying'>
        <h2>Start applying for companies NOW</h2>
        <p className='landing-start-applying-signup'>Sign Up now</p>
        <button className='landing-start-applying-btn' onClick={()=>navigate('/student-signup')}>Start now</button>
    </div>
  )
}

export default LandingStartApplying