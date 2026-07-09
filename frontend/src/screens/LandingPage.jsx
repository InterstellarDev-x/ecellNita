import React from 'react'
import LandingNavbar from '../components/CommonInterface/Landing/Navbar/LandingNavbar'
import LandingHero from '../components/CommonInterface/Landing/Hero/LandingHero'
import LandingNumbers from '../components/CommonInterface/Landing/Numbers/LandingNumbers'
import LandingHowHelps from '../components/CommonInterface/Landing/HowHelps/LandingHowHelps'
import LandingReviews from '../components/CommonInterface/Landing/Reviews/LandingReviews'
import LandingFaqs from '../components/CommonInterface/Landing/Faqs/LandingFaqs'
import LandingStartApplying from '../components/CommonInterface/Landing/StartApplying/LandingStartApplying'
import LandingFooter from '../components/CommonInterface/Landing/LandingFooter/LandingFooter'
import About from '../components/CommonInterface/Landing/About/About'
import WhyJoinUs from '../components/CommonInterface/Landing/WhyJoinUs/WhyJoinUs'
function LandingPage() {
  return (
    <>
        <LandingNavbar/>
        <LandingHero/>
        <About/>
        <LandingNumbers/>
        <LandingHowHelps/>
        <WhyJoinUs/>
        <LandingReviews/>
        <LandingFaqs/>
        <LandingStartApplying/>
        <LandingFooter/>
    </>
  )
}

export default LandingPage