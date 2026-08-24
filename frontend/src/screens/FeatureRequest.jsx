import React, { useState } from "react";
import { ArrowLeft, Lightbulb, Send, ShoppingBag, Store } from "lucide-react";
import { toast } from "react-toastify";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { apiConnector } from "../utils/Apiconnecter";
import { authroutes } from "../apis/apis";
import "./FeatureRequest.css";

function FeatureRequest() {
  const navigate = useNavigate();
  const location = useLocation();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const goBack = () => {
    if (location.key !== "default") navigate(-1);
    else navigate("/buyer/productlist", { replace: true });
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!title.trim() || !description.trim()) return;
    setSubmitting(true);
    try {
      const response = await apiConnector("POST", authroutes.FEATURE_REQUESTS, { title, description }, { Authorization: `Bearer ${localStorage.getItem("campusrecycletoken")}` });
      if (!response.data?.success) throw new Error(response.data?.message);
      setTitle(""); setDescription("");
      toast.success("Thanks—your feature request was sent to the admin.");
    } catch (error) { toast.error(error.message || "Could not submit your request."); }
    finally { setSubmitting(false); }
  };
  return (
    <main className="feature-request-page">
      <header className="feature-request-page__topbar">
        <Link
          className="feature-request-page__brand"
          to="/buyer/productlist"
          aria-label="recyCool marketplace"
        >
          <img src="/logo.png" alt="recyCool" />
        </Link>

        <nav className="feature-request-page__navigation" aria-label="Feature request navigation">
          <button type="button" className="feature-request-page__back" onClick={goBack}>
            <ArrowLeft size={17} /> Back
          </button>
          <div className="feature-request-page__destinations">
            <Link to="/buyer/productlist"><ShoppingBag size={16} /> Marketplace</Link>
            <Link to="/seller/seller-dashboard"><Store size={16} /> Seller workspace</Link>
          </div>
        </nav>
      </header>

      <section className="feature-request-page__intro">
        <Lightbulb size={28} />
        <span>Shape the marketplace</span>
        <h1>What should Campus Recycle do next?</h1>
        <p>Send an idea directly to the platform admins. Feature requests are private and visible only to the team.</p>
      </section>

      <form className="feature-request-page__form" onSubmit={submit}>
        <label>
          Feature title
          <input required maxLength={140} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. Saved searches" />
        </label>
        <label>
          Describe your idea
          <textarea required maxLength={2000} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="What problem would this solve, and how would it help students?" />
        </label>
        <div>
          <small>{description.length}/2000</small>
          <button disabled={submitting || !title.trim() || !description.trim()} type="submit"><Send size={16} /> {submitting ? "Sending…" : "Send feature request"}</button>
        </div>
      </form>
    </main>
  );
}

export default FeatureRequest;
