import React, { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { apiConnector } from "../../../utils/Apiconnecter";
import { authroutes } from "../../../apis/apis";
import Spinner from "react-bootstrap/Spinner";

function ProductrequestListItem({ request, handleDeleteProductRequest }) {
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
      console.log(response.data);
      if (response.data.success) {
        console.log("Meeting Scheduled successfully");
        setIsScheduled(true);
        setIsLoading(false);
      }else{
        setIsLoading(false);
      }
    } catch (error) {
      console.log(error);
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
      console.log(response.data);
      if (response.data.success) {
        console.log("Scheduled meeting deleted successfully");
        setIsScheduled(false);
        setIsLoading(false);
      }else{
        setIsLoading(false);
      }
    } catch (error) {
      console.log(error);
      setIsLoading(false);
    }
  }

  const fetchScheduleData = async () => {
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
      console.log(response.data);
      if (response.data.success) {
        console.log("Meeting is already scheduled");
        setScheduleData(response.data.data);
        setIsScheduled(true);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const sendTransactionOTP = async (buyeremail, productid) => {
    setIsLoadingOTP(true);
    console.log('OTP Details: ', buyeremail, productid);
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
      console.log(response.data);
      if (response.data.success) {
        console.log("OTP sent successfully");
        setIsScheduled(true);
        setIsLoadingOTP(false);
      }else{
        setIsLoadingOTP(false);
      }
    } catch (error) {
      console.log(error);
      setIsLoadingOTP(false);
    }
  }

  useEffect(() => {
    fetchScheduleData();
  }, []);
  return (
    <>
      {/* <div className="item-badge-product-request">
        Scheduled
      </div> */}
      <div className="requested-product-item">
        <div className="requested-product-item-img">
          <img src={request.product.images[0]} alt="" />
          <div className="product-info">
            <b>{request.product.productname}</b>
            <p>{request.product.productdescription}</p>
            <b>&#8377; {request.product.price}</b>
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
          {!isScheduled && (
            <button
              className="schedule-btn"
              data-bs-toggle="modal"
              data-bs-target={`#schedule_product_request_modal-${request._id}`}
            >
              Schedule Meet
              {isLoading && (
                <Spinner className="product-meet-schedule-spinner" />
              )}
            </button>
          )}
          {isScheduled && (
            <button
              className="schedule-btn"
              data-bs-toggle="modal"
              data-bs-target={`#schedule_data_view_product_request_modal-${request._id}`}
            >
              Get Schedule Data
              {isLoading && (
                <Spinner className="product-meet-schedule-spinner" />
              )}
            </button>
          )}
          {isScheduled && (
            <button
              className="schedule-btn"
              onClick={() => sendTransactionOTP(request.buyer.email, request.product._id)}
              style={{ minWidth: '150px' }}
            >
              Send OTP
              {isLoadingOTP && (
                <Spinner className="product-meet-schedule-spinner" />
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
