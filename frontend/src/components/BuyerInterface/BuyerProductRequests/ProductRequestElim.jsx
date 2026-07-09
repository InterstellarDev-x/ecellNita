import React, { useEffect, useRef, useState } from "react";
import { Trash2, Flag } from "lucide-react";
import { apiConnector } from "../../../utils/Apiconnecter";
import { authroutes } from "../../../apis/apis";
import Spinner from "react-bootstrap/Spinner";

function ProductRequestElim({ request, handleDeleteProductRequest }) {
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
  const [scheduleData, setScheduleData] = useState(null);
  const [scheduleFormData, setScheduleFormData] = useState({
    venue: "",
    time: "",
    date: "",
  });

  const [otp, setOtp] = useState(new Array(6).fill(""));
  const [otpError, setOtpError] = useState(null);
  const otpBoxReference = useRef([]);
  const otpTabCloseBtn = useRef(null);

  function handleChange(value, index) {
    let newArr = [...otp];
    newArr[index] = value;
    setOtp(newArr);

    if (value && index < 6 - 1) {
      otpBoxReference.current[index + 1].focus();
    }
  }

  function handleBackspaceAndEnter(e, index) {
    if (e.key === "Backspace" && !e.target.value && index > 0) {
      otpBoxReference.current[index - 1].focus();
    }
    if (e.key === "Enter" && e.target.value && index < 6 - 1) {
      otpBoxReference.current[index + 1].focus();
    }
  }

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
      } else {
        setIsLoading(false);
      }
    } catch (error) {
      console.log(error);
      setIsLoading(false);
    }
  };

  const handleDeleteSchedule = async () => {
    setIsLoading(true);
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
        authroutes.DELETE_SCHEDULED_MEET,
        bodyData,
        api_header
      );
      console.log(response.data);
      if (response.data.success) {
        console.log("Scheduled meeting deleted successfully");
        setIsScheduled(false);
        setIsLoading(false);
      } else {
        setIsLoading(false);
      }
    } catch (error) {
      console.log(error);
      setIsLoading(false);
    }
  };

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

  const submitCompleteOTP = async () => {
    try {
      const api_header = {
        Authorization: `Bearer ${localStorage.getItem("campusrecycletoken")}`,
        "Content-Type": "multipart/form-data",
      };
      const bodyData = {
        buyermail: request.buyer.email,
        productid: request.product._id,
        otp: otp.join('')
      };
      
      const response = await apiConnector(
        "POST",
        authroutes.VERIFY_TRANSACTION_OTP,
        bodyData,
        api_header
      );
      console.log(response.data);
      if (response.data.success) {
        console.log("OTP Matched!!!");
        handleDeleteProductRequest(request._id);
        otpTabCloseBtn.current.click();
      }else{
        setOtpError("Wrong OTP! Please enter the correct one");
      }
    } catch (error) {
      console.log(error);
    }
  };

  const [reportBody, setReportBody] = useState("");
  const submitProductReport = () => {
    console.log(reportBody);
  };

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
            <b>Seller name: </b>
            {request.seller.firstname} {request.seller.lastname}
          </p>
          <p>
            <b>Seller email: </b>
            {request.seller.email}
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
              data-bs-toggle="modal"
              data-bs-target={`#schedule_data_complete_request_modal-${request._id}`}
            >
              Complete
            </button>
          )}
          {isScheduled && (
            <button
              className="delete-btn"
              data-bs-toggle="modal"
              data-bs-target={`#schedule_data_report_product_modal-${request._id}`}
            >
              <Flag />
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
                  <h6>Seller details: </h6>
                  <div className="schedule-data-view-component-content">
                    <div>
                      <b>Name </b>
                      <p>
                        {request.seller.firstname + request.seller.lastname}{" "}
                      </p>
                    </div>
                    <div>
                      <b>Email </b>
                      <p>{request.seller.email} </p>
                    </div>
                    <div>
                      <b>Requested on </b>
                      <p>{new Date(request.requestdate).getDate()}-{numToMonthMap.get(new Date(request.requestdate).getMonth()+1)}-{new Date(request.requestdate).getFullYear()} </p>
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
                  <button
                    data-bs-dismiss="modal"
                    onClick={handleDeleteSchedule}
                  >
                    Delete
                  </button>
                  <button
                    type="button"
                    data-bs-dismiss="modal"
                    aria-label="Close"
                    style={{ backgroundColor: 'black' }}
                  >Close</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Complete Transaction Modal Starts here */}
      <div
        className="modal fade"
        id={`schedule_data_complete_request_modal-${request._id}`}
        tabIndex="-1"
        aria-labelledby="exampleModalLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="exampleModalLabel">
                Complete Transaction
              </h5>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
                ref={otpTabCloseBtn}
              ></button>
            </div>
            <div className="modal-body">
              <div className="complete-transaction-container">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    value={digit}
                    maxLength={1}
                    onChange={(e) => handleChange(e.target.value, index)}
                    onKeyUp={(e) => handleBackspaceAndEnter(e, index)}
                    ref={(reference) =>
                      (otpBoxReference.current[index] = reference)
                    }
                    className="otp-input"
                    type="number"
                  />
                ))}
                {/* {otp.map((digit, index) => (
                  <input
                    key={index}
                    value={0}
                    maxLength={1}
                    className="otp-input"
                    type="password"
                  />
                ))} */}
              </div>
              <div className="complete-transaction-footer-err-box">
                {otpError}
              </div>
              <div className="complete-transaction-footer">
                <button onClick={submitCompleteOTP}>Submit</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Report Product Modal starts here */}
      <div
        className="modal fade"
        id={`schedule_data_report_product_modal-${request._id}`}
        tabIndex="-1"
        aria-labelledby="exampleModalLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="exampleModalLabel">
                Report Product
              </h5>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              ></button>
            </div>
            <div className="modal-body">
              <div className="report-container">
                <textarea
                  name="product-report"
                  id="product-report"
                  rows={5}
                  cols={55}
                  value={reportBody}
                  onChange={(e) => setReportBody(e.target.value)}
                ></textarea>
              </div>
              <div className="complete-transaction-footer">
                <button onClick={submitProductReport}>Report</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default ProductRequestElim;
