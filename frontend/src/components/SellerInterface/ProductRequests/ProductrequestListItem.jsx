import React, { useCallback, useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { apiConnector } from "../../../utils/Apiconnecter";
import { authroutes } from "../../../apis/apis";
import SmallLoader from "../../CommonInterface/SmallLoader/SmallLoader";

function ProductrequestListItem({ request, handleDeleteProductRequest }) {
  const hasProduct = Boolean(request?.product);
  const productImage = request?.product?.images?.[0] || "https://via.placeholder.com/120x70?text=Deleted";

  const numToMonthMap = new Map([
    [1, "Jan"],
    [2, "Feb"],
    [3, "Mar"],
    [4, "Apr"],
    [5, "May"],
    [6, "Jun"],
    [7, "Jul"],
    [8, "Aug"],
    [9, "Sep"],
    [10, "Oct"],
    [11, "Nov"],
    [12, "Dec"]
  ]);

  const [isScheduled, setIsScheduled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingOTP, setIsLoadingOTP] = useState(false);
  const [scheduleData, setScheduleData] = useState(null);
  const [scheduleFormData, setScheduleFormData] = useState({
    venue: "",
    time: "",
    date: "",
  });

  const handleScheduleOnchange = (e) => {
    setScheduleFormData({
      ...scheduleFormData,
      [e.target.name]: e.target.value,
    });
  };

  const handleScheduleMeet = async (e) => {
    e.preventDefault();
    if (!hasProduct) return;
    setIsLoading(true);
    try {
      const api_header = {
        Authorization: `Bearer ${localStorage.getItem("campusrecycletoken")}`,
        "Content-Type": "multipart/form-data",
      };
      const bodyData = {
        requestid: request._id,
        venue: scheduleFormData.venue,
        date: scheduleFormData.date,
        time: scheduleFormData.time,
        sellername: request.seller.firstname + request.seller.lastname,
        productid: request.product._id,
      };
      const response = await apiConnector(
        "POST",
        authroutes.SCHEDULE_MEET,
        bodyData,
        api_header
      );
      if (response.data.success) {
        setIsScheduled(true);
        setIsLoading(false);
      }else{
        setIsLoading(false);
      }
    } catch (error) {
      console.error(error);
      setIsLoading(false);
    }
  };

  const handleDeleteSchedule = async() => {
    setIsLoading(true);
    try {
      const api_header = {
        Authorization: `Bearer ${localStorage.getItem("campusrecycletoken")}`,
        "Content-Type": "multipart/form-data",
      };
      const bodyData = {
        requestid: request._id
      };
      const response = await apiConnector(
        "POST",
        authroutes.DELETE_SCHEDULED_MEET,
        bodyData,
        api_header
      );
      if (response.data.success) {
        setIsScheduled(false);
        setIsLoading(false);
      }else{
        setIsLoading(false);
      }
    } catch (error) {
      console.error(error);
      setIsLoading(false);
    }
  }

  const fetchScheduleData = useCallback(async () => {
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
        authroutes.GET_SCHEDULE_DATA,
        bodyData,
        api_header
      );
      if (response.data.success) {
        setScheduleData(response.data.data);
        setIsScheduled(true);
      }
    } catch (error) {
      console.error(error);
    }
  }, [request._id]);

  const sendTransactionOTP = async (buyeremail, productid) => {
    if (!hasProduct) return;
    setIsLoadingOTP(true);
    try {
      const api_header = {
        Authorization: `Bearer ${localStorage.getItem("campusrecycletoken")}`,
        "Content-Type": "multipart/form-data",
      };
      const bodyData = {
        buyermail: buyeremail,
        productid: productid
      };
      const response = await apiConnector(
        "POST",
        authroutes.SEND_TRANSACTION_OTP,
        bodyData,
        api_header
      );
      if (response.data.success) {
        setIsScheduled(true);
        setIsLoadingOTP(false);
      }else{
        setIsLoadingOTP(false);
      }
    } catch (error) {
      console.error(error);
      setIsLoadingOTP(false);
    }
  }

  useEffect(() => {
    fetchScheduleData();
  }, [fetchScheduleData]);
  return (
    <>
      <div className="requested-product-item">
        <div className="requested-product-item-img">
          <img src={productImage} alt="" />
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
            {`${new Date(request.requestdate)
              .getDate()
              .toString()
              .padStart(2, "0")}/${new Date(request.requestdate)
              .getMonth()
              .toString()
              .padStart(2, "0")}/${new Date(
              request.requestdate
            ).getFullYear()}`}
          </p>
        </div>
        <div className="requested-product-item-btns">
          {hasProduct && !isScheduled && (
            <button
              className="schedule-btn"
              data-bs-toggle="modal"
              data-bs-target={`#schedule_product_request_modal-${request._id}`}
            >
              Schedule Meet
              {isLoading && (
                <SmallLoader className="product-meet-schedule-spinner" size={13} />
              )}
            </button>
          )}
          {hasProduct && isScheduled && (
            <button
              className="schedule-btn"
              data-bs-toggle="modal"
              data-bs-target={`#schedule_data_view_product_request_modal-${request._id}`}
            >
              Get Schedule Data
              {isLoading && (
                <SmallLoader className="product-meet-schedule-spinner" size={13} />
              )}
            </button>
          )}
          {hasProduct && isScheduled && (
            <button
              className="schedule-btn"
              onClick={() => sendTransactionOTP(request.buyer.email, request.product._id)}
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

      {/* Schedule form starts here */}
      <div
        className="modal fade"
        id={`schedule_product_request_modal-${request._id}`}
        tabIndex="-1"
        aria-labelledby="exampleModalLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="exampleModalLabel">
                Schedule Meet
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
                <form onSubmit={handleScheduleMeet}>
                  <div className="edit-product-form-section">
                    <label>Venue</label>
                    <input
                      type="text"
                      name="venue"
                      value={scheduleFormData.venue}
                      onChange={handleScheduleOnchange}
                    />
                  </div>
                  <div className="edit-product-form-section">
                    <label>Date</label>
                    <input
                      type="date"
                      name="date"
                      value={scheduleFormData.date}
                      onChange={handleScheduleOnchange}
                    />
                  </div>
                  <div className="edit-product-form-section">
                    <label>Time</label>
                    <input
                      type="time"
                      name="time"
                      value={scheduleFormData.time}
                      onChange={handleScheduleOnchange}
                    />
                  </div>
                  <div className="schedule-product-request-form-btn-section">
                    <button
                      type="button"
                      className="edit-product-modal-btn"
                      data-bs-dismiss="modal"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="edit-product-modal-btn"
                      data-bs-dismiss="modal"
                    >
                      Schedule{" "}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Schedule form ends here */}

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
                Schedule Data
              </h5>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              ></button>
            </div>
            <div className="modal-body">
              <div className="schedule-data-view-container">
                <div className="schedule-data-view-component">
                  <h6>Buyer details: </h6>
                  <div className="schedule-data-view-component-content">
                    <div>
                      <b>Name </b>
                      <p>{request.buyer.firstname + request.buyer.lastname} </p>
                    </div>
                    <div>
                      <b>Email </b>
                      <p>{request.buyer.email} </p>
                    </div>
                    <div>
                      <b>Requested on </b>
                      <p>{new Date(request.requestdate).getDate()}-{numToMonthMap.get(new Date(request.requestdate).getMonth()+1)}-{new Date(request.requestdate).getFullYear()}</p>
                    </div>
                  </div>
                </div>
                <div className="schedule-data-view-component">
                  <h6>Meeting details: </h6>
                  <div className="schedule-data-view-component-content">
                    <div>
                      <b>Venue </b>
                      <p>{scheduleData && scheduleData.venue} </p>
                    </div>
                    <div>
                      <b>Date </b>
                      <p>{scheduleData && scheduleData.date} </p>
                    </div>
                    <div>
                      <b>Time </b>
                      <p>{scheduleData && scheduleData.time} </p>
                    </div>
                  </div>
                </div>
                <div className="schedule-data-view-buttons">
                  <button data-bs-dismiss="modal" onClick={handleDeleteSchedule}>Delete</button>
                  <button
                    type="button"
                    data-bs-dismiss="modal"
                    aria-label="Close"
                  >Close</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default ProductrequestListItem;
