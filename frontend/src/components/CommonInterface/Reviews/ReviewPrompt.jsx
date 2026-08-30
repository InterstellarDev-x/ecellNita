import React, { useEffect, useState } from "react";
import { CheckCircle2, MessageSquareText, ShieldCheck, Star, X } from "lucide-react";
import SmallLoader from "../SmallLoader/SmallLoader";
import { useReviewContext, useSubmitTransactionReview } from "../../../hooks/useReputationQueries";
import "./ReviewPrompt.css";

function ReviewPrompt({ transactionId, onClose }) {
  const contextQuery = useReviewContext(transactionId);
  const submitReview = useSubmitTransactionReview();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!transactionId) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event) => { if (event.key === "Escape") onClose(); };
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [transactionId, onClose]);

  if (!transactionId) return null;
  const context = contextQuery.data;
  const personName = context?.reviewedUser ? `${context.reviewedUser.firstname} ${context.reviewedUser.lastname}` : "the other person";
  const roleLabel = context?.direction === "buyer_to_seller" ? "seller" : "buyer";

  const toggleTag = (tag) => setSelectedTags((current) => (
    current.includes(tag) ? current.filter((item) => item !== tag) : [...current, tag]
  ));

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!rating) return;
    try {
      await submitReview.mutateAsync({ transactionId, rating, comment: comment.trim(), tags: selectedTags });
      setSubmitted(true);
    } catch {
      // The mutation exposes its message below the form.
    }
  };

  return (
    <div className="review-prompt-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="review-prompt" role="dialog" aria-modal="true" aria-labelledby="review-prompt-title">
        <button type="button" className="review-prompt__close" onClick={onClose} aria-label="Close rating dialog"><X size={18} /></button>
        {contextQuery.isLoading ? (
          <div className="review-prompt__state"><SmallLoader size={22} /><p>Loading your transaction…</p></div>
        ) : contextQuery.isError ? (
          <div className="review-prompt__state is-error"><h2>Review unavailable</h2><p>{contextQuery.error.message}</p><button type="button" onClick={onClose}>Close</button></div>
        ) : context?.alreadyReviewed || submitted ? (
          <div className="review-prompt__success">
            <span><CheckCircle2 size={27} /></span>
            <p className="review-prompt__eyebrow">Experience shared</p>
            <h2 id="review-prompt-title">Thank you for helping the campus trade with confidence.</h2>
            <p>Your review is verified by this completed transaction. It will appear after both sides respond or the seven-day review window closes.</p>
            <button type="button" onClick={onClose}>Done</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="review-prompt__header">
              <span className="review-prompt__shield"><ShieldCheck size={22} /></span>
              <div><p className="review-prompt__eyebrow">Verified campus transaction</p><h2 id="review-prompt-title">How was your experience with {personName}?</h2></div>
            </div>
            <div className="review-prompt__transaction">
              {context?.transaction?.productSnapshot?.image && <img src={context.transaction.productSnapshot.image} alt="" />}
              <span><small>You’re rating the {roleLabel}</small><strong>{context?.transaction?.productSnapshot?.name}</strong></span>
            </div>
            <fieldset className="review-prompt__stars">
              <legend>Your rating</legend>
              <div>
                {[1, 2, 3, 4, 5].map((value) => (
                  <button key={value} type="button" onMouseEnter={() => setHoveredRating(value)} onMouseLeave={() => setHoveredRating(0)} onFocus={() => setHoveredRating(value)} onBlur={() => setHoveredRating(0)} onClick={() => setRating(value)} aria-label={`${value} star${value === 1 ? "" : "s"}`} aria-pressed={rating === value}>
                    <Star size={31} fill={value <= (hoveredRating || rating) ? "currentColor" : "none"} />
                  </button>
                ))}
              </div>
              <span>{rating ? ["", "Needs improvement", "Fair", "Good", "Great", "Excellent"][rating] : "Select a star rating"}</span>
            </fieldset>
            <div className="review-prompt__tags">
              <label>What stood out? <span>Optional</span></label>
              <div>{context?.allowedTags?.map((tag) => <button key={tag} type="button" className={selectedTags.includes(tag) ? "is-selected" : ""} onClick={() => toggleTag(tag)}>{tag}</button>)}</div>
            </div>
            <label className="review-prompt__comment">
              <span><MessageSquareText size={16} /> Add a comment <small>Optional</small></span>
              <textarea value={comment} onChange={(event) => setComment(event.target.value)} maxLength={1000} placeholder={`Share something useful about this ${roleLabel}…`} />
              <small>{comment.length}/1000</small>
            </label>
            {submitReview.isError && <p className="review-prompt__error">{submitReview.error.message}</p>}
            <div className="review-prompt__actions"><button type="button" onClick={onClose}>Maybe later</button><button type="submit" disabled={!rating || submitReview.isPending}>{submitReview.isPending ? <><SmallLoader size={13} /> Submitting…</> : "Submit verified review"}</button></div>
            <p className="review-prompt__privacy">Reviews stay private until both people respond or seven days pass.</p>
          </form>
        )}
      </section>
    </div>
  );
}

export default ReviewPrompt;
