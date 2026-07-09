import React, { useEffect, useRef, useState } from "react";
import "./AddProductFrom.css";
import Spinner from "react-bootstrap/Spinner";
import { apiConnector } from "../../../utils/Apiconnecter";
import { authroutes } from "../../../apis/apis";
import { Tags, X } from "lucide-react";
import { ToastContainer, toast } from 'react-toastify';


function AddProductForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [isImageAddErr, setIsImageAddErr] = useState(false);
  const [productImageFiles, setProductImageFiles] = useState([]);
  const [allCategories, setAllCategories] = useState([]);

  const [addProductData, setAddProductData] = useState({
    productname: "",
    productdescription: "",
    price: "",
    status: "Forsale",
    quantity: "",
    categoryid: "",
  });

  const imagesInputRef = useRef();
  const addProductFormRef = useRef();

  const fetchAllCategories = async () => {
    try {
      const api_header = { 
        Authorization: `Bearer ${localStorage.getItem("campusrecycletoken")}`,
      }
      const response = await apiConnector(
        "POST",
        authroutes.GET_ALL_CATEGORIES,
        {},
        api_header
      );

      if (response.data.success) {
        console.log("Categories fetched successfully");
        setAllCategories(response.data.data);
      } else {
        console.log("Failed to fetch categories:", response.data.message);
      }
    } catch (error) {
      console.log("Error fetching categories:", error);
    }
  };

  const handleOnChange = (e) => {
    setAddProductData({ ...addProductData, [e.target.name]: e.target.value });
  };

  const productImagefilesOnchange = (e) => {
    const newFiles = [...productImageFiles];
    console.log(e.target.files)
    for (let file of e.target.files) {
      if (!newFiles.find((f) => f.name === file.name && f.size === file.size)) {
        newFiles.push(file);
      }
    }
    setProductImageFiles(newFiles);
    setIsImageAddErr(false);
  };

  const removeProductImageFile = (fileToDelete) => {
    const newFiles = productImageFiles.filter((file) => file !== fileToDelete);
    setProductImageFiles(newFiles);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (productImageFiles.length < 3) {
      setIsImageAddErr(true);
      return;
    }

    setIsLoading(true);

    const formData = new FormData();

    for (const key in addProductData) {
      formData.append(key, addProductData[key]);
    }

    productImageFiles.forEach((file) => {
      formData.append("images", file, file.name);
    });

    try {
      const api_header = { 
        Authorization: `Bearer ${localStorage.getItem("campusrecycletoken")}`,
        "Content-Type": "multipart/form-data",
      };

      const response = await apiConnector(
        "POST",
        authroutes.ADD_PRODUCT,
        formData,
        api_header
      );

      if (response.data.success) {

        toast.success(" Product added successfully!",
          {
             position: "top-right",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: "colored",
          }
        );
        

        setAddProductData({
          productname: "",
          productdescription: "",
          price: "",
          status: "For Sale",
          quantity: "",
          categoryid: "",
        });
        setProductImageFiles([]);
        imagesInputRef.current.value = null;
        addProductFormRef.current.reset();


        const user = localStorage.getItem("campusrecycleuser");
        if (user) {
          const userObj = JSON.parse(user);
          userObj.products.push(response.data.data._id);
          localStorage.setItem("campusrecycleuser", JSON.stringify(userObj));
        }
      } else {

         toast.error(`❌ Error: ${response.data.message}`, {
              position: "top-right",
              autoClose: 3000,
              hideProgressBar: false,
              closeOnClick: true,
              pauseOnHover: true,
              draggable: true,
              progress: undefined,
              theme: "colored",
            });

        
      }
    } catch (error) {
      console.log("Error adding product:", error);

       toast.error(`Something went wrong while adding the product!`, {
              position: "top-right",
              autoClose: 3000,
              hideProgressBar: false,
              closeOnClick: true,
              pauseOnHover: true,
              draggable: true,
              progress: undefined,
              theme: "colored",
            });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllCategories();
  }, []);

  const isFormValid = () => {
    const { productname, productdescription, price, quantity, categoryid } =
      addProductData;

    const isAllFieldsFilled =
      productname.trim() !== "" &&
      productdescription.trim() !== "" &&
      price.trim() !== "" &&
      quantity.trim() !== "" &&
      categoryid.trim() !== "";

    const hasMinImages = productImageFiles.length >= 3;

    return isAllFieldsFilled && hasMinImages;
  };

  return (
    <div className="add-product-form">
      <div className="left-add-product-form">
        <form onSubmit={handleSubmit} ref={addProductFormRef}>
          <div className="add-product-form-heading">
            <h3> <Tags/>  Add New Product</h3>
          </div>
          <div className="add-product-form-body">
            <div className="form-block">
              <div className="form-segment">
                <label htmlFor="productname">Product Name</label>
                <input
                  type="text"
                  id="productname"
                  name="productname"
                  value={addProductData.productname}
                  onChange={handleOnChange}
                  placeholder="name"
                />
              </div>
              <div className="form-segment">
                <label htmlFor="price">Price</label>
                <input
                  type="number"
                  id="price"
                  name="price"
                  value={addProductData.price}
                  placeholder="₹"
                  onChange={handleOnChange}
                />
              </div>
            </div>
            <div className="form-block">
           
              <div className="form-segment">
                <label htmlFor="quantity">Quantity</label>
                <input
                  type="number"
                  id="quantity"
                  placeholder="eg.. 4"
                  name="quantity"
                  value={addProductData.quantity}
                  onChange={handleOnChange}
                />
              </div>
              
            </div>
          </div>
          <div className="form-block-text">
            <label htmlFor="productdescription">Product Description</label>
            <textarea
              type="text"
              rows={10}
              cols={10}
              id="productdescription"
              name="productdescription"
              value={addProductData.productdescription}
              onChange={handleOnChange}
              placeholder="......"
            />
          </div>
          <div className="add-product-form-attachments">
            <div>
              <label htmlFor="product_imaged">Upload Images</label>
              <input
                type="file"
                id="product_imaged"
                accept=".jpg, .png, .jpeg"
                name="images"
                ref={imagesInputRef}
                onChange={(e) => productImagefilesOnchange(e)}
                multiple
                hidden
              />
              {productImageFiles.map((file, i) => {
                return (
                  <div key={i} className="product_img_file_div">
                    <span>{file.name.slice(0, 30) + "..."}</span>
                    <X
                      style={{ cursor: "pointer", margin: "0 5px" }}
                      onClick={() => removeProductImageFile(file)}
                    />
                  </div>
                );
              })}
              {isImageAddErr && (
                <p
                  style={{ color: "red", fontSize: "15px", textAlign: "left" }}
                >
                  You must add minimum 3 images
                </p>
              )}
            </div>
          </div>
          <div className="add-product-form-footer">
            <button
              onClick={() =>
                setAddProductData({
                  productname: "",
                  productdescription: "",
                  price: "",
                  status: "",
                  quantity: "",
                  categoryid: "",
                })
              }
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading && !isFormValid()}
              style={{
                padding: isLoading ? "1px 10px" : "",
                opacity: isFormValid() ? 1 : 0.6,
                cursor: isFormValid() ? "pointer" : "not-allowed",
              }}
            >
            Add Product{" "}
              {isLoading && <Spinner className="add-product-spinner" />}
            </button>
          </div>
        </form>
      </div>
      <div className="right-add-product-form">
        <div className="form-segment">
          <div className="form-segment-top">
            <label htmlFor="status">Status</label>
          </div>

          <div className="form-segment-bottom">
            <select
              id="status"
              name="status"
              value={addProductData.status}
              onChange={handleOnChange}
            >
              <option value="Forsale">Forsale</option>
              <option value="Sold">Sold</option>
              <option value="Purchased">Purchased</option>
            </select>
          </div>
        </div>

        <div className="form-segment">
          <div className="form-segment-top">
            {" "}
            <label htmlFor="categoryid">Category</label>
          </div>
          <div className="form-segment-bottom">
            <select
              id="categoryid"
              name="categoryid"
              value={addProductData.categoryid}
              onChange={handleOnChange}
              required
            >
              <option>Select category</option>
              {allCategories.map((category, i) => {
                return <option value={category._id}>{category.name}</option>;
              })}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AddProductForm;