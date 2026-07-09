import { toast } from "react-toastify";
import "./AddProductFrom.css";
import { useState } from "react";

const AdvancedImageUploader = () => {
  const [images, setImages] = useState([null, null, null, null, null]);
  const maxSizeMB = 2;

  const handleFileChange = (e, index) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.warn("⚠️ Only image files are allowed.", {
        position: "top-right",
        autoClose: 4000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "colored",
      });
      return;
    }
    if (file.size / 1024 / 1024 > maxSizeMB) {
      toast.warn(`⚠️ File must be smaller than ${maxSizeMB}MB`, {
        position: "top-right",
        autoClose: 4000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "colored",
      });
      return;
    }
    const newImages = [...images];
    newImages[index] = { file, preview: URL.createObjectURL(file) };
    setImages(newImages);
  };

  const removeImage = (index) => {
    const newImages = [...images];
    newImages[index] = null;
    setImages(newImages);
  };

  const handleDrop = (e, index) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFileChange({ target: { files: [file] } }, index);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const renderBox = (index, className) => (
    <div
      className={className}
      onDrop={(e) => handleDrop(e, index)}
      onDragOver={handleDragOver}
    >
      <input
        type="file"
        id={`input-${index}`}
        hidden
        onChange={(e) => handleFileChange(e, index)}
      />
      <label htmlFor={`input-${index}`}>
        {images[index] ? (
          <div className="preview-container">
            <img
              src={images[index].preview}
              alt="Preview"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                borderRadius: "5px",
              }}
            />
            <button className="remove-btn" onClick={() => removeImage(index)}>
              X
            </button>
          </div>
        ) : (
          <span>+ Upload / Drag Image</span>
        )}
      </label>
    </div>
  );

  return (
    <div className="product-image-uploader-section">
      {renderBox(0, "product-image-uploader-section-right")}
      <div className="product-image-uploader-section-left">
        <div className="product-image-uploader-section-left-upper">
          {renderBox(1, "product-image-uploader-section-left-uppers")}
          {renderBox(2, "product-image-uploader-section-left-uppers")}
        </div>
        <div className="product-image-uploader-section-left-lower">
          {renderBox(3, "product-image-uploader-section-left-lowers")}
          {renderBox(4, "product-image-uploader-section-left-lowers")}
        </div>
      </div>
    </div>
  );
};

export default AdvancedImageUploader;
