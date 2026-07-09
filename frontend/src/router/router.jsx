import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import App from '../App';
import LandingPage from '../screens/LandingPage';
import LoginSignup from '../screens/LoginSignup';
import ForgotPassword from '../screens/ForgotPassword';
import UpdatePassword from '../screens/UpdatePassword';
import ProductListing from '../screens/ProductListing';

import AccessAccount from '../components/CommonInterface/LoginSignup/AccessAccount/AccessAccount';
import ProductView from '../screens/ProductView';
import Getstart from '../screens/Getstarted';
import Studentprofile from '../screens/Studentprofile';
import SellerDashboard from '../screens/SellerDashboard';
import SellerWelcome from '../screens/SellerWelcome';
import AddProduct from '../screens/AddProduct';
import SellerViewProducts from '../screens/SellerViewProducts';
import SellerProductRequests from '../screens/SellerProductRequests';
import BuyerProductRequests from '../screens/BuyerProductRequests';

import PrivateRoute from './PrivateRoute'; // Adjust the import path as necessary
import PublicRoute from './PublicRoute';
import { Outlet } from 'react-router-dom';
import About from '../screens/About';
import AboutMotive from '../screens/AboutMotive';
const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <PublicRoute><LandingPage /></PublicRoute> },
      { path: 'access-account', element: <PublicRoute><AccessAccount /></PublicRoute> },
      { path: 'getStarted', element: <PrivateRoute><Getstart /></PrivateRoute> },
      { path: 'student-login', element: <PublicRoute><LoginSignup /></PublicRoute> },
      { path: 'student-signup', element: <PublicRoute><LoginSignup /></PublicRoute> },
      { path: 'forgotpassword', element: <PublicRoute><ForgotPassword /></PublicRoute> },
      { path: 'updatepassword/:token', element: <UpdatePassword /> },
      { path: 'student-profile', element: <PrivateRoute><Studentprofile /></PrivateRoute> },
      { path: 'about', element: <About /> },
      { path: 'aboutMotive', element: <AboutMotive /> },
    ],
  },
  { 
    path: '/buyer',
    element: <PrivateRoute><div><Outlet /></div></PrivateRoute>,
    children: [
      { path: 'productlist', element: <ProductListing /> },
      { path: 'products/:productid', element: <ProductView /> },
      { path: 'product-requests', element: <BuyerProductRequests /> },
    ]
  },
  {
    path: '/seller',
    element: <PrivateRoute><div><Outlet /></div></PrivateRoute>,
    children: [
      { path: 'welcome', element: <SellerWelcome /> },
      { path: 'seller-dashboard', element: <SellerDashboard /> },
      { path: 'add-product', element: <AddProduct /> },
      { path: 'view-product', element: <SellerViewProducts /> },
      { path: 'product-requests', element: <SellerProductRequests /> },
    ]
  }
]);

export default router;
