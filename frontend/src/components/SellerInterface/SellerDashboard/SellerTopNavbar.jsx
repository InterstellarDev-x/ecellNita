import React, { useEffect, useRef, useState } from "react";
import "./SellerTopNavbar.css";
import { Link, useNavigate } from "react-router-dom";
import { Menu } from "lucide-react";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function SellerTopNavbar({ onMenuClick }) {
  const [userDetails, setUserDetails] = useState(null);
  const [profilePicture, setProfilePicture] = useState(null);
  const [profileDrop, setProfileDrop] = useState(false);
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("campusrecycleuser"));
    setProfilePicture(user?.image);
    setUserDetails(user);
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
    toast.success('You have successfully logged out. See you soon!', {
      position: "top-right",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      theme: "colored",
    });
    localStorage.removeItem("campusrecycletoken");
    localStorage.removeItem("campusrecycleuser");
    setTimeout(() => navigate("/"), 3000);
  };

  return (
    <div className="seller-top-navbar">
      <ToastContainer />

      {/* Mobile hamburger */}
      <button className="seller-top-navbar-hamburger" onClick={onMenuClick} aria-label="Toggle sidebar">
        <Menu size={22} />
      </button>

      <div className="profile" onClick={() => setProfileDrop(o => !o)} ref={dropdownRef}>
        <img
          src={profilePicture || "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png"}
          alt="Profile"
        />
        <div>
          <h6>{userDetails?.firstname}</h6>
          <p>{userDetails?.email}</p>
        </div>
        {profileDrop && (
          <div className="dropdown">
            <Link to="/student-profile" onClick={() => setProfileDrop(false)}>See Profile</Link>
            <Link to="/buyer/productlist" onClick={() => setProfileDrop(false)}>Switch to Buyer</Link>
            <Link onClick={() => { setProfileDrop(false); handleLogout(); }} className="logout-button">Logout</Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default SellerTopNavbar;
