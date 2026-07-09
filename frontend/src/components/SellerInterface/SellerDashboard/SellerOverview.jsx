import React, { useMemo, useState, useEffect } from "react";
import "./SellerOverview.css";
import DasboardCardImg from '../../../images/dashboard-card-img.png';
import { ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { apiConnector } from "../../../utils/Apiconnecter";
import { authroutes } from "../../../apis/apis";

const modalContents = [
  {
    title: 'Add New Product',
    body: 'Use this action to add new items to your catalog. Provide all details such as images, description, and price to attract more buyers!',
  },
  {
    title: 'View My Products',
    body: 'Here you can review, edit, or delete your listed products. Maintaining up-to-date listings helps attract more customers.',
  },
  {
    title: 'Manage Profile',
    body: 'Update your profile and account details so buyers can easily reach you and trust your store.',
  }
];

function SellerOverview() {
  const navigate = useNavigate();
  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("campusrecycleuser"));
    } catch {
      return null;
    }
  }, []);
  const productCount = user?.products?.length || 0;
  const sellerName = user?.firstname || 'Seller';
  const profileInfo = user?.additionaldetails || {};

  const [modalIdx, setModalIdx] = useState(null);
  const [soldCount, setSoldCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const handleOpenModal = (idx) => setModalIdx(idx);
  const handleCloseModal = () => setModalIdx(null);

  useEffect(() => {
    const fetchSoldProducts = async () => {
      if (!user?.products || user.products.length === 0) {
        setLoading(false);
        return;
      }

      try {
        const api_header = {
          Authorization: `Bearer ${localStorage.getItem("campusrecycletoken")}`,
          "Content-Type": "multipart/form-data",
        };

        // Fetch all product details in parallel
        const productPromises = user.products.map(productId => 
          apiConnector(
            "POST",
            authroutes.GET_PRODUCT_DETAILS,
            { productid: productId },
            api_header
          )
        );

        const responses = await Promise.all(productPromises);
        const soldProducts = responses.filter(
          response => response.data.success && response.data.data.status === "Sold"
        );
        setSoldCount(soldProducts.length);
      } catch (error) {
        console.error("Error fetching product details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSoldProducts();
  }, [user?.products]);

  return (
    <div className="seller-dashboard-overview">
      <div className="top">
        <h2>Welcome, {sellerName}! 👋</h2>
        <p>You have <b>{productCount}</b> product{productCount === 1 ? '' : 's'} listed on Campus Recycle.</p>
        {!loading && <p>Products Sold: <b>{soldCount}</b></p>}
      </div>
      
      {/* Profile Information Section */}
      <div className="profile-info-section">
        <h5>Profile Information</h5>
        <div className="profile-info-grid">
          <div className="profile-info-item">
            <span className="profile-label">Name:</span>
            <span className="profile-value">{user?.firstname} {user?.lastname}</span>
          </div>
          <div className="profile-info-item">
            <span className="profile-label">Email:</span>
            <span className="profile-value">{user?.email}</span>
          </div>
          {profileInfo.gender && (
            <div className="profile-info-item">
              <span className="profile-label">Gender:</span>
              <span className="profile-value">{profileInfo.gender}</span>
            </div>
          )}
          {profileInfo.enrollmentno && (
            <div className="profile-info-item">
              <span className="profile-label">Enrollment No:</span>
              <span className="profile-value">{profileInfo.enrollmentno}</span>
            </div>
          )}
          {profileInfo.contactno && (
            <div className="profile-info-item">
              <span className="profile-label">Contact No:</span>
              <span className="profile-value">{profileInfo.contactno}</span>
            </div>
          )}
          {profileInfo.graduationyr && (
            <div className="profile-info-item">
              <span className="profile-label">Graduation Year:</span>
              <span className="profile-value">{profileInfo.graduationyr}</span>
            </div>
          )}
          {profileInfo.about && (
            <div className="profile-info-item full-width">
              <span className="profile-label">About:</span>
              <span className="profile-value">{profileInfo.about}</span>
            </div>
          )}
        </div>
      </div>

      <div className="overview-body">
        <h5>Quick Actions</h5>
        <div className="overview-body-cards">
          <div className="overview-body-card">
            <img src={DasboardCardImg} alt="Add Product" />
            <span className="overview-body-card-badge">
              &#9733; {productCount} Product{productCount === 1 ? '' : 's'}
            </span>
            <h4>Add New Product</h4>
            <p>Add new items for sale to your inventory easily.</p>
            <div className="card-footer">
              <span style={{cursor:'pointer'}} onClick={() => handleOpenModal(0)}>Learn more <ChevronDown size={15} style={{rotate: '-90deg'}}/></span>
              <button onClick={() => navigate('/seller/add-product')}>Add Product</button>
            </div>
          </div>
          <div className="overview-body-card">
            <img src={DasboardCardImg} alt="View Products" />
            <span className="overview-body-card-badge">
              &#9733; View
            </span>
            <h4>View My Products</h4>
            <p>See and manage all your listed products.</p>
            <div className="card-footer">
              <span style={{cursor:'pointer'}} onClick={() => handleOpenModal(1)}>Learn more <ChevronDown size={15} style={{rotate: '-90deg'}}/></span>
              <button onClick={() => navigate('/seller/view-product')}>View Products</button>
            </div>
          </div>
          <div className="overview-body-card">
            <img src={DasboardCardImg} alt="Go to Settings" />
            <span className="overview-body-card-badge">&#9881; Settings</span>
            <h4>Manage Profile</h4>
            <p>Update your seller profile and account preferences.</p>
            <div className="card-footer">
              <span style={{cursor:'pointer'}} onClick={() => handleOpenModal(2)}>Learn more <ChevronDown size={15} style={{rotate: '-90deg'}}/></span>
              <button onClick={() => navigate('/student-profile')}>Settings</button>
            </div>
          </div>
        </div>
        {/* Modal for Learn More */}
        {modalIdx !== null && (
          <div className="seller-dashboard-modal-overlay" onClick={handleCloseModal}>
            <div className="seller-dashboard-modal" onClick={(e) => e.stopPropagation()}>
              <h3>{modalContents[modalIdx].title}</h3>
              <p>{modalContents[modalIdx].body}</p>
              <button className="modal-close-btn" onClick={handleCloseModal}>Close</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default SellerOverview;

