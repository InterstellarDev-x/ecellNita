import React, { useEffect, useState } from 'react';
import './AllRequests.css';
import { apiConnector } from "../../../utils/Apiconnecter";
import { authroutes } from "../../../apis/apis";
import ProductrequestListItem from './ProductrequestListItem';

function AllRequests() {
    const [requests, setRequests] = useState([]);

    const fetchAllProductrequests = async() => {
        try {
            const api_header = { 
              Authorization: `Bearer ${localStorage.getItem('campusrecycletoken')}`,
              "Content-Type": "multipart/form-data"
            };
            const bodyData = {
                // Need to write something
            }
            const response = await apiConnector("POST", authroutes.GET_ALL_PRODUCT_REQUESTS, bodyData, api_header);
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
    <div className='all-product-requests'>
        <div className="heading">
            <h4>All Requests</h4>
        </div>
        {
            requests.map((request, i)=>{
               return <ProductrequestListItem key={i} request={request} handleDeleteProductRequest={handleDeleteProductRequest} />
            })
        }
    </div>
  )
}

export default AllRequests