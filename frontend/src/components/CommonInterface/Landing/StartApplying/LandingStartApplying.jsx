import React from 'react'
import './LandingStartApplying.css'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Recycle } from 'lucide-react'

function LandingStartApplying() {
  const navigate = useNavigate();

  return (
    <section className='landing-start-applying'>
      <div className="cta-loop"><Recycle size={30}/></div>
      <span>YOUR UNUSED COULD BE SOMEONE ELSE'S FIND</span>
      <h2>Ready to put good stuff<br/>back in the loop?</h2>
      <p>Join NITA's student marketplace. List free, discover locally, reuse more.</p>
      <button className='landing-start-applying-btn' onClick={() => navigate('/student-signup')}>Join recyCool <ArrowRight size={18}/></button>
    </section>
  )
}

export default LandingStartApplying
