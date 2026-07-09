import React, { useEffect, useState } from "react";
import "./SellerProductList.css";
import { useNavigate } from "react-router-dom";
import SellerProductCard from "./SellerProductCard";
import { apiConnector } from "../../../utils/Apiconnecter";
import { authroutes } from "../../../apis/apis";

function SellerProductList() {
  const navigate = useNavigate();
  const [productIds, setProductIds] = useState([]);

  const handleDeleteProduct = async (idToDelete) => {
    console.log("id to delete: ", idToDelete);
    try {
      const api_header = {
        Authorization: `Bearer ${localStorage.getItem("campusrecycletoken")}`,
        "Content-Type": "multipart/form-data",
      };
      const bodyData = {
        productid: idToDelete,
      };
      const response = await apiConnector(
        "POST",
        authroutes.DELETE_PRODUCT,
        bodyData,
        api_header
      );
      console.log(response.data);
      if (response.data.success) {
        const user = localStorage.getItem("campusrecycleuser");
        const userObj = JSON.parse(user);
        const allProductIds = userObj.products;
        const newProductIds = allProductIds.filter(
          (productId) => productId !== idToDelete
        );
        userObj.products = newProductIds;
        console.log("new products: ", newProductIds);
        localStorage.setItem("campusrecycleuser", JSON.stringify(userObj));
        setProductIds(newProductIds);
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    const user = localStorage.getItem("campusrecycleuser");
    if (!user) navigate("/");

    const userObj = JSON.parse(user);
    const allProductIds = userObj.products;
    console.log(allProductIds);
    setProductIds(allProductIds);
  }, []);
  return (
    <div className="seller-product-list">
      <div className="list">
        {productIds.map((productId, i) => {
          return (
            <SellerProductCard
              key={i}
              id={productId}
              handleDeleteProduct={handleDeleteProduct}
            />
          );
        })}
      </div>
    </div>
  );
}

export default SellerProductList;
