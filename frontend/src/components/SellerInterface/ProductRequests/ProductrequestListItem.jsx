import React, { useState } from "react";
import { Trash2 } from "lucide-react";
import { apiConnector } from "../../../utils/Apiconnecter";
import { authroutes } from "../../../apis/apis";
import SmallLoader from "../../CommonInterface/SmallLoader/SmallLoader";
import { toast } from "react-toastify";
import MeetingPlanner from "../../CommonInterface/MeetingPlanner/MeetingPlanner";
import { productThumbnailImageProps } from "../../../utils/cloudinaryImage";
import { useRequestSchedule } from "../../../hooks/useBuyerQueries";

function ProductrequestListItem({ request, handleDeleteProductRequest }) {
  const hasProduct = Boolean(request?.product);
  const productImage = request?.product?.images?.[0] || "https://via.placeholder.com/120x70?text=Deleted";

  const [isLoadingOTP, setIsLoadingOTP] = useState(false);
  const { data: scheduleData, refetch: refetchSchedule } = useRequestSchedule(request?._id);
  const isScheduled = Boolean(scheduleData);

  const sendTransactionOTP = async () => {
    if (!hasProduct) return;
    setIsLoadingOTP(true);
    try {
      const api_header = {
        Authorization: `Bearer ${localStorage.getItem("campusrecycletoken")}`,
        "Content-Type": "multipart/form-data",
      };
      const bodyData = {
        requestid: request._id,
      };
      const response = await apiConnector(
        "POST",
        authroutes.SEND_TRANSACTION_OTP,
        bodyData,
        api_header
      );
      if (response.data.success) {
        setIsLoadingOTP(false);
        toast.success("Verification OTP sent to the buyer");
      }else{
        setIsLoadingOTP(false);
        toast.error(response.data.message || "Could not send the OTP");
      }
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.message || "Could not send the OTP");
      setIsLoadingOTP(false);
    }
  }

  const isConfirmed = isScheduled && (scheduleData?.status || "confirmed") === "confirmed";
  return (
    <>
      <div className="requested-product-item">
        <div className="requested-product-item-img">
          <img {...productThumbnailImageProps(productImage)} alt="" />
          <div className="product-info">
            <b>{request.product?.productname || "Product no longer available"}</b>
            <p>{request.product?.productdescription || "This product was deleted by the seller."}</p>
            {hasProduct && <b>&#8377; {request.product.price}</b>}
          </div>
        </div>
        <div className="requested-product-item-status">
          <p>
            <b>Buyer name: </b>
            {request.buyer.firstname} {request.buyer.lastname}
          </p>
          <p>
            <b>Buyer email: </b>
            {request.buyer.email}
          </p>
          <p>
            <b>Date: </b>
            {new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(request.requestdate))}
          </p>
        </div>
        <div className="requested-product-item-btns">
          {hasProduct && (
            <button
              className="schedule-btn"
              data-bs-toggle="modal"
              data-bs-target={`#schedule_data_view_product_request_modal-${request._id}`}
            >
              {isScheduled ? "Review meeting" : "Propose meeting"}
            </button>
          )}
          {hasProduct && isConfirmed && (
            <button
              className="schedule-btn"
              onClick={sendTransactionOTP}
              style={{ minWidth: '150px' }}
            >
              Send OTP
              {isLoadingOTP && (
                <SmallLoader className="product-meet-schedule-spinner" size={13} />
              )}
            </button>
          )}
          <button
            className="delete-btn"
            data-bs-toggle="modal"
            data-bs-target={`#delete_product_request_modal-${request._id}`}
          >
            <Trash2 />
          </button>
        </div>
      </div>
      
      <div
        className="modal fade"
        id={`delete_product_request_modal-${request._id}`}
        tabIndex="-1"
        aria-labelledby="exampleModalLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="exampleModalLabel">
                Delete Product
              </h5>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              ></button>
            </div>
            <div className="modal-body">
              <div className="delete-action-edit-product">
                <button className="cancel-btn" data-bs-dismiss="modal">
                  Cancel
                </button>
                <button
                  className="delete-btn"
                  data-bs-dismiss="modal"
                  onClick={() => {
                    handleDeleteProductRequest(request._id);
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* View Schedule data starts here */}
      <div
        className="modal fade"
        id={`schedule_data_view_product_request_modal-${request._id}`}
        tabIndex="-1"
        aria-labelledby="exampleModalLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="exampleModalLabel">
                Meeting plan
              </h5>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              ></button>
            </div>
            <div className="modal-body">
              <MeetingPlanner requestId={request._id} schedule={scheduleData} onChanged={refetchSchedule} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default ProductrequestListItem;
