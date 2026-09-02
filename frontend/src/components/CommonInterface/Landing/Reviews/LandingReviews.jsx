import React, { useState } from 'react'
import './LandingReviews.css'
import Marquee from "react-fast-marquee";
import { CirclePause, CirclePlay, MessageCircleMore, Quote } from 'lucide-react';
import ReviewUser from '../../../../images/review_user.jpg';

function LandingReviews() {
  const [playing, setPlaying] = useState(true);
  const playPause = () => setPlaying((current) => !current);

  return (
    <section className='landing-reviews' id="stories">
      <div className="landing-section-heading review-heading">
        <span className="landing-eyebrow">Campus voices</span>
        <h2>Already making<br/><span>student life lighter.</span></h2>
      </div>
      <div className="reviews">
        <div className="review-play-pause-btn">
          {playing
            ? <CirclePause onClick={playPause} aria-label="Pause reviews"/>
            : <CirclePlay onClick={playPause} aria-label="Play reviews"/>}
        </div>
        <Marquee speed={65} play={playing} className='landing-review-marquee' pauseOnHover>
          <article className="review">
            <div className="review-top-comment-icon"><Quote size={42} className='review-top-comment-icon-ico'/></div>
            <div className='review-top-comment-main'>
              <div className="review-user-image"><img src={ReviewUser} alt="A student using recyCool" /></div>
              <div className="review-user-about">
                <div className="review-paragraph">“It finally gives students one simple place to buy and sell within campus. It feels convenient, direct and made for us.”</div>
                <p>NITA STUDENT <span>Early community member</span></p>
              </div>
            </div>
          </article>
          <article className="review review-blue">
            <div className="review-top-comment-icon"><MessageCircleMore size={42} className='review-top-comment-icon-ico'/></div>
            <div className='review-top-comment-main'>
              <div className="review-user-image"><img src={ReviewUser} alt="A student using recyCool" /></div>
              <div className="review-user-about">
                <div className="review-paragraph">“Instead of letting useful things gather dust, we can pass them to someone who actually needs them next semester.”</div>
                <p>NITA STUDENT <span>Early community member</span></p>
              </div>
            </div>
          </article>
        </Marquee>
      </div>
    </section>
  )
}

export default LandingReviews
