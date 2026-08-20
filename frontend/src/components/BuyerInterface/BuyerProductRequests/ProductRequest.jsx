import React from 'react';
import './ProductRequest.css';
import ProductRequestElim from './ProductRequestElim';
import { ClipboardList, PackageOpen } from 'lucide-react';
import PageLoader from '../../CommonInterface/PageLoader/PageLoader';
import { useBuyerRequests, useDeleteBuyerRequest } from '../../../hooks/useBuyerQueries';

function ProductRequest() {
    const { data: requests = [], isLoading: loading } = useBuyerRequests();
    const deleteRequest = useDeleteBuyerRequest();

    const handleDeleteProductRequest = async (idToDelete) => {
        try {
            await deleteRequest.mutateAsync(idToDelete);
        } catch (error) {
            console.error(error);
        }
    };
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
            {loading ? <PageLoader /> : requests.length > 0 &&
                requests.map((request, i)=>{
                return <ProductRequestElim key={request._id || i} request={request} handleDeleteProductRequest={handleDeleteProductRequest} />
                })
            }
            {
                !loading && requests.length === 0 && (
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
