import React from 'react'
import './LandingFaqs.css'
import FaqBlocks from './FaqBlocks';
import { faqs } from './Faqs';

function LandingFaqs() {
  const allFaqs = faqs;
  return (
    <div className='landing-faqs'>
      <h4>FAQs</h4>
      {
        allFaqs.map((faq)=>{
          return <FaqBlocks question={faq.question} answer={faq.answer}/>
        })
      }
    </div>
  )
}

export default LandingFaqs