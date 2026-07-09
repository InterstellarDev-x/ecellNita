import React, { useEffect, useState } from 'react';
import AddProductForm from '../components/SellerInterface/SellerAddProduct/AddProductForm';
import SellerSidebar from '../components/SellerInterface/SellerDashboard/SellerSidebar';
import SellerTopNavbar from '../components/SellerInterface/SellerDashboard/SellerTopNavbar';
import { useNavigate } from 'react-router-dom';
import './SellerDashboard.css';

function AddProduct() {
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
          <AddProductForm />
        </div>
      </div>
    </div>
  );
}

export default AddProduct;
