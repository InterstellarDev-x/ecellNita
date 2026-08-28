import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  Package,
  PackagePlus,
  ShoppingCart,
  UserRound,
} from "lucide-react";
import "./SellerOverview.css";
import { apiConnector } from "../../../utils/Apiconnecter";
import { authroutes } from "../../../apis/apis";
import { formatProductStatus } from "../../../utils/productStatus";
import { getOptimizedImageUrl, productThumbnailImageProps } from "../../../utils/cloudinaryImage";

const YEAR_LABELS = { "1": "1st Year", "2": "2nd Year", "3": "3rd Year", "4": "4th Year" };
const DEFAULT_PROFILE_IMAGE = "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png";

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem("campusrecycleuser"));
  } catch {
    return null;
  }
};

function SellerOverview() {
  const [user, setUser] = useState(getStoredUser);
  const [products, setProducts] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const sellerName = user?.firstname || "Seller";
  const profileInfo = user?.additionaldetails || {};

  useEffect(() => {
    const syncUser = () => setUser(getStoredUser());
    window.addEventListener("campusrecycleuser-updated", syncUser);
    return () => window.removeEventListener("campusrecycleuser-updated", syncUser);
  }, []);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setErrorMessage("");

      try {
        const apiHeader = {
          Authorization: `Bearer ${localStorage.getItem("campusrecycletoken")}`,
          "Content-Type": "multipart/form-data",
        };

        const [productResponse, requestResponse] = await Promise.all([
          apiConnector("GET", authroutes.GET_MY_PRODUCTS, null, apiHeader),
          apiConnector("POST", authroutes.GET_ALL_PRODUCT_REQUESTS, {}, apiHeader),
        ]);

        setProducts(productResponse.data.success ? productResponse.data.data?.products || [] : []);
        setRequests(requestResponse.data.success ? requestResponse.data.data || [] : []);
      } catch (error) {
        console.error("Error fetching seller dashboard:", error);
        setErrorMessage("Could not refresh dashboard data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const stats = useMemo(() => {
    const soldProducts = products.filter((product) => product.status === "Sold");
    const activeProducts = products.filter((product) => product.status !== "Sold");
    const totalInventory = products.reduce((sum, product) => sum + Number(product.quantity || 0), 0);
    const estimatedSoldValue = soldProducts.reduce(
      (sum, product) => sum + Number(product.price || 0) * Number(product.quantity || 1),
      0
    );

    return {
      totalProducts: products.length,
      activeProducts: activeProducts.length,
      soldProducts: soldProducts.length,
      totalInventory,
      estimatedSoldValue,
      activeRequests: requests.length,
    };
  }, [products, requests]);

  const recentProducts = useMemo(() => {
    return [...products]
      .sort((a, b) => new Date(b.createdat || 0) - new Date(a.createdat || 0))
      .slice(0, 4);
  }, [products]);

  const profileItems = [
    { label: "Name", value: `${user?.firstname || ""} ${user?.lastname || ""}`.trim() || "—" },
    { label: "Email", value: user?.email || "—" },
    { label: "Gender", value: profileInfo.gender || "—" },
    { label: "Enrollment No.", value: profileInfo.enrollmentno || "—" },
    { label: "Contact No.", value: profileInfo.contactno || "—" },
    { label: "Graduation Year", value: YEAR_LABELS[profileInfo.graduationyr] || profileInfo.graduationyr || "—" },
  ];

  const completedProfileFields = profileItems.filter((item) => item.value !== "—").length + (profileInfo.about ? 1 : 0);
  const profileCompletion = Math.round((completedProfileFields / 7) * 100);

  return (
    <div className="seller-overview">
      <section className="seller-hero-card">
        <div className="seller-hero-left">
          <div className="seller-avatar-wrap">
            <img src={getOptimizedImageUrl(user?.image || DEFAULT_PROFILE_IMAGE, { width: 128, height: 128 })} decoding="async" alt="Seller profile" />
          </div>
          <div>
           
            <h2>Welcome back, {sellerName}! 👋</h2>
            <p>Track your listings, requests, and profile readiness from one place.</p>
          </div>
        </div>
        <div className="seller-hero-actions">
          <Link to="/seller/add-product" className="seller-primary-action">
            <PackagePlus size={18} /> Add Product
          </Link>
          <Link to="/seller/view-product" className="seller-secondary-action">
            View Products <ArrowRight size={17} />
          </Link>
        </div>
      </section>

      {errorMessage && (
        <div className="seller-dashboard-alert">
          <AlertCircle size={18} />
          <span>{errorMessage}</span>
        </div>
      )}

      <section className="seller-stats-grid">
        <div className="seller-stat-card">
          <span className="seller-stat-icon green"><Package size={20} /></span>
          <p>Total Listings</p>
          <h3>{loading ? "—" : stats.totalProducts}</h3>
        </div>
        <div className="seller-stat-card">
          <span className="seller-stat-icon blue"><Clock3 size={20} /></span>
          <p>Active Listings</p>
          <h3>{loading ? "—" : stats.activeProducts}</h3>
        </div>
        <div className="seller-stat-card">
          <span className="seller-stat-icon amber"><ShoppingCart size={20} /></span>
          <p>Buyer Requests</p>
          <h3>{loading ? "—" : stats.activeRequests}</h3>
        </div>
        <div className="seller-stat-card">
          <span className="seller-stat-icon purple"><CheckCircle2 size={20} /></span>
          <p>Sold Products</p>
          <h3>{loading ? "—" : stats.soldProducts}</h3>
        </div>
      </section>

      <section className="seller-dashboard-grid">
        <div className="seller-panel seller-products-panel">
          <div className="seller-panel-header">
            <div>
              <h4>Recent Products</h4>
              <p>Your latest product listings</p>
            </div>
            <Link to="/seller/view-product">See all</Link>
          </div>

          {loading ? (
            <div className="seller-empty-state">Loading products...</div>
          ) : recentProducts.length ? (
            <div className="seller-product-list">
              {recentProducts.map((product) => (
                <div className="seller-product-row" key={product._id}>
                  <img {...productThumbnailImageProps(product.images?.[0] || DEFAULT_PROFILE_IMAGE)} alt={product.productname} />
                  <div>
                    <h5>{product.productname}</h5>
                    <p>{product.category?.name || "Uncategorized"} · Qty {product.quantity || 1}</p>
                  </div>
                  <div className="seller-product-meta">
                    <strong>{formatCurrency(product.price)}</strong>
                    <span className={product.status === "Sold" ? "sold" : "active"}>{formatProductStatus(product.status, "Active")}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="seller-empty-state">
              <PackagePlus size={28} />
              <p>No products yet.</p>
              <Link to="/seller/add-product">Create your first listing</Link>
            </div>
          )}
        </div>

        <div className="seller-panel seller-summary-panel">
          <div className="seller-panel-header">
            <div>
              <h4>Sales Snapshot</h4>
              <p>Quick overview of your inventory</p>
            </div>
          </div>

          <div className="seller-snapshot-list">
            <div>
              <span>Inventory units</span>
              <strong>{loading ? "—" : stats.totalInventory}</strong>
            </div>
            <div>
              <span>Estimated sold value</span>
              <strong>{loading ? "—" : formatCurrency(stats.estimatedSoldValue)}</strong>
            </div>
            <div>
              <span>Pending buyer requests</span>
              <strong>{loading ? "—" : stats.activeRequests}</strong>
            </div>
          </div>

          <Link to="/seller/product-requests" className="seller-request-link">
            Manage requests <ArrowRight size={17} />
          </Link>
        </div>
      </section>

      <section className="seller-dashboard-grid bottom-grid">
        {profileCompletion < 100 && (
          <div className="seller-panel seller-profile-panel">
            <div className="seller-panel-header">
              <div>
                <h4>Complete Your Profile</h4>
                <p>Add missing details so buyers can contact you easily</p>
              </div>
              <Link to="/student-profile">Edit</Link>
            </div>

            <div className="seller-profile-progress">
              <div>
                <span>Profile completion</span>
                <strong>{profileCompletion}%</strong>
              </div>
              <div className="seller-progress-track">
                <div style={{ width: `${profileCompletion}%` }} />
              </div>
            </div>

            <div className="seller-profile-grid">
              {profileItems.map((item) => (
                <div className="seller-profile-item" key={item.label}>
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </div>
              ))}
              {profileInfo.about && (
                <div className="seller-profile-item full-width">
                  <span>About</span>
                  <strong>{profileInfo.about}</strong>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="seller-panel seller-next-panel">
          <div className="seller-panel-header">
            <div>
              <h4>Next Best Actions</h4>
              <p>Improve your seller activity</p>
            </div>
          </div>

          <div className="seller-action-list">
            <Link to="/seller/add-product">
              <PackagePlus size={18} />
              <span>Add a new product listing</span>
              <ArrowRight size={16} />
            </Link>
            <Link to="/seller/product-requests">
              <ShoppingCart size={18} />
              <span>Respond to buyer requests</span>
              <ArrowRight size={16} />
            </Link>
            <Link to="/student-profile">
              <UserRound size={18} />
              <span>Complete your seller profile</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export default SellerOverview;
