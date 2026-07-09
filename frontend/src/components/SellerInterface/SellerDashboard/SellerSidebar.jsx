import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { LogOut, PackagePlus, CircleGauge, Package, PackageSearch, ChevronDown, Globe } from 'lucide-react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './SellerSidebar.css';

function SellerSidebar({ open, onClose }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    toast.info('🚀 You have successfully logged out. See you soon!', {
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
    <div className={`seller-sidebar-main${open ? ' open' : ''}`}>
      <ToastContainer />
      <div className="logo">
        <img src="../logo.png" alt="" />
      </div>
      <div className="seller-sidebar-navigation">
        <nav className="navigation">
          <span>
            <p>MAIN MENU</p>
            <ChevronDown size={15}/>
          </span>
          <div>
            <Link className="active-sidebar-link" to={'/seller/seller-dashboard'}>
              <CircleGauge size={20}/>
              <span>Dashboard</span>
            </Link>
            {/* <Link className="active-sidebar-link">
              <Globe size={20}/>
              <span>Explore</span>
            </Link> */}
          </div>
          <span>
            <p>ON BOARDING</p>
            <ChevronDown size={15}/>
          </span>
          <div>
            <Link to='/seller/view-product'>
              <PackageSearch size={20}/>
              <span>View Products</span>
            </Link>
            <Link to='/seller/add-product'>
              <PackagePlus size={20}/>
              <span>Add Product</span>
            </Link>
            <Link to='/seller/product-requests'>
              <Package size={20}/>
              <span>Active Requests</span>
            </Link>
            <Link className="logout-button" onClick={handleLogout}>
              <LogOut size={20}/>
              <span>Logout</span>
            </Link>
          </div>
        </nav>
      </div>
    </div>
  );
}

export default SellerSidebar;
