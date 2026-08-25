import React from 'react';
import './ProductRequest.css';
import ProductRequestElim from './ProductRequestElim';
import { ClipboardList, PackageOpen } from 'lucide-react';
import PageLoader from '../../CommonInterface/PageLoader/PageLoader';
import BuyerPageHeader from '../BuyerPageHeader/BuyerPageHeader';
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
    <main className='buyer-page-shell buyer-product-request'>
        <BuyerPageHeader
            icon={ClipboardList}
            kicker="Your activity"
            title="Product requests"
            description="Track seller responses, meeting details, and your pending pickups."
            count={`${requests.length} active`}
            accent="blue"
        />
        <div className="buyer-page-shell__content buyer-product-request-container">
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
    </main>
  )
}

export default ProductRequest
