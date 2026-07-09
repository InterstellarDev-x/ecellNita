import React from 'react'
import './LandingHowHelps.css'
import Upskilling from '../../../../images/upskilling.png';
import Hassle from '../../../../images/hassle.png';
import Resume from '../../../../images/resume.png';
import EasyMoney from '../../../../images/easymoney.png';
import { useNavigate } from 'react-router-dom';

function LandingHowHelps() {
    const navigate = useNavigate();
  return (
    <div className='landing-how-helps'>
        <h4>How recyCool helps you</h4>
        <div className="landing-how-helps-cards">
            <div className="card">
                <div>
                    <img src={Upskilling} alt="" />
                </div>
                <div>First-of-Its-Kind Platform</div>
                <p>Introducing our college's first-ever digital marketplace for reusing items! Say goodbye to needless products and hello to sustainability with our innovative Item Exchange Hub.</p>
            </div>
            <div className="card">
                <div>
                    <img src={Hassle} alt="" />
                </div>
                <div>E-Cell Innovation</div>
                <p>Powered by NIT Agartala’s E-Cell, this initiative is a game-changer for campus sustainability. Let’s set an example for colleges nationwide, showing how innovation can drive sustainability and smart consumption.</p>
            </div>
            <div className="card">
                <div>
                    <img src={Resume} alt="" />
                </div>
                <div>Verified Products</div>
                <p>Get hands-on verified product directly during buying. You can check the quality of the product by yourself.</p>
            </div>
            <div className="card">
                <div>
                    <img src={EasyMoney} alt="" />
                </div>
                <div>Cheap Price</div>
                <p>Get best usable products at cheapest rates possible! Bargain, negotiate, it's all our colege family.</p>
            </div>
        </div>
        <div>
            <button className="landing-how-helps-btn" onClick={()=>navigate('/student-signup')}>Get Started</button>
        </div>
    </div>
  )
}

export default LandingHowHelps