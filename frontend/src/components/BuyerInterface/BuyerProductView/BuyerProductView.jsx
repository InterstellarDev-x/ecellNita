import React, { useEffect, useMemo, useState } from "react";
import "./BuyerProductView.css";
import {
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  ImageOff,
  LockKeyhole,
  MapPin,
  MessageCircle,
  Minus,
  PackageCheck,
  Plus,
  Send,
  ShieldCheck,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import SmallLoader from "../../CommonInterface/SmallLoader/SmallLoader";
import PageLoader from "../../CommonInterface/PageLoader/PageLoader";
import { useBuyerRequests, useCreateBuyerRequest, useMarketplaceProduct } from "../../../hooks/useBuyerQueries";
import { useCreateProductQuestion } from "../../../hooks/useQuestionQueries";
import { formatProductStatus } from "../../../utils/productStatus";
import { getOptimizedImageUrl, productDetailImageProps, productThumbnailImageProps } from "../../../utils/cloudinaryImage";

const FALLBACK_PROFILE_IMAGE = "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png";

function BuyerProductView() {
  const { productid } = useParams();
  const productQuery = useMarketplaceProduct(productid);
  const requestsQuery = useBuyerRequests();
  const product = productQuery.data;
  const requests = requestsQuery.data || [];
  const createRequest = useCreateBuyerRequest();
  const createQuestion = useCreateProductQuestion();
  const [productQuantity, setProductQuantity] = useState(0);
  const [question, setQuestion] = useState("");
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [failedImages, setFailedImages] = useState({});

  const currentUser = useMemo(() => {
    try { return JSON.parse(localStorage.getItem("campusrecycleuser")); } catch { return null; }
  }, []);
  const productImages = (product?.images || []).filter(Boolean);
  const sellerImage = product?.owner?.image || FALLBACK_PROFILE_IMAGE;
  const sellerReputation = product?.owner?.sellerReputation;
  const isOwnProduct = Boolean(product?.owner?._id) && String(product.owner._id) === String(currentUser?._id);
  const isUnavailable = product?.status !== "Forsale" || Number(product?.quantity) < 1;
  const isRequested = requests.some((data) => data.product?._id === productid);

  useEffect(() => {
    setActiveImageIndex(0);
    setFailedImages({});
    setProductQuantity(product && !isOwnProduct && !isUnavailable ? 1 : 0);
  }, [product, isOwnProduct, isUnavailable]);

  const handleProductRequest = async () => {
    if (isRequested || isOwnProduct || isUnavailable) return;
    if (productQuantity < 1) {
      toast.warn("Please select at least one product");
      return;
    }
    try {
      await createRequest.mutateAsync({ productid: product._id, quantity: productQuantity });
      toast.success("Product requested");
    } catch (error) {
      toast.error(error?.response?.data?.message || error.message || "Could not request this product");
    }
  };

  const handleQuestionSubmit = async (event) => {
    event.preventDefault();
    if (!question.trim() || isOwnProduct || isUnavailable) return;
    try {
      await createQuestion.mutateAsync({ productid: product._id, question: question.trim() });
      setQuestion("");
      toast.success("Your private question was sent to the seller.");
    } catch (error) {
      toast.error(error.message || "Could not send your question.");
    }
  };

  if (productQuery.isLoading || requestsQuery.isLoading) {
    return <div className="buyer-product-view buyer-product-view--loading"><PageLoader /></div>;
  }

  if (productQuery.isError || !product) {
    return (
      <main className="buyer-product-view">
        <section className="product-detail-empty">
          <span><ImageOff size={28} /></span>
          <h1>Product unavailable</h1>
          <p>{productQuery.error?.message || "This listing may have been sold, hidden, or removed."}</p>
          <Link to="/buyer/productlist"><ArrowLeft size={15} /> Back to marketplace</Link>
        </section>
      </main>
    );
  }

  const activeImage = productImages[activeImageIndex];
  const formattedDate = product.createdat
    ? new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(new Date(product.createdat))
    : "Recently";
  const total = Number(product.price || 0) * productQuantity;

  return (
    <main className="buyer-product-view">
      <div className="buyer-product-view-container">
        <Link className="product-detail-back" to="/buyer/productlist"><ArrowLeft size={15} /> Back to marketplace</Link>

        <header className="product-detail-header">
          <span className="product-detail-category">{product.category?.name || "Marketplace"}</span>
          <h1>{product.productname}</h1>
          <div className="product-detail-meta">
            <span className={`product-detail-status ${isUnavailable ? "is-unavailable" : "is-available"}`}><i />{isUnavailable ? "Unavailable" : "Available"}</span>
            <span><MapPin size={15} /> Campus pickup</span>
            <span><CalendarClock size={15} /> Listed {formattedDate}</span>
          </div>
        </header>

        <section className={`product-detail-gallery${productImages.length < 2 ? " is-single" : ""}`} aria-label="Product images">
          <div className="product-detail-main-image">
            {activeImage && !failedImages[activeImageIndex] ? (
              <img {...productDetailImageProps(activeImage, true)} alt={`${product.productname} view ${activeImageIndex + 1}`} onError={() => setFailedImages((current) => ({ ...current, [activeImageIndex]: true }))} />
            ) : (
              <div className="product-detail-image-fallback"><ImageOff size={34} /><span>Image unavailable</span></div>
            )}
            {productImages.length > 0 && <span className="product-detail-image-count">{activeImageIndex + 1} / {productImages.length}</span>}
          </div>
          {productImages.length > 1 && (
            <div className="product-detail-thumbnails">
              {productImages.map((image, index) => (
                <button key={`${image}-${index}`} type="button" className={activeImageIndex === index ? "is-active" : ""} onClick={() => setActiveImageIndex(index)} aria-label={`View product image ${index + 1}`} aria-pressed={activeImageIndex === index}>
                  {!failedImages[index] ? <img {...productThumbnailImageProps(image)} alt="" onError={() => setFailedImages((current) => ({ ...current, [index]: true }))} /> : <ImageOff size={22} />}
                </button>
              ))}
            </div>
          )}
        </section>

        <div className="product-detail-layout">
          <div className="product-detail-content">
            <section className="product-detail-panel product-description-panel">
              <div className="product-section-heading"><span>About this item</span><h2>Product description</h2></div>
              <p>{product.productdescription}</p>
            </section>

            <section className="product-detail-panel">
              <div className="product-section-heading"><span>Safe campus exchange</span><h2>How the request works</h2></div>
              <div className="product-request-steps">
                <article><span>01</span><h3>Choose quantity</h3><p>Request only the number of units you intend to buy.</p></article>
                <article><span>02</span><h3>Meet on campus</h3><p>The seller schedules an approved public meeting location.</p></article>
                <article><span>03</span><h3>Verify in person</h3><p>Inspect the item, then use the emailed OTP to complete the exchange.</p></article>
              </div>
              <p className="product-request-note">Never share a transaction OTP before you have inspected the product.</p>
            </section>

            <section className="product-detail-panel">
              <div className="product-seller-summary">
                <img src={getOptimizedImageUrl(sellerImage, { width: 96, height: 96 })} loading="lazy" decoding="async" alt="Seller profile" onError={(event) => { event.currentTarget.src = FALLBACK_PROFILE_IMAGE; }} />
                <div><span>Campus seller</span><h2>{sellerReputation?.count ? `${Number(sellerReputation.average).toFixed(1)} ★ seller rating` : "New campus seller"}</h2><p>{sellerReputation?.completedTransactions ? `${sellerReputation.completedTransactions} verified sale${sellerReputation.completedTransactions === 1 ? "" : "s"} completed. ` : "No completed sales yet. "}Contact details are shared only after a meeting is confirmed.</p></div>
                <span className="product-seller-privacy"><LockKeyhole size={14} /> Private</span>
              </div>
              {!isOwnProduct && !isUnavailable && (
                <form className="buyer-product-question" onSubmit={handleQuestionSubmit}>
                  <div className="buyer-product-question__heading"><span className="buyer-product-question__icon"><MessageCircle size={18} /></span><span><strong>Ask the seller privately</strong><small>Only you and the seller can see this question.</small></span></div>
                  <textarea aria-label="Question for the seller" value={question} onChange={(event) => setQuestion(event.target.value)} maxLength={1000} placeholder="Ask about condition, pickup, or product details…" />
                  <div className="buyer-product-question__footer"><small>{question.length}/1000</small><button type="submit" disabled={!question.trim() || createQuestion.isPending}><Send size={15} /> {createQuestion.isPending ? "Sending…" : "Send question"}</button></div>
                </form>
              )}
            </section>
          </div>

          <aside className="product-purchase-column">
            <section className="product-price-card">
              <span className="product-price-label">Price per item</span>
              <div className="product-price-row"><h2>₹{Number(product.price).toLocaleString("en-IN")}</h2><span className={`product-stock-pill${isUnavailable ? " is-unavailable" : ""}`}>{isUnavailable ? "Unavailable" : `${product.quantity} left`}</span></div>
              <p className="product-stock-copy">Listed as {formatProductStatus(product.status)}</p>
              <div className="product-purchase-divider" />
              <div className="product-quantity-heading">
                <div><span>Quantity</span><small>Maximum {product.quantity}</small></div>
                <div className="product-quantity-control">
                  <button type="button" aria-label="Decrease quantity" disabled={productQuantity <= 1 || isOwnProduct || isUnavailable} onClick={() => setProductQuantity((quantity) => Math.max(1, quantity - 1))}><Minus size={15} /></button>
                  <output aria-label="Selected quantity">{productQuantity}</output>
                  <button type="button" aria-label="Increase quantity" disabled={productQuantity >= product.quantity || isOwnProduct || isUnavailable} onClick={() => setProductQuantity((quantity) => Math.min(product.quantity, quantity + 1))}><Plus size={15} /></button>
                </div>
              </div>
              <div className="product-estimated-total"><span>Estimated total</span><strong>₹{total.toLocaleString("en-IN")}</strong></div>
              <button className={`product-request-button${isRequested ? " is-requested" : ""}`} type="button" onClick={handleProductRequest} disabled={isRequested || createRequest.isPending || isOwnProduct || isUnavailable}>
                {isOwnProduct ? "Your listing" : isUnavailable ? "Unavailable" : isRequested ? <><CheckCircle2 size={16} /> Requested</> : createRequest.isPending ? <><SmallLoader size={13} /> Requesting…</> : <><PackageCheck size={17} /> Request product</>}
              </button>
              <p className="product-request-guidance">A request is not a payment. Inspect the item before completing the transaction.</p>
              <ul className="product-purchase-assurances">
                <li><ShieldCheck size={16} /><span>Approved campus meeting points only</span></li>
                <li><LockKeyhole size={16} /><span>Contact information stays private until scheduling</span></li>
              </ul>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}

export default BuyerProductView;
