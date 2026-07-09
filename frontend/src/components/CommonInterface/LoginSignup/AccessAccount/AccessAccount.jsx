import React, { useState } from 'react'
import './AccessAccount.css'
import AccessLogin from './AccessLogin'

import LandingFooter from '../../../CommonInterface/Landing/LandingFooter/LandingFooter'
import { Menu, Plus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

function AccessAccount() {
    const navigate = useNavigate();
    const [showHamNav, setShowHamNav] = useState(false);
    
    const toggleShowNav = () => {
        setShowHamNav(prevState => !prevState);
    }

    return (
        <div>
            <div className='landing-navbar'>
                <div className="landing-navbar-left">
                    <div className="landing-navbar-left-logo">
                        Campus Recycle
                    </div>
                    <div className="landing-navbar-left-explore">
                        <p>Explore &rarr;</p>
                    </div>
                </div>
                <div className="landing-navbar-right">
                    <div className='landing-navbar-right-btn-sec'>
                        <button className='landing-navbar-right-btn-login' onClick={() => navigate('/')}>Home</button>
                        <button className='landing-navbar-right-btn-signup' onClick={() => navigate('/getstarted')}>Sign Up</button>
                    </div>
                    <Menu className='landing-navbar-right-hammenu' size={30} onClick={toggleShowNav} />
                </div>
                {showHamNav && (
                    <div className="landing-hamberger-menu">
                        <div className='landing-hamberger-menu-top'>
                            <div className="landing-navbar-left-logo">
                                Campus Recycle
                            </div>
                            <Plus style={{ rotate: "45deg" }} size={30} onClick={toggleShowNav} />
                        </div>
                        <div className="landing-hamberger-menu-btns">
                            <button className='landing-hamberger-menu-btn-login' onClick={() => navigate('/')}>Home</button>
                            <button className='landing-hamberger-menu-btn-signup' onClick={() => navigate('/getstarted')}>Sign Up</button>
                        </div>
                    </div>
                )}
            </div>
<AccessLogin/>

<LandingFooter/>
        </div>
    )
}

export default AccessAccount
