import React, { useMemo } from "react";
import "./ProductList.css";
import ProductCard from "./ProductCard";

function ProductList({ products, categoryFilter, isFilter, priceFilterValue }) {
  const maxPrice = parseInt(priceFilterValue);

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    return products
      .filter(p => !categoryFilter || p.category?.name === categoryFilter)
      .filter(p => !isFilter || p.price <= maxPrice);
  }, [products, categoryFilter, isFilter, maxPrice]);

  return (
    <div className="product-list">
      <div className="product-grid">
        {filteredProducts.map(product => (
          <ProductCard key={product._id} product={product} />
        ))}
      </div>
    </div>
  );
}

export default ProductList;
