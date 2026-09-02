import React from 'react';
import './WhyJoinUs.css';
import { useNavigate } from 'react-router-dom';
import { BadgeIndianRupee, BookOpen, ShieldCheck, Sprout } from 'lucide-react';

function WhyJoinUs() {
  const navigate = useNavigate();

  return (
    <section className='landing-why-join-us' id="why-join">
      <div className='landing-why-join-us-main'>
        <div className='landing-why-join-us-main-img'>
          <span className="landing-eyebrow">Why recyCool</span>
          <h2>Made for the way<br/>campus actually works.</h2>
          <p>That calculator, cycle, mattress or lab coat shouldn't be hard to find—or go unused after one semester.</p>
          <button onClick={() => navigate('/student-signup')}>Join the campus loop</button>
        </div>
        <div className='landing-why-join-us-main-cards'>
          <article className='why-join-us-points'><BookOpen/><span>01</span><h3>Student essentials</h3><p>Find the things campus life actually calls for, all in one place.</p></article>
          <article className='why-join-us-points'><BadgeIndianRupee/><span>02</span><h3>Smarter prices</h3><p>Deal directly with peers and keep every rupee of the sale.</p></article>
          <article className='why-join-us-points'><ShieldCheck/><span>03</span><h3>See before you pay</h3><p>Meet locally and check the product in person before exchanging.</p></article>
          <article className='why-join-us-points'><Sprout/><span>04</span><h3>Lighter footprint</h3><p>Every reused item means less waste and one less new purchase.</p></article>
        </div>
      </div>
    </section>
  )
}

export default WhyJoinUs
