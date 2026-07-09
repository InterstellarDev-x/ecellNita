import React from 'react'
import './LandingFooter.css'
import { Instagram, Facebook, X, Linkedin } from 'lucide-react'

function LandingFooter() {
  return (
    <div className='landing-footer'>
        <div className="landing-footer-logo">Campus Recycle</div>
        <div className="landing-footer-content">
            <div className='landing-footer-content-contact'>
                Contact | E-CELL NITA
            </div>
            <div className='landing-footer-content-copyright'>
                Copyright 2024 Campus Recycle - All rights reserved
            </div>
        </div>
        <div className='landing-footer-social-media'>
            <a href="https://www.linkedin.com/company/ecellnita/?originalSubdomain=in" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
                <Linkedin className='landing-page-footer-bg' size={40}/>
            </a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                <Instagram className='landing-page-footer-bg' size={40}/>
            </a>
            <a href="https://www.facebook.com/ecellnita/" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                <Facebook className='landing-page-footer-bg' size={40}/>
            </a>
            <a href="https://x.com/nitaecell" target="_blank" rel="noopener noreferrer" aria-label="YouTube">
                <X className='landing-page-footer-bg' size={40}/>
            </a>
        </div>
    </div>
  )
}

export default LandingFooter