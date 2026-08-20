import React from "react";
import "./SmallLoader.css";

function SmallLoader({ size = 14, color = "#14933d", className = "" }) {
  return (
    <span
      className={`small-loader ${className}`.trim()}
      style={{ "--small-loader-size": `${size}px`, "--small-loader-color": color }}
      aria-label="Loading"
      role="status"
    >
      {Array.from({ length: 8 }, (_, index) => <i key={index} />)}
    </span>
  );
}

export default SmallLoader;
