import React from 'react';
import ReactDOM from 'react-dom/client';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'react-toastify/dist/ReactToastify.css';
import './index.css';
import { ProductProvider } from './context/ProductsProvider';
import { RouterProvider } from 'react-router-dom';
import router from './router/router';
import { ToastContainer } from 'react-toastify';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ProductProvider>
      <RouterProvider router={router} />
      <ToastContainer
        position="top-right"
        autoClose={3200}
        closeOnClick
        pauseOnHover
        draggable
        newestOnTop
        limit={3}
        icon={false}
      />
    </ProductProvider>
  </React.StrictMode>
);
