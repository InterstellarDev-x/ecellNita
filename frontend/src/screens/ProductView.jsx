import React, { useEffect } from 'react';
import BuyerNavbar from '../components/BuyerInterface/BuyerNavbar/BuyerNavbar';
import BuyerProductView from '../components/BuyerInterface/BuyerProductView/BuyerProductView';
import { useNavigate } from 'react-router-dom';

function ProductView() {
  const navigate = useNavigate();

  useEffect(()=>{
    if(!localStorage.getItem('campusrecycletoken')){
      navigate('/');
    }
  }, [navigate])
  return (
    <>
        <BuyerNavbar/>
        <BuyerProductView />
    </>
  )
}

export default ProductView
