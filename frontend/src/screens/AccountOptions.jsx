import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function AccountOptions() {
  return (
    <div style={{display: 'flex', flexDirection: 'column', width: '100%', height: '90vh', justifyContent: 'center', alignItems: 'center'}}>
        <Link>As Seller</Link>
        <Link to='/getstarted'>As Buyer</Link>
    </div>
  )
}

export default AccountOptions