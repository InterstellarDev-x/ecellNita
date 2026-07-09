import React from 'react';
import { Navigate } from 'react-router-dom';

const PublicRoute = ({ children }) => {
  const isAuthenticated = !!localStorage.getItem('campusrecycletoken');

  if (isAuthenticated) {
    return <Navigate to="/buyer/productlist" replace />;
  }

  return children;
};

export default PublicRoute;
