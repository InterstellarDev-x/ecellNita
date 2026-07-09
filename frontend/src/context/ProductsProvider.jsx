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
        console.log("Invalid Credentials");
      }
    } catch (error) {
      console.log(error);
    }
  }

  // useEffect(()=>{
  //   getAllProducts();
  // }, []);

  return (
    <ProductContext.Provider value={{allProducts, setAllProducts, getAllProducts, product, setProduct, searchedProducts, setSearchedProducts}}>
      {props.children}
    </ProductContext.Provider>
  );
};
