import React, { createContext, useContext, useState } from "react";
import axios from "axios";

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
      const response = await axios.post(
        'https://api.recycool.ecellnita.in/api/v1/product/getallproduct',
        {},
        { headers: { Authorization: `Bearer ${localStorage.getItem('campusrecycletoken')}` } }
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
