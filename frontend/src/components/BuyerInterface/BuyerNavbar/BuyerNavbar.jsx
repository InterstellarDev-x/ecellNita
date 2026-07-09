import React, { useEffect, useRef, useState } from "react";
import "./BuyerNavbar.css";
import { Menu, X } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function BuyerNavbar() {
  const [profilePicture, setProfilePicture] = useState(null);
  const [profileDrop, setProfileDrop] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeLink, setActiveLink] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const dropdownRef = useRef(null);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("campusrecycleuser"));
    setProfilePicture(user?.image);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setProfileDrop(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close drawer on route change
  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    toast.info('You have successfully logged out. See you soon!', {
      position: "top-right",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      theme: "colored",
    });
    localStorage.removeItem('campusrecycletoken');
    localStorage.removeItem('campusrecycleuser');
    setActiveLink('logout');
    setTimeout(() => navigate('/'), 3000);
  };

  return (
    <>
      <ToastContainer />
      <div className="buyer-navbar">
        <div className="buyer-navbar-logo">
          <img
            src="/logo.png"
            alt="Campus Recycle"
            onClick={() => {
              if (location.pathname === '/buyer/productlist') {
                window.location.reload();
              } else {
                navigate('/buyer/productlist');
              }
            }}
          />
        </div>

        {/* Desktop nav links */}
        <div className="buyer-navbar-options">
          <Link to="/buyer/productlist" className={`buyer-navbar-options-item ${location.pathname === "/buyer/productlist" ? "active" : ""}`}>
            Products
          </Link>
          <Link to="/buyer/product-requests" className={`buyer-navbar-options-item ${location.pathname === "/buyer/product-requests" ? "active" : ""}`}>
            Your Requests
          </Link>
        </div>

        <div className="buyer-navbar-right">
          {/* Mobile hamburger */}
          <button className="buyer-navbar-hamburger" onClick={() => setDrawerOpen(true)} aria-label="Open menu">
            <Menu size={20} />
          </button>

          {/* Profile dropdown */}
          <div className="buyer-navbar-accounts" ref={dropdownRef}>
            <div className="toggle" onClick={() => setProfileDrop(o => !o)}>
              <Menu size={16} />
              <img
                src={profilePicture || "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png"}
                alt="Profile"
              />
            </div>
            {profileDrop && (
              <div className="dropdown">
                <Link to="/student-profile" onClick={() => setProfileDrop(false)}>See Profile</Link>
                <Link to="/seller/seller-dashboard" onClick={() => setProfileDrop(false)}>Switch to Seller</Link>
                <Link to="#" onClick={() => { setProfileDrop(false); handleLogout(); }} className={activeLink === 'logout' ? 'active' : ''}>
                  Logout
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Backdrop */}
      {drawerOpen && <div className="buyer-drawer-backdrop" onClick={() => setDrawerOpen(false)} />}

      {/* Slide-in drawer */}
      <div className={`buyer-drawer${drawerOpen ? " open" : ""}`}>
        <button className="buyer-drawer-close" onClick={() => setDrawerOpen(false)} aria-label="Close menu">
          <X size={22} />
        </button>

        <div className="buyer-drawer-logo">
          <img src="/logo.png" alt="Campus Recycle" onClick={() => { navigate('/buyer/productlist'); }} />
        </div>

        <nav className="buyer-drawer-links">
          <Link to="/buyer/productlist" className={`buyer-drawer-item ${location.pathname === "/buyer/productlist" ? "active" : ""}`}>
            Products
          </Link>
          <Link to="/buyer/product-requests" className={`buyer-drawer-item ${location.pathname === "/buyer/product-requests" ? "active" : ""}`}>
            Your Requests
          </Link>
        </nav>
      </div>
    </>
  );
}

export default BuyerNavbar;
