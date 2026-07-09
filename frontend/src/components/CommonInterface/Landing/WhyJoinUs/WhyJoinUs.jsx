import React from 'react';
import './WhyJoinUs.css';
import { useNavigate } from 'react-router-dom';
import ManThinking from '../../../../images/man_thinking.svg';

function WhyJoinUs() {
    const navigate = useNavigate();
  return (
    <div className='landing-why-join-us'>
        <h4>Why Join Us</h4>
        <div className='landing-why-join-us-main'>
            <div className='landing-why-join-us-main-img'>
                <img src={ManThinking} alt="" />
            </div>
            <div className='landing-why-join-us-main-cards'>
                <div className='landing-why-join-us-main-cards-row'>
                    <div className='why-join-us-points'>
                        <h6>Diverse Selection</h6>
                        <p>From cutting-edge electronics to essential engineering instruments, our platform offers a wide variety of items waiting for a second chance</p>
                    </div>
                    <div className='why-join-us-points'>
                        <h6>Easy and Quick Listings</h6>
                        <p>Sellers can list their items with just a few clicks, while buyers can effortlessly browse through a range of products</p>
                    </div>
                </div>
                <div className='landing-why-join-us-main-cards-row'>
                    <div className='why-join-us-points'>
                        <h6>Promote Reuse</h6>
                        <p>Join us in extending the lifecycle of products and promoting a culture of smart, sustainable consumption</p>
                    </div>
                    <div className='why-join-us-points'>
                        <h6>Secure Environment</h6>
                        <p>We prioritize your safety and trust, ensuring a secure space for all transactions</p>
                    </div>
                </div>
                <div className='landing-why-join-us-main-cards-row'>
                    <div className='why-join-us-points'>
                        <h6>Flexible Payments</h6>
                        <p>While we don't handle payments directly, you can easily arrange payments and deliveries outside the platform after negotiation</p>
                    </div>
                    <div className='why-join-us-points'>
                        <h6>Community Impact</h6>
                        <p>Be a part of a community that values sustainability and smart consumption. Let’s give those second-hand items a new home together!</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
  )
}

export default WhyJoinUs