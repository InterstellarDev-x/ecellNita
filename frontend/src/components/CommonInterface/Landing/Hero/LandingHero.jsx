import React from 'react'
import './LandingHero.css'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, BadgeCheck, Leaf, MapPin } from 'lucide-react'
import ProductImage from '../../../../images/product-image-landing.jpg'

function LandingHero() {
  const navigate = useNavigate();

  return (
    <section className='landing-hero'>
      <div className="landing-hero-left">
        <div className="landing-hero-copy">
          <h1 className='landing-hero-left-heading'>
            Good stuff deserves a <span className='green'>second semester.</span>
          </h1>
          <p className='landing-hero-left-des'>
            Buy what you need and pass on what you don't—directly with students on campus. Better prices, less waste, zero commission.
          </p>
          <div className="landing-hero-actions">
            <button className="landing-hero-btn" onClick={() => navigate('/student-signup')}>
              Start selling <ArrowRight size={18} />
            </button>
            <button className="landing-hero-btn-secondary" onClick={() => navigate('/student-login')}>
              I have an account
            </button>
          </div>
          <div className="landing-hero-trust">
            <span><BadgeCheck size={18} /> Campus community</span>
            <span><Leaf size={18} /> Sustainable by default</span>
          </div>
        </div>
      </div>

      <div className="landing-hero-visual" aria-label="A sample recyCool product listing">
        <div className="hero-orbit hero-orbit-one"></div>
        <div className="hero-orbit hero-orbit-two"></div>
        <div className="hero-floating-note"><Leaf size={17} /> One more life</div>
        <article className="hero-product-card">
          <div className="hero-product-image-wrap">
            <img src={ProductImage} alt="Red sports shoes available for resale" />
            <span className="hero-product-condition">Great condition</span>
          </div>
          <div className="hero-product-details">
            <div>
              <p className="hero-product-category">Campus find</p>
              <h2>Running shoes</h2>
            </div>
            <strong>₹1,400</strong>
          </div>
          <div className="hero-product-meta">
            <span><MapPin size={15} /> NIT Agartala</span>
            <span>Posted today</span>
          </div>
        </article>
        <div className="hero-impact-card">
          <span>THIS TRADE SAVES</span>
          <strong>1 item</strong>
          <small>from sitting unused</small>
        </div>
      </div>
    </section>
  )
}

export default LandingHero
