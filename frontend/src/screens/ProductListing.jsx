import React, { useMemo, useState, useEffect } from "react";
import BuyerNavbar from "../components/BuyerInterface/BuyerNavbar/BuyerNavbar";
import ProductList from "../components/BuyerInterface/ProductListing/ProductList";
import {
  ArrowDownAZ,
  ArrowUpAZ,
  Calendar,
  ChevronDown,
  IndianRupee,
  Search,
  SlidersHorizontal,
  X
} from "lucide-react";
import { useMarketplaceCategories, useMarketplaceProducts } from "../hooks/useBuyerQueries";

const EMPTY_PRODUCT_PAGES = [];

function ProductListing() {
  const categoriesQuery = useMarketplaceCategories();
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [alphabeticalSortingOrder, setAlphabeticalSortingOrder] = useState("Alphabeticalasc");
  const [dateSortingOrder, setDateSortingOrder] = useState("Datedesc");
  const [activeDateSort, setDateSortActive] = useState(true);
  const [activeAlphabeticalSort, setAlphabeticalSortActive] = useState(false);
  const [priceFilterValue, setPriceFilterValue] = useState(5000);
  const [isFilter, setIsFilter] = useState(false);
  const [isCategoryDropdown, setIsCategoryDropdown] = useState(false);
  const [categoryFilterText, setCategoryFilterText] = useState("All Categories");
  const [categoryFilter, setCategoryFilter] = useState("");
  const sort = activeAlphabeticalSort
    ? alphabeticalSortingOrder === "Alphabeticalasc" ? "name_asc" : "name_desc"
    : dateSortingOrder === "Dateasc" ? "oldest" : "newest";
  const productFilters = useMemo(() => ({
    ...(debouncedSearchTerm ? { search: debouncedSearchTerm } : {}),
    ...(categoryFilter ? { categoryid: categoryFilter } : {}),
    ...(isFilter ? { maxPrice: Number(priceFilterValue) } : {}),
    sort,
  }), [categoryFilter, debouncedSearchTerm, isFilter, priceFilterValue, sort]);
  const productsQuery = useMarketplaceProducts(productFilters);
  const allCategories = categoriesQuery.data || [];
  const productsLoading = productsQuery.isLoading || categoriesQuery.isLoading;
  const productPages = productsQuery.data?.pages || EMPTY_PRODUCT_PAGES;
  const visibleProducts = useMemo(() => productPages.flatMap((page) => page.products || []), [productPages]);
  const firstPage = productPages[0];
  const totalProducts = Number(firstPage?.totalProducts || 0);
  const maxProductPrice = Math.max(Number(firstPage?.marketplaceMaxPrice || 0), 5000);

  const hasActiveFilters = Boolean(searchTerm.trim() || categoryFilter || isFilter);

  const handleApplyCategoryFilter = (category, categoryText) => {
    setCategoryFilterText(categoryText);
    setCategoryFilter(category);
    setIsCategoryDropdown(false);
  };

  const toggleSortAlphabetically = () => {
    setAlphabeticalSortActive(true);
    setDateSortActive(false);
    setAlphabeticalSortingOrder((current) =>
      current === "Alphabeticalasc" ? "Alphabeticaldesc" : "Alphabeticalasc"
    );
  };

  const toggleSortDatewise = () => {
    setDateSortActive(true);
    setAlphabeticalSortActive(false);
    setDateSortingOrder((current) => (current === "Dateasc" ? "Datedesc" : "Dateasc"));
  };

  const resetFilters = () => {
    setSearchTerm("");
    setCategoryFilter("");
    setCategoryFilterText("All Categories");
    setIsFilter(false);
    setPriceFilterValue(maxProductPrice);
  };

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setDebouncedSearchTerm(searchTerm.trim()), 300);
    return () => window.clearTimeout(timeoutId);
  }, [searchTerm]);

  useEffect(() => {
    if (!isFilter) setPriceFilterValue(maxProductPrice);
  }, [isFilter, maxProductPrice]);

  return (
    <>
      <BuyerNavbar />
      <main className="buyer-product-page">


        <section className="product-search-filter">
          <div className="product-search-filter-container">
            <div className="product-search-input-wrap">
              <Search size={18} />
              <input
                className="product-search-filter-search-box"
                placeholder="Search by product, description, or category..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
              {searchTerm && (
                <button type="button" className="product-clear-search" onClick={() => setSearchTerm("")}>
                  <X size={16} />
                </button>
              )}
            </div>

            <div className="product-search-filter-category-filter">
              <button
                type="button"
                className="clickable"
                onClick={() => setIsCategoryDropdown((current) => !current)}
              >
                <span>{categoryFilterText}</span>
                <ChevronDown
                  color="gray"
                  size={18}
                  style={{ rotate: isCategoryDropdown ? "180deg" : "0deg" }}
                />
              </button>
              {isCategoryDropdown && (
                <ul className="categories">
                  <li onClick={() => handleApplyCategoryFilter("", "All Categories")}>All Categories</li>
                  {allCategories.map((category) => (
                    <li
                      key={category._id || category.name}
                      onClick={() => handleApplyCategoryFilter(category._id, category.name)}
                    >
                      {category.name}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="product-search-filter-sortings">
              <button type="button" data-bs-toggle="modal" data-bs-target="#filter">
                <SlidersHorizontal size={18} /> Filter
              </button>
              <button type="button" className={activeDateSort ? "active" : ""} onClick={toggleSortDatewise}>
                <Calendar size={18} /> Date
              </button>
              <button
                type="button"
                className={activeAlphabeticalSort ? "active" : ""}
                onClick={toggleSortAlphabetically}
              >
                {alphabeticalSortingOrder === "Alphabeticalasc" ? <ArrowDownAZ size={18} /> : <ArrowUpAZ size={18} />}
                A-Z
              </button>
            </div>
          </div>

          {hasActiveFilters && (
            <div className="active-filter-row">
              <span>{totalProducts} result{totalProducts === 1 ? "" : "s"} found</span>
              {categoryFilter && <span className="filter-pill">{categoryFilterText}</span>}
              {isFilter && <span className="filter-pill">Under ₹{priceFilterValue}</span>}
              {searchTerm && <span className="filter-pill">“{searchTerm}”</span>}
              <button type="button" onClick={resetFilters}>Clear all</button>
            </div>
          )}

          <div className="modal fade" id="filter" tabIndex="-1" aria-labelledby="filterModalLabel" aria-hidden="true">
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content buyer-filter-modal">
                <div className="modal-header">
                  <h5 className="modal-title" id="filterModalLabel">
                    Refine products
                  </h5>
                  <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div className="modal-body">
                  <div className="filter-element">
                    <div className="filter-label-row">
                      <label htmlFor="priceRange">Maximum price</label>
                      <span><IndianRupee size={14} /> {priceFilterValue}</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max={maxProductPrice}
                      value={priceFilterValue}
                      onChange={(event) => setPriceFilterValue(event.target.value)}
                      className="slider"
                      id="priceRange"
                    />
                    <div className="price-range-values">
                      <span>₹1</span>
                      <span>₹{maxProductPrice}</span>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="secondary" onClick={() => setIsFilter(false)}>
                    Clear price
                  </button>
                  <button type="button" data-bs-dismiss="modal" onClick={() => setIsFilter(true)}>
                    Apply filter
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <ProductList
          products={visibleProducts}
          totalProducts={totalProducts}
          isLoading={productsLoading}
          isLoadingMore={productsQuery.isFetchingNextPage}
          hasMore={Boolean(productsQuery.hasNextPage)}
          onLoadMore={() => productsQuery.fetchNextPage()}
          hasActiveFilters={hasActiveFilters}
          onResetFilters={resetFilters}
        />
      </main>
    </>
  );
}

export default ProductListing;
