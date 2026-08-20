import React, { useEffect, useState } from 'react';
import './ProductRequest.css';
import ProductRequestElim from './ProductRequestElim';
import { apiConnector } from '../../../utils/Apiconnecter';
import { authroutes } from '../../../apis/apis';
import { ClipboardList, PackageOpen } from 'lucide-react';

function ProductRequest() {
    const [requests, setRequests] = useState([]);

    const fetchAllProductrequests = async() => {
        try {
            const api_header = { 
              Authorization: `Bearer ${localStorage.getItem('campusrecycletoken')}`,
              "Content-Type": "multipart/form-data"
            };
            const response = await apiConnector("POST", authroutes.GET_ALL_SENT_PRODUCT_REQUESTS, {}, api_header);
            if (response.data.success) {
                setRequests(response.data.data);
            }
        } catch (error) {
            console.error(error);
        }
    }

    const handleDeleteProductRequest = async(idToDelete) => {
        try {
            const api_header = { 
              Authorization: `Bearer ${localStorage.getItem('campusrecycletoken')}`,
              "Content-Type": "multipart/form-data"
            };
            const bodyData = {
                requestid: idToDelete
            }
            const response = await apiConnector("POST", authroutes.DELETE_PRODUCT_REQUEST, bodyData, api_header);
            if (response.data.success) {
                fetchAllProductrequests();
            }
        } catch (error) {
            console.error(error);
        }
    }

    useEffect(()=>{
        fetchAllProductrequests();
    }, []);
  return (
    <div className='buyer-product-request'>
        <section className="buyer-request-hero">
            <span className="buyer-request-hero-icon"><ClipboardList size={22} /></span>
            <div>
                <span className="buyer-request-kicker">Your activity</span>
                <h1>Product requests</h1>
                <p>Track seller responses, meeting details, and your pending pickups.</p>
            </div>
            <span className="buyer-request-count">{requests.length} active</span>
        </section>
        <div className="buyer-product-request-container">
            {requests.length > 0 &&
                requests.map((request, i)=>{
                return <ProductRequestElim key={request._id || i} request={request} handleDeleteProductRequest={handleDeleteProductRequest} />
                })
            }
            {
                requests.length === 0 && (
                    <div className="buyer-request-empty">
                        <PackageOpen size={42} />
                        <h2>No active requests</h2>
                        <p>When you request a product, its details and seller updates will appear here.</p>
                    </div>
                )
            }
        </div>
    </div>
  )
}

export default ProductRequest
