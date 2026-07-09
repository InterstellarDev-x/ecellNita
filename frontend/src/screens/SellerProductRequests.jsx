import React, { useEffect, useState } from 'react';
import SellerSidebar from '../components/SellerInterface/SellerDashboard/SellerSidebar';
import SellerTopNavbar from '../components/SellerInterface/SellerDashboard/SellerTopNavbar';
import AllRequests from '../components/SellerInterface/ProductRequests/AllRequests';
import { useNavigate } from 'react-router-dom';
import './SellerDashboard.css';

function SellerProductRequests() {
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
          <AllRequests />
        </div>
      </div>
    </div>
  );
}

export default SellerProductRequests;
