import React from 'react';
import { Navigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const PrivateRoute = ({ children }) => {
  const isAuthenticated = !!localStorage.getItem('campusrecycletoken'); // Check if the user is authenticated

  if (!isAuthenticated) {
   
    toast.warn(" You need to be logged in to access this page. Redirecting to login page...", {
  position: "top-right",
  autoClose: 4000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  progress: undefined,
  theme: "colored", 
});
    return <Navigate to="/student-login" />;
  }

  return children;
};

export default PrivateRoute;
