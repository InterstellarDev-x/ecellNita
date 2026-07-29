import React, { useCallback, useEffect, useMemo, useState } from "react";
import "./SellerProductList.css";
import { Link, useNavigate } from "react-router-dom";
import SellerProductCard from "./SellerProductCard";
import { apiConnector } from "../../../utils/Apiconnecter";
import { authroutes } from "../../../apis/apis";
import { AlertCircle, PackagePlus, Search, SlidersHorizontal } from "lucide-react";

function SellerProductList() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [statusFilter, setStatusFilter] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const apiHeader = useMemo(() => ({
    Authorization: `Bearer ${localStorage.getItem("campusrecycletoken")}`,
    "Content-Type": "multipart/form-data",
  }), []);

  const getStoredProductIds = () => {
    const user = localStorage.getItem("campusrecycleuser");
    if (!user) return null;
    const userObj = JSON.parse(user);
    return userObj.products || [];
  };

  const fetchProducts = useCallback(async () => {
    const productIds = getStoredProductIds();
    if (!productIds) {
      navigate("/");
      return;
    }

    setLoaded(false);
    setErrorMessage("");

    try {
      const responses = await Promise.allSettled(
        productIds.map((productId) =>
          apiConnector("POST", authroutes.GET_PRODUCT_DETAILS, { productid: productId }, apiHeader)
        )
      );

      const fetchedProducts = responses
        .filter((result) => result.status === "fulfilled" && result.value.data.success && result.value.data.data)
        .map((result) => result.value.data.data);

      setProducts(fetchedProducts);
    } catch (error) {
      console.error(error);
      setErrorMessage("Could not load your products. Please refresh the page.");
    } finally {
      setLoaded(true);
    }
  }, [apiHeader, navigate]);

  const handleDeleteProduct = async (idToDelete) => {
    try {
      const response = await apiConnector(
        "POST",
        authroutes.DELETE_PRODUCT,
        { productid: idToDelete },
        apiHeader
      );

      if (response.data.success) {
        const user = localStorage.getItem("campusrecycleuser");
        if (user) {
          const userObj = JSON.parse(user);
          userObj.products = (userObj.products || []).filter((productId) => productId !== idToDelete);
          localStorage.setItem("campusrecycleuser", JSON.stringify(userObj));
          window.dispatchEvent(new Event("campusrecycleuser-updated"));
        }
        setProducts((prev) => prev.filter((product) => product._id !== idToDelete));
      } else {
        setErrorMessage(response.data.message || "Could not delete product.");
      }
    } catch (error) {
      console.error(error);
      setErrorMessage("Something went wrong while deleting the product.");
    }
  };

  const handleProductUpdated = (updatedProduct) => {
    setProducts((prev) => prev.map((product) => product._id === updatedProduct._id ? updatedProduct : product));
  };

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const stats = useMemo(() => ({
    total: products.length,
    forSale: products.filter((product) => product.status === "Forsale").length,
    sold: products.filter((product) => product.status === "Sold").length,
    purchased: products.filter((product) => product.status === "Purchased").length,
  }), [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesStatus = statusFilter === "All" || product.status === statusFilter;
      const searchableText = `${product.productname || ""} ${product.productdescription || ""} ${product.category?.name || ""}`.toLowerCase();
      const matchesSearch = searchableText.includes(searchTerm.toLowerCase().trim());
      return matchesStatus && matchesSearch;
    });
  }, [products, searchTerm, statusFilter]);

  return (
    <div className="seller-product-list-page">
      <div className="seller-products-header">
        <div>
          <span className="seller-products-eyebrow">Inventory</span>
          <h2>Your Products</h2>
          <p>Manage product details, availability, pricing, and images from one place.</p>
        </div>
        <Link to="/seller/add-product" className="add-product-shortcut">
          <PackagePlus size={18} /> Add Product
        </Link>
      </div>

      {errorMessage && (
        <div className="seller-products-alert">
          <AlertCircle size={18} />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="seller-products-stats">
        <button className={statusFilter === "All" ? "active" : ""} onClick={() => setStatusFilter("All")}>All <b>{stats.total}</b></button>
        <button className={statusFilter === "Forsale" ? "active" : ""} onClick={() => setStatusFilter("Forsale")}>For sale <b>{stats.forSale}</b></button>
        <button className={statusFilter === "Sold" ? "active" : ""} onClick={() => setStatusFilter("Sold")}>Sold <b>{stats.sold}</b></button>
        <button className={statusFilter === "Purchased" ? "active" : ""} onClick={() => setStatusFilter("Purchased")}>Purchased <b>{stats.purchased}</b></button>
      </div>

      <div className="seller-products-toolbar">
        <div className="seller-products-search">
          <Search size={18} />
          <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search by name, description, or category" />
        </div>
        <div className="seller-products-filter-label">
          <SlidersHorizontal size={17} /> Showing {filteredProducts.length} product{filteredProducts.length === 1 ? "" : "s"}
        </div>
      </div>

      <div className="seller-products-grid">
        {!loaded ? (
          <div className="seller-products-empty">Loading products...</div>
        ) : products.length === 0 ? (
          <div className="seller-products-empty">
            <PackagePlus size={34} />
            <h5>No products listed yet</h5>
            <p>Add your first product to start receiving buyer requests.</p>
            <Link to="/seller/add-product">Create listing</Link>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="seller-products-empty">
            <Search size={34} />
            <h5>No matching products</h5>
            <p>Try changing your search or status filter.</p>
          </div>
        ) : filteredProducts.map((product) => (
          <SellerProductCard
            key={product._id}
            product={product}
            onProductUpdated={handleProductUpdated}
            handleDeleteProduct={handleDeleteProduct}
          />
        ))}
      </div>
    </div>
  );
}

export default SellerProductList;
