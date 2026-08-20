import React, { useEffect, useMemo, useRef, useState } from "react";
import "./AddProductFrom.css";
import SmallLoader from "../../CommonInterface/SmallLoader/SmallLoader";
import { apiConnector } from "../../../utils/Apiconnecter";
import { authroutes } from "../../../apis/apis";
import {
  AlertCircle,
  CheckCircle2,
  ImagePlus,
  IndianRupee,
  RotateCcw,
  Save,
  UploadCloud,
  X,
} from "lucide-react";
import { toast } from "react-toastify";

const INITIAL_PRODUCT_DATA = {
  productname: "",
  productdescription: "",
  price: "",
  status: "Forsale",
  quantity: "",
  categoryid: "",
};

const MIN_IMAGES = 3;
const MAX_IMAGES = 6;
const MAX_IMAGE_SIZE_MB = 3;

function AddProductForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [isImageAddErr, setIsImageAddErr] = useState(false);
  const [productImageFiles, setProductImageFiles] = useState([]);
  const [allCategories, setAllCategories] = useState([]);
  const [statusMessage, setStatusMessage] = useState({ type: "", message: "" });
  const [addProductData, setAddProductData] = useState(INITIAL_PRODUCT_DATA);

  const imagesInputRef = useRef();

  const fetchAllCategories = async () => {
    try {
      const apiHeader = {
        Authorization: `Bearer ${localStorage.getItem("campusrecycletoken")}`,
      };
      const response = await apiConnector("POST", authroutes.GET_ALL_CATEGORIES, {}, apiHeader);

      if (response.data.success) {
        setAllCategories(response.data.data || []);
      } else {
        setStatusMessage({ type: "error", message: response.data.message || "Failed to fetch categories." });
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
      setStatusMessage({ type: "error", message: "Could not load categories. Please refresh the page." });
    }
  };

  const imagePreviews = useMemo(
    () => productImageFiles.map((file) => ({ file, preview: URL.createObjectURL(file) })),
    [productImageFiles]
  );

  useEffect(() => {
    return () => {
      imagePreviews.forEach((item) => URL.revokeObjectURL(item.preview));
    };
  }, [imagePreviews]);

  const handleOnChange = (e) => {
    setStatusMessage({ type: "", message: "" });
    setAddProductData({ ...addProductData, [e.target.name]: e.target.value });
  };

  const validateImageFile = (file) => {
    if (!file.type.startsWith("image/")) {
      return "Only image files are allowed.";
    }

    if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
      return `Each image must be smaller than ${MAX_IMAGE_SIZE_MB}MB.`;
    }

    return "";
  };

  const productImagefilesOnchange = (e) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (!selectedFiles.length) return;

    const newFiles = [...productImageFiles];

    for (const file of selectedFiles) {
      const validationError = validateImageFile(file);
      if (validationError) {
        setStatusMessage({ type: "error", message: validationError });
        continue;
      }

      const alreadyAdded = newFiles.find((f) => f.name === file.name && f.size === file.size);
      if (!alreadyAdded && newFiles.length < MAX_IMAGES) {
        newFiles.push(file);
      }
    }

    if (newFiles.length >= MAX_IMAGES && selectedFiles.length) {
      setStatusMessage({ type: "info", message: `Maximum ${MAX_IMAGES} images can be uploaded.` });
    }

    setProductImageFiles(newFiles);
    setIsImageAddErr(false);
    e.target.value = "";
  };

  const handleDrop = (e) => {
    e.preventDefault();
    productImagefilesOnchange({ target: { files: e.dataTransfer.files, value: "" } });
  };

  const removeProductImageFile = (fileToDelete) => {
    setProductImageFiles(productImageFiles.filter((file) => file !== fileToDelete));
  };

  const resetForm = () => {
    if (isLoading) return;
    setAddProductData(INITIAL_PRODUCT_DATA);
    setProductImageFiles([]);
    setIsImageAddErr(false);
    setStatusMessage({ type: "", message: "" });
    if (imagesInputRef.current) imagesInputRef.current.value = "";
  };

  const isFormValid = () => {
    const { productname, productdescription, price, quantity, categoryid } = addProductData;

    return (
      productname.trim() !== "" &&
      productdescription.trim() !== "" &&
      Number(price) > 0 &&
      Number(quantity) > 0 &&
      categoryid.trim() !== "" &&
      productImageFiles.length >= MIN_IMAGES
    );
  };

  const selectedCategoryName = allCategories.find((category) => category._id === addProductData.categoryid)?.name || "Not selected";
  const formValid = isFormValid();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (productImageFiles.length < MIN_IMAGES) {
      setIsImageAddErr(true);
      setStatusMessage({ type: "error", message: `Please add at least ${MIN_IMAGES} product images.` });
      return;
    }

    if (!formValid) {
      setStatusMessage({ type: "error", message: "Please complete all required fields correctly." });
      return;
    }

    setIsLoading(true);
    setStatusMessage({ type: "", message: "" });

    const formData = new FormData();
    Object.entries(addProductData).forEach(([key, value]) => formData.append(key, value));
    productImageFiles.forEach((file) => formData.append("images", file, file.name));

    try {
      const apiHeader = {
        Authorization: `Bearer ${localStorage.getItem("campusrecycletoken")}`,
        "Content-Type": "multipart/form-data",
      };

      const response = await apiConnector("POST", authroutes.ADD_PRODUCT, formData, apiHeader);

      if (response.data.success) {
        toast.success("Product added successfully!", {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });

        setStatusMessage({ type: "success", message: "Product added successfully. You can add another one now." });
        setAddProductData(INITIAL_PRODUCT_DATA);
        setProductImageFiles([]);
        setIsImageAddErr(false);
        if (imagesInputRef.current) imagesInputRef.current.value = "";

        const user = localStorage.getItem("campusrecycleuser");
        if (user) {
          const userObj = JSON.parse(user);
          userObj.products = Array.isArray(userObj.products) ? userObj.products : [];
          userObj.products.push(response.data.data._id);
          localStorage.setItem("campusrecycleuser", JSON.stringify(userObj));
          window.dispatchEvent(new Event("campusrecycleuser-updated"));
        }
      } else {
        const message = response.data.message || "Could not add product.";
        setStatusMessage({ type: "error", message });
        toast.error(`Error: ${message}`, {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      }
    } catch (error) {
      console.error("Error adding product:", error);
      setStatusMessage({ type: "error", message: "Something went wrong while adding the product." });
      toast.error("Something went wrong while adding the product!", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllCategories();
  }, []);

  return (
    <div className="add-product-page">
      {statusMessage.message && (
        <div className={`add-product-alert add-product-alert-${statusMessage.type}`}>
          {statusMessage.type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{statusMessage.message}</span>
        </div>
      )}

      <div className="add-product-layout">
        <form className="add-product-card add-product-main-form" onSubmit={handleSubmit}>
          <div className="add-product-form-heading">
            <div>
              <h3>Product details</h3>
              <p>Use a short name and honest description. Fields marked with * are required.</p>
            </div>
          </div>

          <div className="add-product-form-grid">
            <div className="form-segment">
              <label htmlFor="productname">Product Name *</label>
              <input
                type="text"
                id="productname"
                name="productname"
                value={addProductData.productname}
                onChange={handleOnChange}
                placeholder="e.g. Scientific calculator"
                disabled={isLoading}
                required
              />
            </div>

            <div className="form-segment">
              <label htmlFor="price">Price *</label>
              <div className="input-with-icon">
                <IndianRupee size={16} />
                <input
                  type="number"
                  id="price"
                  name="price"
                  value={addProductData.price}
                  placeholder="499"
                  min="1"
                  onChange={handleOnChange}
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            <div className="form-segment">
              <label htmlFor="quantity">Quantity *</label>
              <input
                type="number"
                id="quantity"
                placeholder="1"
                name="quantity"
                min="1"
                value={addProductData.quantity}
                onChange={handleOnChange}
                disabled={isLoading}
                required
              />
            </div>

            <div className="form-segment">
              <label htmlFor="categoryid">Category *</label>
              <select
                id="categoryid"
                name="categoryid"
                value={addProductData.categoryid}
                onChange={handleOnChange}
                disabled={isLoading}
                required
              >
                <option value="">Select category</option>
                {allCategories.map((category) => (
                  <option value={category._id} key={category._id}>{category.name}</option>
                ))}
              </select>
            </div>

            <div className="form-segment">
              <label htmlFor="status">Status *</label>
              <select id="status" name="status" value={addProductData.status} onChange={handleOnChange} disabled={isLoading}>
                <option value="Forsale">For sale</option>
                <option value="Sold">Sold</option>
                <option value="Purchased">Purchased</option>
              </select>
            </div>
          </div>

          <div className="form-segment full-width">
            <label htmlFor="productdescription">Product Description *</label>
            <textarea
              rows={7}
              id="productdescription"
              name="productdescription"
              value={addProductData.productdescription}
              onChange={handleOnChange}
              placeholder="Describe condition, usage, included accessories, and pickup preference."
              maxLength={600}
              disabled={isLoading}
              required
            />
            <span className="field-counter">{addProductData.productdescription.length}/600 characters</span>
          </div>

          <div className="add-product-upload-section">
            <div className="upload-section-header">
              <div>
                <h4>Product Images *</h4>
                <p>Add {MIN_IMAGES}-{MAX_IMAGES} clear images. First image appears as the main product photo.</p>
              </div>
              <span>{productImageFiles.length}/{MAX_IMAGES}</span>
            </div>

            <label
              className={`image-dropzone ${isImageAddErr ? "image-dropzone-error" : ""}`}
              htmlFor="product_images"
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
            >
              <UploadCloud size={30} />
              <strong>Click to upload or drag images here</strong>
              <span>JPG, PNG, JPEG or WebP · max {MAX_IMAGE_SIZE_MB}MB each</span>
              <input
                type="file"
                id="product_images"
                accept="image/*"
                name="images"
                ref={imagesInputRef}
                onChange={productImagefilesOnchange}
                multiple
                hidden
                disabled={isLoading || productImageFiles.length >= MAX_IMAGES}
              />
            </label>

            {isImageAddErr && <p className="image-error-text">You must add minimum {MIN_IMAGES} images.</p>}

            {imagePreviews.length > 0 && (
              <div className="image-preview-grid">
                {imagePreviews.map(({ file, preview }, index) => (
                  <div key={`${file.name}-${file.size}`} className="image-preview-card">
                    <img src={preview} alt={file.name} />
                    {index === 0 && <span className="cover-badge">Cover</span>}
                    <button type="button" onClick={() => removeProductImageFile(file)} aria-label="Remove image" disabled={isLoading}>
                      <X size={16} />
                    </button>
                    <p>{file.name}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="add-product-form-footer">
            <button type="button" className="btn-reset-product" onClick={resetForm} disabled={isLoading}>
              <RotateCcw size={16} /> Reset
            </button>
            <button type="submit" className="btn-submit-product" disabled={isLoading || !formValid}>
              {isLoading ? <><SmallLoader className="add-product-spinner" size={13} /> Adding...</> : <><Save size={16} /> Add Product</>}
            </button>
          </div>
        </form>

        <aside className="add-product-side-panel">
          <div className="add-product-card listing-preview-card">
            <div className="preview-image-wrap">
              {imagePreviews[0] ? <img src={imagePreviews[0].preview} alt="Product preview" /> : <ImagePlus size={34} />}
            </div>
            <div className="listing-preview-content">
              <span>{selectedCategoryName}</span>
              <h4>{addProductData.productname || "Product name"}</h4>
              <p>{addProductData.productdescription || "Your product description preview will appear here."}</p>
              <div>
                <strong>{addProductData.price ? `₹${addProductData.price}` : "₹0"}</strong>
                <small>Qty {addProductData.quantity || 0}</small>
              </div>
            </div>
          </div>

          <div className="add-product-card tips-card">
            <h4>Listing tips</h4>
            <ul>
              <li><CheckCircle2 size={16} /> Use real photos from multiple angles.</li>
              <li><CheckCircle2 size={16} /> Mention defects clearly in description.</li>
              <li><CheckCircle2 size={16} /> Keep price reasonable for faster requests.</li>
              <li><CheckCircle2 size={16} /> Select the closest category.</li>
            </ul>
          </div>

          <div className="add-product-card checklist-card">
            <h4>Ready checklist</h4>
            <div className={addProductData.productname.trim() ? "done" : ""}><CheckCircle2 size={16} /> Product name</div>
            <div className={Number(addProductData.price) > 0 ? "done" : ""}><CheckCircle2 size={16} /> Valid price</div>
            <div className={addProductData.categoryid ? "done" : ""}><CheckCircle2 size={16} /> Category selected</div>
            <div className={productImageFiles.length >= MIN_IMAGES ? "done" : ""}><CheckCircle2 size={16} /> Minimum images</div>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default AddProductForm;
