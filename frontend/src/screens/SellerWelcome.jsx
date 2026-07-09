import React, { useEffect } from 'react'
import SellerWelcomePage from '../components/SellerInterface/SellerWelcome/SellerWelcomePage'
import { useNavigate } from 'react-router-dom';

function SellerWelcome() {
  const navigate = useNavigate();

  useEffect(()=>{
    if(!localStorage.getItem('campusrecycletoken')){
      navigate('/');
    }
  }, []);
  return (
    <SellerWelcomePage/>
  )
}

export default SellerWelcome