import React from 'react';
import SellerSidebar from '../components/SellerInterface/SellerDashboard/SellerSidebar';
import SellerTopNavbar from '../components/SellerInterface/SellerDashboard/SellerTopNavbar';
import AllRequests from '../components/SellerInterface/ProductRequests/AllRequests';
import SellerMobileNav from '../components/SellerInterface/SellerDashboard/SellerMobileNav';
import './SellerDashboard.css';

function SellerProductRequests() {
  return (
    <div className="seller-dashboard-container">
      <SellerSidebar />
      <div className="seller-dashboard-main">
        <SellerTopNavbar />
        <div className="seller-dashboard-content">
          <AllRequests />
        </div>
      </div>
      <SellerMobileNav />
    </div>
  );
}

export default SellerProductRequests;
