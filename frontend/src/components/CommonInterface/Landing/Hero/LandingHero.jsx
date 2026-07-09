import React from 'react'
import './LandingHero.css'
import { useNavigate } from 'react-router-dom'

function LandingHero() {
    const navigate = useNavigate();
  return (
    <div className='landing-hero'>
        <div className="landing-hero-left">
            <div>
                <div className='landing-hero-left-heading'>
                    <div>
                        <span>Buy and Sell</span>
                        <span className='green'> Quality Items</span>
                    </div>
                    <div>
                        <span className='green'>on Campus</span>
                        <span> in Simple Steps</span>
                    </div>
                </div>
                <div className='landing-hero-left-des'>
                    Connect with Peers, Trade with the Community, and Access Exclusive Campus Deals
                </div>
                <button className="landing-hero-btn" onClick={()=>navigate('/student-signup')}>
                    Get Started &rarr;
                </button>
            </div>
        </div>
    </div>
  )
}

export default LandingHero