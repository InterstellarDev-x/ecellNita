import React, { useEffect, useRef, useState } from "react";
import "./SellerTopNavbar.css";
import { Link, useNavigate } from "react-router-dom";
import { toast } from 'react-toastify';

function SellerTopNavbar() {
  const [userDetails, setUserDetails] = useState(null);
  const [profilePicture, setProfilePicture] = useState(null);
  const [profileDrop, setProfileDrop] = useState(false);
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  useEffect(() => {
    const syncUserDetails = () => {
      const user = JSON.parse(localStorage.getItem("campusrecycleuser"));
      setProfilePicture(user?.image);
      setUserDetails(user);
    };

    syncUserDetails();
    window.addEventListener("campusrecycleuser-updated", syncUserDetails);
    return () => window.removeEventListener("campusrecycleuser-updated", syncUserDetails);
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
    });
    localStorage.removeItem("campusrecycletoken");
    localStorage.removeItem("campusrecycleuser");
    setTimeout(() => navigate("/"), 3000);
  };

  return (
    <div className="seller-top-navbar">
      <div className="seller-top-navbar-brand">
        <img src="/logo.png" alt="Campus Recycle" onClick={() => navigate("/seller/seller-dashboard")} />
      </div>

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
