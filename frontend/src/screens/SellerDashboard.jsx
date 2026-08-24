import React from 'react';
import SellerSidebar from '../components/SellerInterface/SellerDashboard/SellerSidebar';
import SellerTopNavbar from '../components/SellerInterface/SellerDashboard/SellerTopNavbar';
import SellerOverview from '../components/SellerInterface/SellerDashboard/SellerOverview';
import SellerMobileNav from '../components/SellerInterface/SellerDashboard/SellerMobileNav';
import './SellerDashboard.css';

function SellerDashboard() {
  return (
    <div className="seller-dashboard-container">
      <SellerSidebar />
      <div className="seller-dashboard-main">
        <SellerTopNavbar />
        <div className="seller-dashboard-content">
          <SellerOverview />
        </div>
      </div>
      <SellerMobileNav />
    </div>
  );
}

export default SellerDashboard;
