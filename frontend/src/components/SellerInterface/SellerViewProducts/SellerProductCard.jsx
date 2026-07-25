import React, { useMemo, useState } from "react";
import { apiConnector } from "../../../utils/Apiconnecter";
import { authroutes } from "../../../apis/apis";
import SmallLoader from "../../CommonInterface/SmallLoader/SmallLoader";
import { Edit3, ImagePlus, IndianRupee, Package, Save, Trash2, X } from "lucide-react";

const DEFAULT_PRODUCT_IMAGE = "https://placehold.co/600x400/eef2f6/667085?text=Product";
const MAX_IMAGE_SIZE_MB = 3;

function SellerProductCard({ product, handleDeleteProduct, onProductUpdated }) {
  const [editFormData, setEditFormData] = useState({
    productid: product._id,
    productname: product.productname || "",
    productdescription: product.productdescription || "",
    status: product.status || "Forsale",
    price: product.price || "",
    quantity: product.quantity || "",
    images: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [editError, setEditError] = useState("");

  const imagePreviews = useMemo(
    () => editFormData.images.map((file) => ({ file, preview: URL.createObjectURL(file) })),
    [editFormData.images]
  );

  React.useEffect(() => {
    return () => imagePreviews.forEach((item) => URL.revokeObjectURL(item.preview));
  }, [imagePreviews]);

  const handleEditProductOnChange = (e) => {
    setEditError("");
    if (e.target.name === "images") {
      const selectedFiles = Array.from(e.target.files || []);
      const validFiles = [];

      for (const file of selectedFiles) {
        if (!file.type.startsWith("image/")) {
          setEditError("Only image files are allowed.");
          continue;
        }
        if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
          setEditError(`Each image must be smaller than ${MAX_IMAGE_SIZE_MB}MB.`);
          continue;
        }
        validFiles.push(file);
      }

      setEditFormData((prev) => ({ ...prev, images: [...prev.images, ...validFiles] }));
      e.target.value = "";
    } else {
      setEditFormData({ ...editFormData, [e.target.name]: e.target.value });
    }
  };

  const handleRemoveProductImage = (imageToRemove) => {
    setEditFormData((prev) => ({
      ...prev,
      images: prev.images.filter((image) => image !== imageToRemove),
    }));
  };

  const resetEditForm = () => {
    setEditError("");
    setEditFormData({
      productid: product._id,
      productname: product.productname || "",
      productdescription: product.productdescription || "",
      status: product.status || "Forsale",
      price: product.price || "",
      quantity: product.quantity || "",
      images: [],
    });
  };

  const handleSubmitEditProductForm = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setEditError("");

    try {
      const formData = new FormData();
      formData.append("productid", editFormData.productid);
      formData.append("productname", editFormData.productname.trim());
      formData.append("productdescription", editFormData.productdescription.trim());
      formData.append("status", editFormData.status);
      formData.append("price", editFormData.price);
      formData.append("quantity", editFormData.quantity);
      editFormData.images.forEach((file) => formData.append("images", file, file.name));

      const apiHeader = {
        Authorization: `Bearer ${localStorage.getItem("campusrecycletoken")}`,
        "Content-Type": "multipart/form-data",
      };

      const response = await apiConnector("POST", authroutes.EDIT_PRODUCT, formData, apiHeader);
      if (response.data.success) {
        onProductUpdated(response.data.data);
        setEditFormData((prev) => ({ ...prev, images: [] }));
      } else {
        setEditError(response.data.message || "Could not update product.");
      }
    } catch (error) {
      console.log(error);
      setEditError("Something went wrong while updating product.");
    } finally {
      setIsLoading(false);
    }
  };

  const statusClass = product.status === "Sold" ? "sold" : product.status === "Purchased" ? "purchased" : "active";
  const modalId = `edit_product_modal-${product._id}`;
  const deleteModalId = `delete_product_modal-${product._id}`;

  return (
    <div className="seller-product-card">
      <div className="seller-product-image-wrap">
        <img src={product.images?.[0] || DEFAULT_PRODUCT_IMAGE} alt={product.productname} />
        <span className={`product-status-badge ${statusClass}`}>{product.status || "Forsale"}</span>
      </div>

      <div className="seller-product-content">
        <div>
          <span className="seller-product-category">{product.category?.name || "Uncategorized"}</span>
          <h5>{product.productname}</h5>
          <p>{product.productdescription}</p>
        </div>

        <div className="seller-product-info-row">
          <span><IndianRupee size={15} /> {product.price}</span>
          <span><Package size={15} /> Qty {product.quantity}</span>
        </div>
      </div>

      <div className="seller-product-actions">
        <button className="edit-product-btn" data-bs-toggle="modal" data-bs-target={`#${modalId}`} onClick={resetEditForm}>
          <Edit3 size={15} /> Edit
        </button>
        <button className="delete-product-btn" data-bs-toggle="modal" data-bs-target={`#${deleteModalId}`}>
          <Trash2 size={15} /> Delete
        </button>
      </div>

      <div className="modal fade" id={modalId} tabIndex="-1" aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content seller-product-modal">
            <div className="modal-header">
              <h5 className="modal-title">Edit Product</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleSubmitEditProductForm} className="edit-product-form">
                {editError && <div className="edit-product-error">{editError}</div>}

                <div className="edit-product-grid">
                  <div className="edit-product-form-section">
                    <label>Product Name</label>
                    <input type="text" name="productname" value={editFormData.productname} onChange={handleEditProductOnChange} required />
                  </div>
                  <div className="edit-product-form-section">
                    <label>Status</label>
                    <select name="status" value={editFormData.status} onChange={handleEditProductOnChange}>
                      <option value="Forsale">For sale</option>
                      <option value="Sold">Sold</option>
                      <option value="Purchased">Purchased</option>
                    </select>
                  </div>
                  <div className="edit-product-form-section">
                    <label>Price</label>
                    <input type="number" min="1" name="price" value={editFormData.price} onChange={handleEditProductOnChange} required />
                  </div>
                  <div className="edit-product-form-section">
                    <label>Quantity</label>
                    <input type="number" min="1" name="quantity" value={editFormData.quantity} onChange={handleEditProductOnChange} required />
                  </div>
                </div>

                <div className="edit-product-form-section">
                  <label>Product Description</label>
                  <textarea rows={4} name="productdescription" value={editFormData.productdescription} onChange={handleEditProductOnChange} required />
                </div>

                <div className="edit-product-form-image-section">
                  <div>
                    <label>Replace Images</label>
                    <p>Leave empty to keep current images. Uploading new images will replace old images.</p>
                  </div>

                  {imagePreviews.length > 0 && (
                    <div className="edit-image-preview-grid">
                      {imagePreviews.map(({ file, preview }) => (
                        <div className="product-edit-img" key={`${file.name}-${file.size}`}>
                          <img src={preview} alt={file.name} />
                          <button type="button" onClick={() => handleRemoveProductImage(file)}><X size={15} /></button>
                        </div>
                      ))}
                    </div>
                  )}

                  <label className="image-upload-container" htmlFor={`edit-product-image-upload-${product._id}`}>
                    <ImagePlus size={22} />
                    <span>Upload new images</span>
                    <input type="file" accept="image/*" id={`edit-product-image-upload-${product._id}`} name="images" onChange={handleEditProductOnChange} multiple hidden />
                  </label>
                </div>

                <div className="edit-product-form-btn-section">
                  <button type="button" className="edit-product-modal-btn secondary" data-bs-dismiss="modal">Cancel</button>
                  <button type="submit" className="edit-product-modal-btn primary" disabled={isLoading}>
                    {isLoading ? <><SmallLoader size={13} /> Updating...</> : <><Save size={16} /> Update Product</>}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      <div className="modal fade" id={deleteModalId} tabIndex="-1" aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content seller-product-modal">
            <div className="modal-header">
              <h5 className="modal-title">Delete Product</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div className="modal-body">
              <p className="delete-product-copy">Are you sure you want to delete <b>{product.productname}</b>? This action cannot be undone.</p>
              <div className="delete-action-edit-product">
                <button className="cancel-btn" data-bs-dismiss="modal">Cancel</button>
                <button className="delete-btn" data-bs-dismiss="modal" onClick={() => handleDeleteProduct(product._id)}>Delete</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SellerProductCard;
