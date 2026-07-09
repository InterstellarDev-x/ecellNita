import React, { useEffect } from 'react';
import StudentprofileView from '../components/CommonInterface/Studentprofile/StudentprofileView';
import BuyerNavbar from '../components/BuyerInterface/BuyerNavbar/BuyerNavbar';
import { useNavigate } from 'react-router-dom';

function BuyerProfile() {
  const navigate = useNavigate();

  useEffect(() => {
    if (!localStorage.getItem('campusrecycletoken')) {
      navigate('/');
    }
  }, []);

  return (
    <>
      <BuyerNavbar />
      <StudentprofileView />
    </>
  );
}

export default BuyerProfile;
