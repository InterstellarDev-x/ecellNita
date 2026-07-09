import React, { useMemo, useState, useEffect } from "react";
import "./SellerOverview.css";
import { apiConnector } from "../../../utils/Apiconnecter";
import { authroutes } from "../../../apis/apis";

function SellerOverview() {
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

  const [soldCount, setSoldCount] = useState(0);
  const [loading, setLoading] = useState(true);

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
    </div>
  );
}

export default SellerOverview;
