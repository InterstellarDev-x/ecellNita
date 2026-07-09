import React, { useEffect, useState } from 'react';
import SellerSidebar from '../components/SellerInterface/SellerDashboard/SellerSidebar';
import SellerTopNavbar from '../components/SellerInterface/SellerDashboard/SellerTopNavbar';
import SellerOverview from '../components/SellerInterface/SellerDashboard/SellerOverview';
import { useNavigate } from 'react-router-dom';
import './SellerDashboard.css';

function SellerDashboard() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem('campusrecycletoken')) navigate('/');
  }, []);

  return (
    <div className="seller-dashboard-container">
      {sidebarOpen && <div className="seller-sidebar-backdrop" onClick={() => setSidebarOpen(false)} />}
      <SellerSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="seller-dashboard-main">
        <SellerTopNavbar onMenuClick={() => setSidebarOpen(o => !o)} />
        <div className="seller-dashboard-content">
          <SellerOverview />
        </div>
      </div>
    </div>
  );
}

export default SellerDashboard;
