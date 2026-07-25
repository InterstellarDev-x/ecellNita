import React from "react";
import "./ProductList.css";
import ProductCard from "./ProductCard";
import { PackageSearch, RotateCcw } from "lucide-react";

function ProductList({ products, totalProducts, isLoading, hasActiveFilters, onResetFilters }) {
  return (
    <section className="product-list">
      <div className="product-list-header">
        <div>
          <span className="product-list-kicker">Browse listings</span>
          <h2>{products.length} product{products.length === 1 ? "" : "s"}</h2>
        </div>
        <span>{totalProducts} available in marketplace</span>
      </div>

      {isLoading ? (
        <div className="product-grid product-grid-loading">
          {Array.from({ length: 8 }).map((_, index) => (
            <div className="product-card-skeleton" key={index}>
              <div></div>
              <span></span>
              <span></span>
              <strong></strong>
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="empty-state">
          <PackageSearch size={44} />
          <h5>{hasActiveFilters ? "No products match your filters" : "No products available yet"}</h5>
          <p>
            {hasActiveFilters
              ? "Try changing the search, category, or price filter to discover more listings."
              : "Products listed by sellers will appear here once they are available."}
          </p>
          {hasActiveFilters && (
            <button type="button" onClick={onResetFilters}>
              <RotateCcw size={16} /> Reset filters
            </button>
          )}
        </div>
      ) : (
        <div className="product-grid">
          {products.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      )}
    </section>
  );
}

export default ProductList;
