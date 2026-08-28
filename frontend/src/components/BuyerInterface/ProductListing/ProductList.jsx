import React from "react";
import "./ProductList.css";
import ProductCard from "./ProductCard";
import { PackageSearch, RotateCcw } from "lucide-react";
import PageLoader from "../../CommonInterface/PageLoader/PageLoader";

function ProductList({ products, totalProducts, isLoading, isLoadingMore = false, hasMore = false, onLoadMore, hasActiveFilters, onResetFilters, kicker = "Browse listings", title, totalLabel, emptyTitle, emptyDescription, hideHeader = false }) {
  return (
    <section className={`product-list${hideHeader ? " product-list--headerless" : ""}`}>
      {!hideHeader && (
        <div className="product-list-header">
          <div>
            <span className="product-list-kicker">{kicker}</span>
            <h2>{title || `${products.length} product${products.length === 1 ? "" : "s"}`}</h2>
          </div>
          <span>{totalLabel || `${totalProducts} available in marketplace`}</span>
        </div>
      )}

      {isLoading ? (
        <PageLoader className="buyer-product-list-loader" />
      ) : products.length === 0 ? (
        <div className="empty-state">
          <PackageSearch size={44} />
          <h5>{hasActiveFilters ? "No products match your filters" : emptyTitle || "No products available yet"}</h5>
          <p>
            {hasActiveFilters
              ? "Try changing the search, category, or price filter to discover more listings."
              : emptyDescription || "Products listed by sellers will appear here once they are available."}
          </p>
          {hasActiveFilters && (
            <button type="button" onClick={onResetFilters}>
              <RotateCcw size={16} /> Reset filters
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="product-grid">
            {products.map((product, index) => (
              <ProductCard key={product._id} product={product} priority={index === 0} />
            ))}
          </div>
          {hasMore && <div className="product-load-more"><button type="button" onClick={onLoadMore} disabled={isLoadingMore}>{isLoadingMore ? "Loading more…" : `Load more products (${products.length} of ${totalProducts})`}</button></div>}
        </>
      )}
    </section>
  );
}

export default ProductList;
