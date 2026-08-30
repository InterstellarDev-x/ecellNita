import React from "react";
import { HandCoins, ShieldCheck, ShoppingBag, Star } from "lucide-react";
import { useUserReputation } from "../../../hooks/useReputationQueries";
import SmallLoader from "../SmallLoader/SmallLoader";

const roleCopy = {
  seller: { label: "Selling reputation", noun: "verified sale", icon: HandCoins },
  buyer: { label: "Buying reputation", noun: "verified purchase", icon: ShoppingBag },
};

function ReputationPanel() {
  const reputationQuery = useUserReputation("me");
  if (reputationQuery.isLoading) return <section className="profile-reputation-card is-loading"><SmallLoader size={19} /><span>Loading reputation…</span></section>;
  if (reputationQuery.isError) return null;

  const { summary, reviews } = reputationQuery.data;
  return (
    <section className="profile-reputation-card" aria-labelledby="profile-reputation-title">
      <header className="profile-reputation-header">
        <span><ShieldCheck size={21} /></span>
        <div><p>Verified campus exchanges</p><h3 id="profile-reputation-title">Your marketplace reputation</h3></div>
      </header>
      <div className="profile-reputation-grid">
        {Object.entries(roleCopy).map(([role, copy]) => {
          const Icon = copy.icon;
          const data = summary?.[role] || {};
          return (
            <article key={role}>
              <div className="profile-reputation-role"><span><Icon size={17} /></span><strong>{copy.label}</strong></div>
              <div className="profile-reputation-score">
                {data.count ? <><strong>{Number(data.average).toFixed(1)}</strong><Star size={18} fill="currentColor" /></> : <strong className="is-new">New</strong>}
              </div>
              <p>{data.count ? `${data.count} verified rating${data.count === 1 ? "" : "s"}` : "No published ratings yet"}</p>
              <small>{data.completedTransactions || 0} {copy.noun}{data.completedTransactions === 1 ? "" : "s"}</small>
            </article>
          );
        })}
      </div>
      {reviews?.length > 0 && (
        <div className="profile-review-list">
          <div className="profile-review-list__heading"><h4>Recent verified reviews</h4><span>{reviews.length} shown</span></div>
          {reviews.map((review) => (
            <article key={review._id} className="profile-review-item">
              <div className="profile-review-item__top">
                <span className="profile-review-stars" aria-label={`${review.rating} out of 5 stars`}>{[1, 2, 3, 4, 5].map((star) => <Star key={star} size={14} fill={star <= review.rating ? "currentColor" : "none"} />)}</span>
                <small>{review.direction === "buyer_to_seller" ? "As seller" : "As buyer"}</small>
              </div>
              {review.comment && <p>{review.comment}</p>}
              {review.tags?.length > 0 && <div className="profile-review-tags">{review.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>}
              <footer><ShieldCheck size={13} /><span>Verified transaction</span><i />{review.transaction?.productSnapshot?.name && <span>{review.transaction.productSnapshot.name}</span>}</footer>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default ReputationPanel;
