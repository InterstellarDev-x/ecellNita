import React, { useEffect, useMemo, useState } from "react";
import BuyerNavbar from "../components/BuyerInterface/BuyerNavbar/BuyerNavbar";
import ProductList from "../components/BuyerInterface/ProductListing/ProductList";
import { GetContext } from "../context/ProductsProvider";
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
import Fuse from "fuse.js";
import { useNavigate } from "react-router-dom";
import { apiConnector } from "../utils/Apiconnecter";
import { authroutes } from "../apis/apis";

function ProductListing() {
  const { allProducts, getAllProducts } = GetContext();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState("");
  const [alphabeticalSortingOrder, setAlphabeticalSortingOrder] = useState("Alphabeticalasc");
  const [dateSortingOrder, setDateSortingOrder] = useState("Datedesc");
  const [activeDateSort, setDateSortActive] = useState(true);
  const [activeAlphabeticalSort, setAlphabeticalSortActive] = useState(false);
  const [priceFilterValue, setPriceFilterValue] = useState(5000);
  const [isFilter, setIsFilter] = useState(false);
  const [productsLoading, setProductsLoading] = useState(true);
  const [isCategoryDropdown, setIsCategoryDropdown] = useState(false);
  const [categoryFilterText, setCategoryFilterText] = useState("All Categories");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [allCategories, setAllCategories] = useState([]);

  const availableProducts = useMemo(
    () => (allProducts || []).filter((product) => product?.status !== "Sold"),
    [allProducts]
  );

  const maxProductPrice = useMemo(() => {
    const highestPrice = availableProducts.reduce(
      (max, product) => Math.max(max, Number(product?.price) || 0),
      0
    );
    return Math.max(highestPrice, 5000);
  }, [availableProducts]);

  const fuse = useMemo(
    () => new Fuse(availableProducts, {
      includeScore: true,
      threshold: 0.35,
      keys: ["productname", "productdescription", "category.name"]
    }),
    [availableProducts]
  );

  const visibleProducts = useMemo(() => {
    const searched = searchTerm.trim()
      ? fuse.search(searchTerm.trim()).map((result) => result.item)
      : [...availableProducts];

    const filtered = searched
      .filter((product) => !categoryFilter || product?.category?.name === categoryFilter)
      .filter((product) => !isFilter || Number(product?.price) <= Number(priceFilterValue));

    if (activeAlphabeticalSort) {
      return filtered.sort((a, b) => {
        const first = a?.productname || "";
        const second = b?.productname || "";
        return alphabeticalSortingOrder === "Alphabeticalasc"
          ? first.localeCompare(second)
          : second.localeCompare(first);
      });
    }

    if (activeDateSort) {
      return filtered.sort((a, b) => {
        const dateA = new Date(a?.createdat || a?.createdAt || 0);
        const dateB = new Date(b?.createdat || b?.createdAt || 0);
        return dateSortingOrder === "Dateasc" ? dateA - dateB : dateB - dateA;
      });
    }

    return filtered;
  }, [
    activeAlphabeticalSort,
    activeDateSort,
    alphabeticalSortingOrder,
    availableProducts,
    categoryFilter,
    dateSortingOrder,
    fuse,
    isFilter,
    priceFilterValue,
    searchTerm
  ]);

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

  const fetchAllCategories = async () => {
    try {
      const apiHeader = {
        Authorization: `Bearer ${localStorage.getItem("campusrecycletoken")}`,
        "Content-Type": "multipart/form-data"
      };
      const response = await apiConnector("POST", authroutes.GET_ALL_CATEGORIES, {}, apiHeader);
      if (response.data.success) {
        setAllCategories(response.data.data || []);
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (!localStorage.getItem("campusrecycletoken")) {
      navigate("/");
      return;
    }

    const loadPageData = async () => {
      setProductsLoading(true);
      await Promise.all([fetchAllCategories(), getAllProducts(true)]);
      setProductsLoading(false);
    };

    loadPageData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  useEffect(() => {
    setPriceFilterValue(maxProductPrice);
  }, [maxProductPrice]);

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
                      onClick={() => handleApplyCategoryFilter(category.name, category.name)}
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
              <span>{visibleProducts.length} result{visibleProducts.length === 1 ? "" : "s"} found</span>
              {categoryFilter && <span className="filter-pill">{categoryFilter}</span>}
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
          totalProducts={availableProducts.length}
          isLoading={productsLoading}
          hasActiveFilters={hasActiveFilters}
          onResetFilters={resetFilters}
        />
      </main>
    </>
  );
}

export default ProductListing;
