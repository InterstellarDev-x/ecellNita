import React from "react";
import "./SmallLoader.css";

function SmallLoader({ size = 14, color = "currentColor", className = "" }) {
  return (
    <span
      className={`small-loader ${className}`.trim()}
      style={{ width: size, height: size, borderColor: `${color}33`, borderTopColor: color }}
      aria-label="Loading"
      role="status"
    />
  );
}

export default SmallLoader;
