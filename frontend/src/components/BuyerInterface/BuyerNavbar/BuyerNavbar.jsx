import React, { useEffect, useRef, useState } from "react";
import "./BuyerNavbar.css";
import { ClipboardList, Heart, Package, MessageCircle } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { toast } from 'react-toastify';
import NotificationBell from "../../CommonInterface/Notifications/NotificationBell";

function BuyerNavbar() {
  const [profilePicture, setProfilePicture] = useState(null);
  const [profileDrop, setProfileDrop] = useState(false);
  const [activeLink, setActiveLink] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const dropdownRef = useRef(null);

  useEffect(() => {
    const syncProfilePicture = () => {
      const user = JSON.parse(localStorage.getItem("campusrecycleuser"));
      setProfilePicture(user?.image);
    };

    syncProfilePicture();
    window.addEventListener("campusrecycleuser-updated", syncProfilePicture);
    return () => window.removeEventListener("campusrecycleuser-updated", syncProfilePicture);
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

  const handleLogout = () => {
    toast.info('You have successfully logged out. See you soon!', {
      position: "top-right",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    });
    localStorage.removeItem('campusrecycletoken');
    localStorage.removeItem('campusrecycleuser');
    setActiveLink('logout');
    setTimeout(() => navigate('/'), 3000);
  };

  return (
    <>
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
          <Link to="/buyer/wishlist" className={`buyer-navbar-options-item ${location.pathname === "/buyer/wishlist" ? "active" : ""}`}>
            Wishlist
          </Link>
          <Link to="/buyer/questions" className={`buyer-navbar-options-item ${location.pathname === "/buyer/questions" ? "active" : ""}`}>
            Questions
          </Link>
        </div>

        <div className="buyer-navbar-right">
          <NotificationBell audience="buyer" />
          {/* Profile dropdown */}
          <div className="buyer-navbar-accounts" ref={dropdownRef}>
            <div className="toggle" onClick={() => setProfileDrop(o => !o)}>
              <img
                src={profilePicture || "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png"}
                alt="Profile"
              />
            </div>
            {profileDrop && (
              <div className="dropdown">
                <Link to="/student-profile" onClick={() => setProfileDrop(false)}>See Profile</Link>
                <Link to="/seller/seller-dashboard" onClick={() => setProfileDrop(false)}>Switch to Seller</Link>
                <Link to="/feature-request" onClick={() => setProfileDrop(false)}>Request a feature</Link>
                <Link to="#" onClick={() => { setProfileDrop(false); handleLogout(); }} className={activeLink === 'logout' ? 'active' : ''}>
                  Logout
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
      <nav className="buyer-mobile-nav" aria-label="Buyer navigation">
        <Link to="/buyer/productlist" className={location.pathname === "/buyer/productlist" ? "active" : ""}>
          <Package size={20} />
          <span>Products</span>
        </Link>
        <Link to="/buyer/product-requests" className={location.pathname === "/buyer/product-requests" ? "active" : ""}>
          <ClipboardList size={20} />
          <span>Requests</span>
        </Link>
        <Link to="/buyer/wishlist" className={location.pathname === "/buyer/wishlist" ? "active" : ""}>
          <Heart size={20} />
          <span>Wishlist</span>
        </Link>
        <Link to="/buyer/questions" className={location.pathname === "/buyer/questions" ? "active" : ""}>
          <MessageCircle size={20} />
          <span>Questions</span>
        </Link>
      </nav>
    </>
  );
}

export default BuyerNavbar;
