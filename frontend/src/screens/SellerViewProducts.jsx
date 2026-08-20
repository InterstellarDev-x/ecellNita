import React, { useEffect } from 'react';
import SellerSidebar from '../components/SellerInterface/SellerDashboard/SellerSidebar';
import SellerTopNavbar from '../components/SellerInterface/SellerDashboard/SellerTopNavbar';
import SellerProductList from '../components/SellerInterface/SellerViewProducts/SellerProductList';
import SellerMobileNav from '../components/SellerInterface/SellerDashboard/SellerMobileNav';
import { useNavigate } from 'react-router-dom';
import './SellerDashboard.css';

function SellerViewProducts() {
  const navigate = useNavigate();

  useEffect(() => {
    if (!localStorage.getItem('campusrecycletoken')) navigate('/');
  }, []);

  return (
    <div className="seller-dashboard-container">
      <SellerSidebar />
      <div className="seller-dashboard-main">
        <SellerTopNavbar />
        <div className="seller-dashboard-content">
          <SellerProductList />
        </div>
      </div>
      <SellerMobileNav />
    </div>
  );
}

export default SellerViewProducts;
