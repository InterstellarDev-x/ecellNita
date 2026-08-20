import React from "react";
import "./ProductCard.css";
import { Heart, ImageOff, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useToggleWishlist, useWishlist } from "../../../hooks/useBuyerQueries";

function ProductCard({ product }) {
  const navigate = useNavigate();
  const { data: wishlistProducts = [] } = useWishlist();
  const toggleWishlist = useToggleWishlist();
  const image = product?.images?.find(Boolean);
  const description = product?.productdescription || "No description added yet.";
  const categoryName = product?.category?.name || "General";
  const price = Number(product?.price) || 0;
  const isSaved = wishlistProducts.some((savedProduct) => savedProduct._id === product?._id);

  const handleWishlistToggle = async (event) => {
    event.stopPropagation();
    if (toggleWishlist.isPending) return;

    try {
      await toggleWishlist.mutateAsync({ product, isSaved });
      const isNowSaved = !isSaved;
      toast.success(isNowSaved ? "Saved to wishlist" : "Removed from wishlist", { autoClose: 2500 });
    } catch (error) {
      toast.error(error?.response?.data?.message || "Could not update wishlist", { autoClose: 3000 });
    }
  };

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
          className={`product-save-btn${isSaved ? " product-save-btn--saved" : ""}`}
          aria-label={isSaved ? "Remove product from wishlist" : "Save product to wishlist"}
          aria-pressed={isSaved}
          disabled={toggleWishlist.isPending}
          onClick={handleWishlistToggle}
        >
          <Heart size={16} fill={isSaved ? "currentColor" : "none"} />
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
