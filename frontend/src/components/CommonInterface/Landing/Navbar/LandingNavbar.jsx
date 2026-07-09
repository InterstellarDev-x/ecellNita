import React from "react";
import "./LandingNavbar.css";
import { useNavigate } from "react-router-dom";

function LandingNavbar() {
  const navigate = useNavigate();

  return (
    <div className="landing-navbar">
      <div className="landing-navbar-left-logo" onClick={() => navigate("/")}>
        <img src="/logo.png" alt="Logo" />
      </div>
      <button className="landing-navbar-right-btn-login" onClick={() => navigate("/student-login")}>
        Log in
      </button>
    </div>
  );
}

export default LandingNavbar;
