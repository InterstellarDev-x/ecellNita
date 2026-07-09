import React from "react";
import "./About.css";
const About = () => {
  return (
    <div className="about">
      <div className="about_head1">Welcome to our Item Exchange Hub</div>
      <div className="about_head2">
        {" "}
        A dedicated marketplace for our institution
      </div>
      <div className="about_head1">connecting buyers and sellers</div>
      <div className="about_content">
        <p>
          {" "}
          It’s a platform for a wide variety of items - from electronic items to
          engineering instruments. We believe in extending the lifecycle of
          products, promoting a culture of reusing. Sellers can list their items with a few simple clicks, and buyers can
          browse through the products easily. We prioritize safety and trust,
          ensuring a secure environment for our users. We don’t handle payments directly yet. For the time being, parties can
          arrange payment and delivery outside the platform after negotiation. Join us in this journey of sustainability and smart consumption.
          Second hand items are now gonna find new homes directly!
        </p>
      </div>
    </div>
  );
};

export default About;
