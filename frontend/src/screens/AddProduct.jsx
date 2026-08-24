import React from 'react';
import AddProductForm from '../components/SellerInterface/SellerAddProduct/AddProductForm';
import SellerSidebar from '../components/SellerInterface/SellerDashboard/SellerSidebar';
import SellerTopNavbar from '../components/SellerInterface/SellerDashboard/SellerTopNavbar';
import SellerMobileNav from '../components/SellerInterface/SellerDashboard/SellerMobileNav';
import './SellerDashboard.css';

function AddProduct() {
  return (
    <div className="seller-dashboard-container">
      <SellerSidebar />
      <div className="seller-dashboard-main">
        <SellerTopNavbar />
        <div className="seller-dashboard-content">
          <AddProductForm />
        </div>
      </div>
      <SellerMobileNav />
    </div>
  );
}

export default AddProduct;
