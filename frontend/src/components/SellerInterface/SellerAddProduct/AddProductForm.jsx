import React, { useEffect, useMemo, useRef, useState } from "react";
import "./AddProductFrom.css";
import SmallLoader from "../../CommonInterface/SmallLoader/SmallLoader";
import { apiConnector } from "../../../utils/Apiconnecter";
import { authroutes } from "../../../apis/apis";
import {
  AlertCircle,
  Boxes,
  CheckCircle2,
  ImagePlus,
  IndianRupee,
  MapPin,
  PackagePlus,
  RotateCcw,
  Save,
  Shapes,
  ShieldCheck,
  Tag,
  UploadCloud,
  X,
} from "lucide-react";
import { toast } from "react-toastify";
import { MAX_LISTING_QUANTITY, getFirstValidationMessage, listingQuantitySchema } from "../../../validation/product";
import { MAX_PRODUCT_IMAGE_SIZE_MB, compressProductImage, validateProductImage } from "../../../utils/productImageCompression";

const INITIAL_PRODUCT_DATA = {
  productname: "",
  productdescription: "",
  price: "",
  quantity: "",
  categoryid: "",
};

const MIN_IMAGES = 1;
const MAX_IMAGES = 6;

function AddProductForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
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

  const handleOnChange = (event) => {
    setStatusMessage({ type: "", message: "" });
    setAddProductData({ ...addProductData, [event.target.name]: event.target.value });
  };

  const productImagefilesOnchange = async (event) => {
    const selectedFiles = Array.from(event.target.files || []);
    event.target.value = "";
    if (!selectedFiles.length) return;

    const newFiles = [...productImageFiles];
    let processingError = "";
    setIsCompressing(true);
    setStatusMessage({ type: "info", message: "Optimizing photos for a faster upload…" });

    try {
      for (const file of selectedFiles) {
        if (newFiles.length >= MAX_IMAGES) break;
        const validationError = validateProductImage(file);
        if (validationError) {
          processingError ||= validationError;
          continue;
        }

        const alreadyAdded = newFiles.some((currentFile) => currentFile.name === file.name && currentFile.lastModified === file.lastModified);
        if (!alreadyAdded) {
          try {
            newFiles.push(await compressProductImage(file));
          } catch (error) {
            console.error("Could not optimize image:", error);
            processingError ||= `Could not optimize ${file.name}. Please choose another image.`;
          }
        }
      }

      setProductImageFiles(newFiles);
      setIsImageAddErr(false);
      if (processingError) {
        setStatusMessage({ type: "error", message: processingError });
      } else if (newFiles.length >= MAX_IMAGES) {
        setStatusMessage({ type: "info", message: `Maximum ${MAX_IMAGES} images can be uploaded.` });
      } else {
        setStatusMessage({ type: "success", message: "Photos optimized and ready to upload." });
      }
    } finally {
      setIsCompressing(false);
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    if (isLoading || isCompressing) return;
    productImagefilesOnchange({ target: { files: event.dataTransfer.files, value: "" } });
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
    const quantityValidation = listingQuantitySchema.safeParse(quantity);

    return (
      productname.trim() !== "" &&
      productdescription.trim() !== "" &&
      Number(price) > 0 &&
      quantityValidation.success &&
      categoryid.trim() !== "" &&
      productImageFiles.length >= MIN_IMAGES
    );
  };

  const selectedCategoryName = allCategories.find((category) => category._id === addProductData.categoryid)?.name || "Not selected";
  const formValid = isFormValid();
  const readinessItems = [
    { label: "Product name", ready: Boolean(addProductData.productname.trim()) },
    { label: "Clear description", ready: Boolean(addProductData.productdescription.trim()) },
    { label: "Price and quantity", ready: Number(addProductData.price) > 0 && listingQuantitySchema.safeParse(addProductData.quantity).success },
    { label: "Category selected", ready: Boolean(addProductData.categoryid) },
    { label: `${MIN_IMAGES} or more photos`, ready: productImageFiles.length >= MIN_IMAGES },
  ];
  const completedReadinessItems = readinessItems.filter((item) => item.ready).length;
  const readinessPercentage = Math.round((completedReadinessItems / readinessItems.length) * 100);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (productImageFiles.length < MIN_IMAGES) {
      setIsImageAddErr(true);
      setStatusMessage({ type: "error", message: `Please add at least ${MIN_IMAGES} product images.` });
      return;
    }

    const quantityValidation = listingQuantitySchema.safeParse(addProductData.quantity);
    if (!quantityValidation.success) {
      setStatusMessage({ type: "error", message: getFirstValidationMessage(quantityValidation.error) });
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
        if (response.data.pendingReview) {
          setStatusMessage({ type: "success", message: response.data.message || "Your listing is awaiting review." });
          setAddProductData(INITIAL_PRODUCT_DATA);
          setProductImageFiles([]);
          if (imagesInputRef.current) imagesInputRef.current.value = "";
          return;
        }

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
      const message = error?.response?.data?.message || "Something went wrong while adding the product.";
      setStatusMessage({ type: "error", message });
      toast.error(message, {
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
    <main className="add-product-page">
      <section className="add-product-intro">
        <div className="add-product-intro-copy">
          <span className="add-product-intro-icon"><PackagePlus size={25} /></span>
          <div>
            <span className="add-product-eyebrow">Seller workspace</span>
            <h1>Create a listing buyers can trust</h1>
            <p>Add accurate details and clear photos so students can decide with confidence.</p>
            <span className="add-product-auto-status"><CheckCircle2 size={14} /> New listings start as For sale</span>
          </div>
        </div>

        <div className="add-product-readiness">
          <div className="add-product-readiness-heading">
            <span>Listing readiness</span>
            <strong>{completedReadinessItems}/{readinessItems.length}</strong>
          </div>
          <div
            className="add-product-readiness-track"
            role="progressbar"
            aria-label="Listing readiness"
            aria-valuemin="0"
            aria-valuemax="100"
            aria-valuenow={readinessPercentage}
          >
            <span style={{ width: `${readinessPercentage}%` }} />
          </div>
          <small>{readinessPercentage === 100 ? "Ready to submit" : `${readinessPercentage}% complete`}</small>
        </div>
      </section>

      {statusMessage.message && (
        <div className={`add-product-alert add-product-alert-${statusMessage.type}`} role="status" aria-live="polite">
          {statusMessage.type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{statusMessage.message}</span>
        </div>
      )}

      <div className="add-product-layout">
        <form className="add-product-card add-product-main-form" onSubmit={handleSubmit}>
          <section className="add-product-form-section">
            <div className="add-product-form-heading">
              <span className="add-product-section-number">01</span>
              <div>
                <span className="add-product-section-kicker">Listing essentials</span>
                <h2>What are you selling?</h2>
                <p>Keep the title recognizable and choose the closest category.</p>
              </div>
            </div>

            <div className="add-product-form-grid">
              <div className="form-segment">
                <label htmlFor="productname">Product name <span>*</span></label>
                <div className="input-with-icon">
                  <Tag size={17} />
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
              </div>

              <div className="form-segment">
                <label htmlFor="categoryid">Category <span>*</span></label>
                <div className="input-with-icon select-with-icon">
                  <Shapes size={17} />
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
              </div>

              <div className="form-segment">
                <label htmlFor="price">Price per item <span>*</span></label>
                <div className="input-with-icon">
                  <IndianRupee size={17} />
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
                <label htmlFor="quantity">Available quantity (max {MAX_LISTING_QUANTITY}) <span>*</span></label>
                <div className="input-with-icon">
                  <Boxes size={17} />
                  <input
                    type="number"
                    id="quantity"
                    placeholder="1"
                    name="quantity"
                    min="1"
                    max={MAX_LISTING_QUANTITY}
                    step="1"
                    value={addProductData.quantity}
                    onChange={handleOnChange}
                    disabled={isLoading}
                    required
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="add-product-form-section">
            <div className="add-product-form-heading">
              <span className="add-product-section-number">02</span>
              <div>
                <span className="add-product-section-kicker">Description</span>
                <h2>Describe the item clearly</h2>
                <p>Mention its condition, usage, included accessories, and any defects.</p>
              </div>
            </div>

            <div className="form-segment full-width">
              <label htmlFor="productdescription">Product description <span>*</span></label>
              <textarea
                rows={7}
                id="productdescription"
                name="productdescription"
                value={addProductData.productdescription}
                onChange={handleOnChange}
                placeholder="Describe the item honestly—include its condition, how long it was used, accessories, and anything a buyer should know."
                maxLength={600}
                disabled={isLoading}
                required
              />
              <span className="field-counter">{addProductData.productdescription.length}/600</span>
            </div>
          </section>

          <section className="add-product-form-section add-product-upload-section">
            <div className="upload-section-header">
              <div className="add-product-form-heading">
                <span className="add-product-section-number">03</span>
                <div>
                  <span className="add-product-section-kicker">Product gallery</span>
                  <h2>Add clear, useful photos</h2>
                  <p>Upload {MIN_IMAGES}-{MAX_IMAGES} angles. Your first photo becomes the cover.</p>
                </div>
              </div>
              <span className="image-count-pill">{productImageFiles.length}/{MAX_IMAGES}</span>
            </div>

            <label
              className={`image-dropzone ${isImageAddErr ? "image-dropzone-error" : ""}`}
              htmlFor="product_images"
              onDrop={handleDrop}
              onDragOver={(event) => event.preventDefault()}
            >
              <span className="image-dropzone-icon"><UploadCloud size={27} /></span>
              <strong>Drop product photos here</strong>
              <span><b>Browse files</b> or drag and drop</span>
              <small>JPG, PNG, JPEG or WebP · max {MAX_PRODUCT_IMAGE_SIZE_MB}MB each · optimized before upload</small>
              <input
                type="file"
                id="product_images"
                accept="image/jpeg,image/png,image/webp"
                name="images"
                ref={imagesInputRef}
                onChange={productImagefilesOnchange}
                multiple
                hidden
                disabled={isLoading || isCompressing || productImageFiles.length >= MAX_IMAGES}
              />
            </label>

            {isImageAddErr && <p className="image-error-text">Add at least {MIN_IMAGES} images before submitting.</p>}

            {imagePreviews.length > 0 && (
              <div className="image-preview-grid">
                {imagePreviews.map(({ file, preview }, index) => (
                  <article key={`${file.name}-${file.size}`} className="image-preview-card">
                    <img src={preview} alt={`${addProductData.productname || "Product"} view ${index + 1}`} />
                    {index === 0 && <span className="cover-badge">Cover</span>}
                    <button type="button" onClick={() => removeProductImageFile(file)} aria-label={`Remove ${file.name}`} disabled={isLoading || isCompressing}>
                      <X size={15} />
                    </button>
                    <div>
                      <strong>Photo {index + 1}</strong>
                      <span>{file.name}</span>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <footer className="add-product-form-footer">
            <p><ShieldCheck size={16} /> You can edit listing details later from My Products.</p>
            <div>
              <button type="button" className="btn-reset-product" onClick={resetForm} disabled={isLoading || isCompressing}>
                <RotateCcw size={16} /> Reset
              </button>
              <button type="submit" className="btn-submit-product" disabled={isLoading || isCompressing || !formValid}>
                {isCompressing ? (
                  <><SmallLoader className="add-product-spinner" size={13} color="#ffffff" /> Optimizing photos…</>
                ) : isLoading ? (
                  <><SmallLoader className="add-product-spinner" size={13} color="#ffffff" /> Submitting…</>
                ) : (
                  <><Save size={16} /> Submit listing</>
                )}
              </button>
            </div>
          </footer>
        </form>

        <aside className="add-product-side-panel">
          <section className="add-product-card listing-preview-card">
            <header className="preview-card-heading">
              <div>
                <span>Buyer view</span>
                <h3>Live preview</h3>
              </div>
              <span className="preview-live-indicator"><i /> Live</span>
            </header>

            <div className="preview-image-wrap">
              {imagePreviews[0] ? (
                <img src={imagePreviews[0].preview} alt={`${addProductData.productname || "Product"} cover preview`} />
              ) : (
                <div className="preview-image-empty">
                  <span><ImagePlus size={28} /></span>
                  <strong>Your cover photo</strong>
                  <small>The first upload appears here</small>
                </div>
              )}
              {imagePreviews[0] && <span className="preview-cover-label">Cover photo</span>}
            </div>

            <div className="listing-preview-content">
              <span className="preview-category">{selectedCategoryName}</span>
              <div className="preview-title-row">
                <h4>{addProductData.productname || "Product name"}</h4>
                <strong>{addProductData.price ? `₹${Number(addProductData.price).toLocaleString("en-IN")}` : "₹0"}</strong>
              </div>
              <p>{addProductData.productdescription || "Your product description preview will appear here."}</p>
              <div className="preview-meta-row">
                <span><MapPin size={14} /> Campus pickup</span>
                <strong>Qty {addProductData.quantity || 0}</strong>
              </div>
            </div>
          </section>

          <section className="add-product-card checklist-card">
            <div className="side-card-heading">
              <span>Progress</span>
              <h3>Ready checklist</h3>
            </div>
            <div className="checklist-progress-copy">
              <span>{completedReadinessItems} of {readinessItems.length} complete</span>
              <strong>{readinessPercentage}%</strong>
            </div>
            <div className="checklist-progress-track"><span style={{ width: `${readinessPercentage}%` }} /></div>
            <div className="checklist-items">
              {readinessItems.map((item) => (
                <div className={`checklist-item${item.ready ? " done" : ""}`} key={item.label}>
                  <CheckCircle2 size={16} />
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="add-product-card tips-card">
            <div className="side-card-heading">
              <span>Quick guidance</span>
              <h3>Build buyer confidence</h3>
            </div>
            <ul>
              <li><CheckCircle2 size={16} /> Use real photos from multiple angles.</li>
              <li><CheckCircle2 size={16} /> Mention defects clearly in the description.</li>
              <li><CheckCircle2 size={16} /> Keep the price reasonable for faster requests.</li>
              <li><CheckCircle2 size={16} /> Select the closest available category.</li>
            </ul>
          </section>
        </aside>
      </div>
    </main>
  );
}

export default AddProductForm;
