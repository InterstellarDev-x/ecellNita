import React, { useState } from 'react'
import {ChevronRight} from 'lucide-react'
import './LandingFaqs.css'

function FaqBlocks(props) {
    const [showAns, setShowAns] = useState(false);
  const toggleAnswerView = () => {
    if(showAns){
      setShowAns(false);
    }else{
      setShowAns(true)
    }
  }
  return (
    <div className="faq-blocks">
        <div className="question" onClick={toggleAnswerView}>
            {props.question}
            <ChevronRight className={`${showAns ? 'rotate-90' : ''}`} style={{cursor: "pointer"}}/>
        </div>
        {
            showAns &&
            <div className="answer">
              {props.answer}
            </div>
        }
    </div>
  )
}

export default FaqBlocks