import React from "react";
import "./About.css";
import { Recycle, ShieldCheck, WalletCards } from "lucide-react";

const About = () => {
  return (
    <section className="about" id="about">
      <div className="about-intro">
        <div className="landing-eyebrow">Built for campus life</div>
        <h2 className="about_head1">Less clutter for you.<br/><span className="about_head2">More value for everyone.</span></h2>
        <p className="about_content">
          recyCool is the student-to-student marketplace for books, electronics,
          instruments, room essentials and everything in between. List in minutes,
          meet on campus, and give useful things another chapter.
        </p>
      </div>
      <div className="about-pillars">
        <article><Recycle size={22}/><div><strong>Reuse locally</strong><span>Keep good items moving within campus.</span></div></article>
        <article><WalletCards size={22}/><div><strong>Keep the full value</strong><span>No listing fees and no commissions.</span></div></article>
        <article><ShieldCheck size={22}/><div><strong>Meet with confidence</strong><span>Inspect items yourself before paying.</span></div></article>
      </div>
    </section>
  );
};

export default About;
