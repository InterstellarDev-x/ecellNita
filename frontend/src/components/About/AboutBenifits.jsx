import React from 'react'
import './AboutBenifits.css'
import AboutBenifitsImage from '../../images/about-benifits.jpg';
import { Check, CheckCircle, CheckCircle2 } from 'lucide-react';

function AboutBenifits() {
  return (
    <div className='about-benifits'>
        <div>
            <div className='about-benifits-left'>
                <img src={AboutBenifitsImage} alt="" />
            </div>
            <div className='about-benifits-right'>
                <h2>Benifits you get</h2>
                <div className='about-benifits-right-point'>
                    <CheckCircle2 color='green' size={35} />
                    <p>Access quality items at student-friendly prices, making it easy to find essentials without overspending.</p>
                </div>
                <div className='about-benifits-right-point'>
                    <CheckCircle2 color='green' size={30} />
                    <p>Promote sustainability by giving preloved items a new life and reducing campus waste.</p>
                </div>
                <div className='about-benifits-right-point'>
                    <CheckCircle2 color='green' size={30} />
                    <p>Buy and sell exclusively with fellow students, ensuring a safe and reliable trading environment.</p>
                </div>
                <div className='about-benifits-right-point'>
                    <CheckCircle2 color='green' size={35} />
                    <p>Enjoy hassle-free transactions with easy communication, quick exchanges, and secure on-campus pickups.</p>
                </div>
            </div>
            
        </div>
    </div>
  )
}

export default AboutBenifits