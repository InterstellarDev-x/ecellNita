import React from "react";
import SmallLoader from "../SmallLoader/SmallLoader";
import "./PageLoader.css";

function PageLoader({ className = "", size = 36 }) {
  return (
    <div className={`page-loader ${className}`.trim()} role="status" aria-label="Loading">
      <SmallLoader size={size} />
    </div>
  );
}

export default PageLoader;
