import React from 'react';
import StudentprofileView from '../components/CommonInterface/Studentprofile/StudentprofileView';
import BuyerNavbar from '../components/BuyerInterface/BuyerNavbar/BuyerNavbar';

function BuyerProfile() {
  return (
    <>
      <BuyerNavbar />
      <StudentprofileView />
    </>
  );
}

export default BuyerProfile;
