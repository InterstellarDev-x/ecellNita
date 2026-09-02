import React, { useEffect, useState } from "react";
import "./LandingNavbar.css";
import { ArrowUpRight, Menu, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

function LandingNavbar() {
  const navigate = useNavigate();
  const [showMobileNav, setShowMobileNav] = useState(false);

  const closeAndNavigate = (path) => {
    setShowMobileNav(false);
    navigate(path);
  };

  useEffect(() => {
    if (!showMobileNav) return undefined;

    document.body.classList.add("landing-menu-open");
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setShowMobileNav(false);
    };
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.classList.remove("landing-menu-open");
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [showMobileNav]);

  return (
    <header className={`landing-navbar${showMobileNav ? " landing-navbar--menu-open" : ""}`}>
      <div className="landing-navbar-left">
        <div className="landing-navbar-left-logo" onClick={() => navigate("/")}>
          <img src="/logo.png" alt="recyCool home" />
          <span>For NITA</span>
        </div>
        <nav className="landing-navbar-left-explore" aria-label="Landing page navigation">
          <a href="#how-it-works">How it works</a>
          <a href="#why-join">Why recyCool</a>
          <a href="#stories">Student voices</a>
        </nav>
      </div>

      <div className="landing-navbar-right">
        <div className="landing-navbar-right-btn-sec">
          <button className="landing-navbar-right-btn-login" onClick={() => navigate("/student-login")}>Log in</button>
          <button className="landing-navbar-right-btn-signup" onClick={() => navigate("/student-signup")}>Join the loop <ArrowUpRight size={16} /></button>
        </div>
        <button
          type="button"
          className="landing-navbar-right-hammenu"
          onClick={() => setShowMobileNav(true)}
          aria-label="Open navigation menu"
          aria-expanded={showMobileNav}
        >
          <Menu size={27} />
        </button>
      </div>

      {showMobileNav && (
        <div className="landing-hamburger-menu" role="dialog" aria-modal="true" aria-label="Mobile navigation">
          <div className="landing-hamburger-menu-top">
            <div className="landing-navbar-left-logo" onClick={() => closeAndNavigate("/")}><img src="/logo.png" alt="recyCool home" /></div>
            <button type="button" className="landing-hamburger-close" onClick={() => setShowMobileNav(false)} aria-label="Close navigation menu" autoFocus>
              <Plus size={29} />
            </button>
          </div>
          <nav className="landing-hamburger-links" aria-label="Mobile landing page navigation">
            <a href="#how-it-works" onClick={() => setShowMobileNav(false)}>How it works</a>
            <a href="#why-join" onClick={() => setShowMobileNav(false)}>Why recyCool</a>
            <a href="#stories" onClick={() => setShowMobileNav(false)}>Student voices</a>
          </nav>
          <div className="landing-hamburger-menu-btns">
            <button className="landing-hamburger-menu-btn-login" onClick={() => closeAndNavigate("/student-login")}>Log in</button>
            <button className="landing-hamburger-menu-btn-signup" onClick={() => closeAndNavigate("/student-signup")}>Join the loop</button>
          </div>
        </div>
      )}
    </header>
  );
}

export default LandingNavbar;
