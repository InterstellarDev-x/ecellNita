import React, { useEffect } from 'react';
import Getstarted from '../components/CommonInterface/LoginSignup/Getstarted/Getstarted';
import { useNavigate } from 'react-router-dom';

function Getstart() {
  const navigate = useNavigate();

  useEffect(()=>{
    if(!localStorage.getItem('campusrecycletoken')){
      navigate('/');
    }
  }, []);
  return (
    <Getstarted/>
  )
}

export default Getstart