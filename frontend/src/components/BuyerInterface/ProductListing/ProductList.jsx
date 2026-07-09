import React, { useMemo } from "react";
import "./ProductList.css";
import ProductCard from "./ProductCard";

function ProductList({ products, categoryFilter, isFilter, priceFilterValue, isLoading }) {
  const maxPrice = parseInt(priceFilterValue);

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    return products
      .filter(p => !categoryFilter || p.category?.name === categoryFilter)
      .filter(p => !isFilter || p.price <= maxPrice);
  }, [products, categoryFilter, isFilter, maxPrice]);

  return (
    <div className="product-list">
      {isLoading ? (
        <div className="empty-state">Loading products...</div>
      ) : filteredProducts.length === 0 ? (
        <div className="empty-state">
          <h5>{products?.length ? "No products match your filters" : "No products available yet"}</h5>
          <p>{products?.length ? "Try changing the search, category, or price filter." : "Products listed by sellers will appear here."}</p>
        </div>
      ) : (
        <div className="product-grid">
          {filteredProducts.map(product => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}

export default ProductList;
