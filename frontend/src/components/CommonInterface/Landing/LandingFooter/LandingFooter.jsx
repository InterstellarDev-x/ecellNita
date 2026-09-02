import React from 'react'
import './LandingFooter.css'
import { Instagram, Facebook, X, Linkedin, Leaf } from 'lucide-react'

function LandingFooter() {
  return (
    <footer className='landing-footer'>
      <div className="landing-footer-brand">
        <div className="landing-footer-logo">recy<span>Cool</span></div>
        <p><Leaf size={15}/> Good things, kept in motion.</p>
      </div>
      <div className="landing-footer-content">
        <div className='landing-footer-content-contact'>An E-CELL NITA initiative</div>
        <div className='landing-footer-content-copyright'>© {new Date().getFullYear()} recyCool. All rights reserved.</div>
      </div>
      <div className='landing-footer-social-media'>
        <a href="https://www.linkedin.com/company/ecellnita/?originalSubdomain=in" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn"><Linkedin className='landing-page-footer-bg' size={40}/></a>
        <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram"><Instagram className='landing-page-footer-bg' size={40}/></a>
        <a href="https://www.facebook.com/ecellnita/" target="_blank" rel="noopener noreferrer" aria-label="Facebook"><Facebook className='landing-page-footer-bg' size={40}/></a>
        <a href="https://x.com/nitaecell" target="_blank" rel="noopener noreferrer" aria-label="X"><X className='landing-page-footer-bg' size={40}/></a>
      </div>
    </footer>
  )
}

export default LandingFooter
