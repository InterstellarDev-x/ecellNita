import React from 'react'
import './LandingHowHelps.css'
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Handshake, PackagePlus, Search } from 'lucide-react';

function LandingHowHelps() {
  const navigate = useNavigate();

  return (
    <section className='landing-how-helps' id="how-it-works">
      <div className="landing-section-heading">
        <span className="landing-eyebrow">Simple by design</span>
        <h2>From unused to<br/><span>someone's new favourite.</span></h2>
        <p>Three steps. No middleman. No complicated checkout.</p>
      </div>
      <div className="landing-how-helps-cards">
        <article className="help-card"><span className="help-card-number">01</span><div className="help-card-icon"><PackagePlus/></div><h3>List what you don't use</h3><p>Add photos, describe the condition, and set a fair student-friendly price.</p></article>
        <article className="help-card featured"><span className="help-card-number">02</span><div className="help-card-icon"><Search/></div><h3>Find it around campus</h3><p>Browse useful finds from fellow students instead of buying everything new.</p></article>
        <article className="help-card"><span className="help-card-number">03</span><div className="help-card-icon"><Handshake/></div><h3>Connect and exchange</h3><p>Talk directly, inspect the item, and arrange a convenient campus handoff.</p></article>
      </div>
      <button className="landing-how-helps-btn" onClick={() => navigate('/student-signup')}>Create your free account <ArrowRight size={18}/></button>
    </section>
  )
}

export default LandingHowHelps
