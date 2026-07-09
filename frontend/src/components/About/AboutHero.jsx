import React from 'react';
import AboutHeroImage from '../../images/abouthero.jpg';
import './AboutHero.css'

function AboutHero() {
  return (
    <div className='about-hero'>
        <div className="content">
            <div className='about-hero-left'>
                <h2>Best Way to Sell in Campus</h2>
                <p>Recycool offers a seamless platform for students to buy and sell within the campus community. With verified student listings, instant chat, and safe transactions, Recycool ensures an efficient, trusted way to trade preloved items.</p>
            </div>
            <div className='about-hero-right'>
                <img src={AboutHeroImage} alt="about-hero" />
            </div>
        </div>
    </div>
  )
}

export default AboutHero