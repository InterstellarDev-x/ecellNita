import React, { useEffect, useState } from 'react';
import './ProductRequest.css';
import ProductRequestElim from './ProductRequestElim';
import { apiConnector } from '../../../utils/Apiconnecter';
import { authroutes } from '../../../apis/apis';

function ProductRequest() {
    const [requests, setRequests] = useState([]);

    const fetchAllProductrequests = async() => {
        console.log("calling fetch")
        try {
            const api_header = { 
              Authorization: `Bearer ${localStorage.getItem('campusrecycletoken')}`,
              "Content-Type": "multipart/form-data"
            };
            const bodyData = {
                // Need to write something
            }
            const response = await apiConnector("POST", authroutes.GET_ALL_SENT_PRODUCT_REQUESTS, bodyData, api_header);
            console.log(response.data);
            if (response.data.success) {
                console.log("Requests fetched successfully");
                setRequests(response.data.data);
            }
        } catch (error) {
            console.log(error);
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
            console.log(response.data);
            if (response.data.success) {
                console.log("Request deleted successfully");
                fetchAllProductrequests();
            }
        } catch (error) {
            console.log(error);
        }
    }

    useEffect(()=>{
        fetchAllProductrequests();
    }, []);
  return (
    <div className='buyer-product-request'>
        <h4 style={{ margin: '1rem 0.5rem' }}>All Requests</h4>
        <div className="buyer-product-request-container">
            {requests.length > 0 &&
                requests.map((request, i)=>{
                return <ProductRequestElim key={i} request={request} handleDeleteProductRequest={handleDeleteProductRequest} />
                })
            }
            {
                requests.length === 0 && <p>No Pending Request</p>
            }
        </div>
    </div>
  )
}

export default ProductRequest