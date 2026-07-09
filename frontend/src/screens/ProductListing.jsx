import React, { useEffect, useState, useMemo } from "react";
import BuyerNavbar from "../components/BuyerInterface/BuyerNavbar/BuyerNavbar";
import ProductList from "../components/BuyerInterface/ProductListing/ProductList";
import { GetContext } from "../context/ProductsProvider";
import {
  ChevronDown,
  ListFilter,
  Calendar,
  ArrowDownAZ,
  ArrowUpAZ
} from "lucide-react";
import Fuse from "fuse.js";
import { useNavigate } from "react-router-dom";
import { apiConnector } from "../utils/Apiconnecter";
import { authroutes } from "../apis/apis";

function ProductListing() {
  const context = GetContext();
  const { allProducts, setAllProducts, getAllProducts, searchedProducts, setSearchedProducts } = context;

  const [AlphabeticalsortingOrder, setAlphabeticalSortingOrder] =
    useState("Alphabeticalasc");
  const [DatesortingOrder, setDateSortingOrder] = useState("Dateasc");
  const [activeDateSort, setDateSortActive] = useState(false);
  const [activeAplhabeticalSort, setAplhabeticalSortActive] = useState(false);
  const [priceFilterValue, setPriceFilterValue] = useState(0);
  const [isFilter, setIsFilter] = useState(false);
  const [productsLoading, setProductsLoading] = useState(true);

  const fuseOptions = { includeScore: true, keys: ["productname"] };

  const fuse = useMemo(
    () => new Fuse(allProducts, fuseOptions),
    [allProducts]
  );

  const handleSearchOnchangeItem = (e) => {
    if (e.target.value !== "") {
      const results = fuse.search(e.target.value);
      setSearchedProducts(results.map(r => r.item));
    } else {
      setSearchedProducts(allProducts);
    }
  };

  const [isCategoryDropdown, setIsCategoryDropdown] = useState(false);

  const toggleCategoryDropDown = () => {
    if (isCategoryDropdown) {
      setIsCategoryDropdown(false);
    } else {
      setIsCategoryDropdown(true);
    }
  };

  const [categoryFilterText, setCategoryFilterText] =
    useState("All Categories");
  const [categoryFilter, setCategoryFilter] = useState("");

  const handleApplyCategoryFilter = (category, categoryText) => {
    setCategoryFilterText(categoryText);
    setCategoryFilter(category);
    setIsCategoryDropdown(false);
  };

  const ToogleSortAlphabetically = () => {
    const sortedData = [...searchedProducts].sort((a, b) => {
      return AlphabeticalsortingOrder === "Alphabeticalasc"
        ? a.productname.localeCompare(b.productname)
        : b.productname.localeCompare(a.productname);
    });
    setAplhabeticalSortActive(true);
    setDateSortActive(false);
    setAlphabeticalSortingOrder(
      AlphabeticalsortingOrder === "Alphabeticalasc"
        ? "Alphabeticaldesc"
        : "Alphabeticalasc"
    );
    setSearchedProducts(sortedData);
  };

  const ToogleSortDatewise = () => {
    const sortedData = [...searchedProducts].sort((a, b) => {
      const dateA = new Date(a.createdat);
      const dateB = new Date(b.createdat);
      return DatesortingOrder === "Dateasc" ? dateA - dateB : dateB - dateA;
    });
    setDateSortActive(true);
    setAplhabeticalSortActive(false);
    setDateSortingOrder(
      DatesortingOrder === "Dateasc" ? "Datedesc" : "Dateasc"
    );
    setSearchedProducts(sortedData);
  };

  const [allCategories, setAllCategories] = useState([]);

  const fetchAllCategories = async() => {
    try {
        const api_header = { 
          Authorization: `Bearer ${localStorage.getItem('campusrecycletoken')}`,
          "Content-Type": "multipart/form-data"
        };
        const bodyData = {
            // Need to write something
        }
        const response = await apiConnector("POST", authroutes.GET_ALL_CATEGORIES, bodyData, api_header);
        console.log(response.data);
        if (response.data.success) {
            console.log("Categories fetched successfully");
            setAllCategories(response.data.data);
        }
    } catch (error) {
        console.log(error);
    }
  }

  const navigate = useNavigate();

  useEffect(() => {
    if(!localStorage.getItem('campusrecycletoken')){
      navigate('/');
      return;
    }

    const loadPageData = async () => {
      setProductsLoading(true);
      fetchAllCategories();
      console.log(allProducts);
      await getAllProducts();
      setProductsLoading(false);
    };

    loadPageData();
  }, []);

  return (
    <>
      <BuyerNavbar />
      <div className="product-search-filter">
        <div className="product-search-filter-container">
          <input
            className="product-search-filter-search-box"
            placeholder="Search product..."
            onChange={handleSearchOnchangeItem}
          />
          <div className="product-search-filter-category-filter">
            <div className="clickable" onClick={toggleCategoryDropDown}>
              <span>{categoryFilterText}</span>
              <ChevronDown
                color="gray"
                fontWeight={"20px"}
                style={{ rotate: isCategoryDropdown ? "180deg" : "0deg" }}
              />
            </div>
            {isCategoryDropdown && (
              <div className="categories">
                {
                  allCategories.map((category, i)=>{
                    return <li
                              onClick={() =>
                                handleApplyCategoryFilter(category.name, category.name)
                              }
                            >
                              {category.name}
                            </li>
                  })
                }
                <li
                  onClick={() =>
                    handleApplyCategoryFilter("", "All Categories")
                  }
                >
                  All Categories
                </li>
              </div>
            )}
          </div>
          <div className="product-search-filter-sortings">
            <span data-bs-toggle="modal" data-bs-target="#filter">
              Filter <ListFilter size={20} />
            </span>
            <span onClick={ToogleSortDatewise}>
              Date <Calendar size={20} />
            </span>
            <span onClick={ToogleSortAlphabetically}>
              Alphabetical{" "}
              {AlphabeticalsortingOrder === "Alphabeticalasc" ? (
                <ArrowDownAZ size={20} />
              ) : (
                <ArrowUpAZ size={20} />
              )}
            </span>
          </div>
        </div>
        <div
          className="modal fade"
          id="filter"
          tabIndex="-1"
          aria-labelledby="exampleModalLabel"
          aria-hidden="true"
        >
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title" id="exampleModalLabel">
                  Filter
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  data-bs-dismiss="modal"
                  aria-label="Close"
                ></button>
              </div>
              <div className="modal-body">
                <div className="filter-element">
                  <label htmlFor="priceRange">
                    Price range: 0 - {priceFilterValue}
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="5000"
                    value={priceFilterValue}
                    onChange={(e) => setPriceFilterValue(e.target.value)}
                    className="slider"
                    id="priceRange"
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  data-bs-dismiss="modal"
                  onClick={()=>{
                    setPriceFilterValue(0);
                  }}
                >
                  Close
                </button>
                {isFilter && <button onClick={()=>setIsFilter(false)}>Clear Filter</button>}
                <button onClick={()=>setIsFilter(true)}>
                  Apply Filter
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <ProductList
        products={searchedProducts}
        categoryFilter={categoryFilter}
        isFilter={isFilter}
        priceFilterValue={priceFilterValue}
        isLoading={productsLoading}
      />
    </>
  );
}

export default ProductListing;
