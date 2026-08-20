import React from "react";
import { Navigate } from "react-router-dom";

function AdminRoute({ children }) {
  try {
    const user = JSON.parse(localStorage.getItem("campusrecycleuser"));
    const roles = user?.roles || [];
    if (roles.includes("admin") || user?.accounttype === "Admin") return children;
  } catch (_) {
    // Redirect below when browser storage is malformed.
  }
  return <Navigate to="/buyer/productlist" replace />;
}

export default AdminRoute;
