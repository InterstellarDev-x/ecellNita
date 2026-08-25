import React from "react";
import "./BuyerPageHeader.css";

function BuyerPageHeader({ icon: Icon, kicker, title, description, count, accent = "green" }) {
  return (
    <header className={`buyer-page-header buyer-page-header--${accent}`}>
      <div className="buyer-page-header__main">
        <span className="buyer-page-header__icon" aria-hidden="true">
          <Icon size={22} />
        </span>
        <div className="buyer-page-header__copy">
          <span className="buyer-page-header__kicker">{kicker}</span>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
      </div>
      {count && <span className="buyer-page-header__count">{count}</span>}
    </header>
  );
}

export default BuyerPageHeader;
