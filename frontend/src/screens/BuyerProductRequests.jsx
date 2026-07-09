import React, { useEffect } from 'react';
import ProductRequest from '../components/BuyerInterface/BuyerProductRequests/ProductRequest';
import BuyerNavbar from '../components/BuyerInterface/BuyerNavbar/BuyerNavbar';
import { useNavigate } from 'react-router-dom';

function BuyerProductRequests() {
  const navigate = useNavigate();

  useEffect(() => {
    if (!localStorage.getItem('campusrecycletoken')) {
      navigate('/');
    }
  }, []);

  return (
    <>
      <BuyerNavbar />
      <ProductRequest />
    </>
  );
}

export default BuyerProductRequests;
