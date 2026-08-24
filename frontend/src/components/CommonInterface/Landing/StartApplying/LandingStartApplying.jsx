import React from 'react'
import './LandingStartApplying.css'
import { useNavigate } from 'react-router-dom'

function LandingStartApplying() {
  const navigate = useNavigate();
  return (
    <div className='landing-start-applying'>
        <h2>Start exchanging on campus today</h2>
        <p className='landing-start-applying-signup'>Join Campus Recycle</p>
        <button className='landing-start-applying-btn' onClick={()=>navigate('/student-signup')}>Create account</button>
    </div>
  )
}

export default LandingStartApplying
