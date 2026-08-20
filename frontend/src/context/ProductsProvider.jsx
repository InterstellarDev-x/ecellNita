import React, { createContext, useContext, useState } from "react";
import { authroutes } from "../apis/apis";
import { apiConnector } from "../utils/Apiconnecter";

const ProductContext = createContext(null);

export const GetContext = () => {
  return useContext(ProductContext);
};

export const ProductProvider = (props) => {
  const [allProducts, setAllProducts] = useState([]);
  const [product, setProduct] = useState(null);
  const [searchedProducts, setSearchedProducts] = useState([]);
  const [wishlistProducts, setWishlistProducts] = useState([]);
  const [wishlistProductIds, setWishlistProductIds] = useState([]);
  const [wishlistLoaded, setWishlistLoaded] = useState(false);

  const getAuthHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem("campusrecycletoken")}`,
  });

  const getAllProducts = async(force = false) => {
    if (!force && allProducts.length > 0) return;
    try {
      const response = await apiConnector(
        "POST",
        authroutes.GET_ALL_PRODUCTS,
        {},
        { Authorization: `Bearer ${localStorage.getItem('campusrecycletoken')}` }
      );
      if(response.data.success){
        setAllProducts(response.data.data);
        setSearchedProducts(response.data.data);
      }else{
        console.error("Could not fetch products");
      }
    } catch (error) {
      console.error(error);
    }
  }

  const getWishlist = async (force = false) => {
    if (!force && wishlistLoaded) return wishlistProducts;

    try {
      const response = await apiConnector("GET", authroutes.GET_WISHLIST, null, getAuthHeaders());
      if (response.data.success) {
        const products = response.data.data || [];
        setWishlistProducts(products);
        setWishlistProductIds(products.map((product) => product._id));
        setWishlistLoaded(true);
        return products;
      }
    } catch (error) {
      console.error("Could not fetch wishlist", error);
    }
    return [];
  };

  const toggleWishlist = async (product) => {
    const productId = product?._id;
    const isSaved = wishlistProductIds.includes(productId);
    const response = await apiConnector(
      isSaved ? "DELETE" : "POST",
      isSaved ? authroutes.REMOVE_FROM_WISHLIST : authroutes.ADD_TO_WISHLIST,
      { productid: productId },
      getAuthHeaders()
    );

    if (!response.data.success) throw new Error(response.data.message || "Could not update wishlist");

    if (isSaved) {
      setWishlistProductIds((ids) => ids.filter((id) => id !== productId));
      setWishlistProducts((products) => products.filter((savedProduct) => savedProduct._id !== productId));
    } else {
      setWishlistProductIds((ids) => [...ids, productId]);
      setWishlistProducts((products) => [product, ...products]);
    }

    setWishlistLoaded(true);
    return !isSaved;
  };

  // useEffect(()=>{
  //   getAllProducts();
  // }, []);

  return (
    <ProductContext.Provider value={{allProducts, setAllProducts, getAllProducts, product, setProduct, searchedProducts, setSearchedProducts, wishlistProducts, wishlistProductIds, getWishlist, toggleWishlist}}>
      {props.children}
    </ProductContext.Provider>
  );
};
