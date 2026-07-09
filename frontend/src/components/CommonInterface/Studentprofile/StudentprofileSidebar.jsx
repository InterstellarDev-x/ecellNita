import React, { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import "./StudentprofileSidebar.css";
import { LogOut, Heart, UserRound, ShoppingCart, Package, Star } from 'lucide-react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function BuyerSidebar({ open }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [userDetails, setUserDetails] = useState(null);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('campusrecycleuser'));
    setUserDetails(user);
  }, []);

  const handleLogout = () => {
    toast.success('🚀 You have successfully logged out. See you soon!', {
      position: "top-right",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: "colored",
    });
    localStorage.removeItem('campusrecycletoken');
    localStorage.removeItem('campusrecycleuser');
    setTimeout(() => {
      navigate('/');
    }, 3000); // Delay to allow the toast message to be visible
  };

  return (
    <div className={`buyer-sidebar-main${open ? ' open' : ''}`}>
      <ToastContainer />
      <div className="logo">
        <span className="sidebar-brand">Campus Recycle</span>
      </div>
      <div className="profile-info">
        <img src={userDetails && userDetails.image} alt="" />
        <p>{userDetails && `${userDetails.firstname} ${userDetails.lastname}`}</p>
      </div>
      <div className="buyer-sidebar-navigation">
        <nav className="navigation">
          <Link to="/student-profile" className={location.pathname === '/student-profile' ? 'active' : ''}>
            <UserRound size={20} />
            <span>My Profile</span>
          </Link>
          {/* <Link to="/reviews" className={location.pathname === '/reviews' ? 'active' : ''}>
            <Star size={20} />
            <span>Your Reviews</span>
          </Link> */}
          <Link to="/buyer/product-requests" className={location.pathname === '/buyer/product-requests' ? 'active' : ''}>
            <ShoppingCart size={20} />
            <span>Your Product Request</span>
          </Link>
          {/* <Link to="/wishlists" className={location.pathname === '/wishlists' ? 'active' : ''}>
            <Heart size={20} />
            <span>Wishlists</span>
          </Link> */}
          <Link to="/buyer/productlist" className={location.pathname === '/buyer/productlist' ? 'active' : ''}>
            <Package size={20} />
            <span>Explore</span>
          </Link>
          <Link to="#" onClick={handleLogout}>
            <LogOut size={20} />
            <span>Logout</span>
          </Link>
        </nav>
      </div>
    </div>
  );
}

export default BuyerSidebar;
