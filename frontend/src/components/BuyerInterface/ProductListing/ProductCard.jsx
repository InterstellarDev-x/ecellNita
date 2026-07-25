import React from "react";
import "./ProductCard.css";
import { Heart, ImageOff, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";

function ProductCard({ product }) {
  const navigate = useNavigate();
  const image = product?.images?.find(Boolean);
  const description = product?.productdescription || "No description added yet.";
  const categoryName = product?.category?.name || "General";
  const price = Number(product?.price) || 0;

  return (
    <article
      className="product-card"
      onClick={() => navigate(`/buyer/products/${product?._id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "Enter") navigate(`/buyer/products/${product?._id}`);
      }}
    >
      <div className="product-card-image">
        {image ? <img src={image} alt={product?.productname || "Product"} /> : <div className="product-image-fallback"><ImageOff size={34} /></div>}
        <span className="product-category-badge">{categoryName}</span>
        <button
          type="button"
          className="product-save-btn"
          aria-label="Save product"
          onClick={(event) => event.stopPropagation()}
        >
          <Heart size={16} />
        </button>
      </div>
      <div className="product-card-details">
        <div className="product-card-title-row">
          <h4>{product?.productname || "Untitled product"}</h4>
          <p className="product-card-details-price">₹{price.toLocaleString("en-IN")}</p>
        </div>
        <p className="product-card-description">
          {description.length > 78 ? `${description.slice(0, 75)}...` : description}
        </p>
        <div className="product-card-footer">
          <span><MapPin size={14} /> Campus pickup</span>
          <strong>{product?.status || "Forsale"}</strong>
        </div>
      </div>
    </article>
  );
}

export default ProductCard;
