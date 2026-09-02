import React from 'react'
import './LandingFaqs.css'
import FaqBlocks from './FaqBlocks';
import { faqs } from './Faqs';

function LandingFaqs() {
  const allFaqs = faqs;
  return (
    <section className='landing-faqs'>
      <div className="landing-section-heading faq-heading"><span className="landing-eyebrow">The useful details</span><h2>Questions, answered.</h2></div>
      {
        allFaqs.map((faq)=>{
          return <FaqBlocks key={faq.question} question={faq.question} answer={faq.answer}/>
        })
      }
    </section>
  )
}

export default LandingFaqs
