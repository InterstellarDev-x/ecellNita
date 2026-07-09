import React from 'react'
import AboutHero from '../components/About/AboutHero'
import LandingNavbar from '../components/CommonInterface/Landing/Navbar/LandingNavbar'
import AboutContent from '../components/About/AboutContent'
import LandingFooter from '../components/CommonInterface/Landing/LandingFooter/LandingFooter'
import AboutBenifits from '../components/About/AboutBenifits'

function About() {
  return (
    <>
        
        <LandingNavbar/>
        <AboutHero/>
        <AboutContent/>
        <AboutBenifits/>
        <LandingFooter/>
    </>
  )
}

export default About