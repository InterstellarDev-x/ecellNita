import React, { useRef, useState } from "react";
import { Trash2, Flag, CalendarDays, UserRound } from "lucide-react";
import { apiConnector } from "../../../utils/Apiconnecter";
import { authroutes } from "../../../apis/apis";
import SmallLoader from "../../CommonInterface/SmallLoader/SmallLoader";
import { useDeleteRequestSchedule, useRequestSchedule } from "../../../hooks/useBuyerQueries";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

function ProductRequestElim({ request, handleDeleteProductRequest }) {
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

  const { data: scheduleData } = useRequestSchedule(request?._id);
  const deleteSchedule = useDeleteRequestSchedule();
  const queryClient = useQueryClient();
  const isScheduled = Boolean(scheduleData);
  const isLoading = deleteSchedule.isPending;
  const requestedOn = new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(request.requestdate));


  const [otp, setOtp] = useState(new Array(6).fill(""));
  const [otpError, setOtpError] = useState(null);
  const otpBoxReference = useRef([]);
  const otpTabCloseBtn = useRef(null);

  function handleChange(value, index) {
    const digit = String(value).replace(/\D/g, "").slice(-1);
    let newArr = [...otp];
    newArr[index] = digit;
    setOtp(newArr);

    if (digit && index < 6 - 1) {
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



  const handleDeleteSchedule = async () => {
    try {
      await deleteSchedule.mutateAsync(request._id);
    } catch (error) {
      console.error(error);
    }
  };

  const submitCompleteOTP = async () => {
    if (!hasProduct) return;
    try {
      const api_header = {
        Authorization: `Bearer ${localStorage.getItem("campusrecycletoken")}`,
        "Content-Type": "multipart/form-data",
      };
      const bodyData = {
        requestid: request._id,
        otp: otp.join('')
      };
      
      const response = await apiConnector(
        "POST",
        authroutes.VERIFY_TRANSACTION_OTP,
        bodyData,
        api_header
      );
      if (response.data.success) {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ["buyer-requests"] }),
          queryClient.invalidateQueries({ queryKey: ["marketplace-products"] }),
          queryClient.invalidateQueries({ queryKey: ["marketplace-product", request.product._id] }),
        ]);
        toast.success("Transaction completed successfully");
        otpTabCloseBtn.current.click();
        setOtp(new Array(6).fill(""));
        setOtpError(null);
      }else{
        setOtpError(response.data.message || "Could not verify this OTP");
      }
    } catch (error) {
      setOtpError(error?.response?.data?.message || "Could not verify this OTP");
    }
  };

  const [reportBody, setReportBody] = useState("");
  const [reportReason, setReportReason] = useState("");
  const [reportError, setReportError] = useState("");
  const [isReporting, setIsReporting] = useState(false);
  const reportTabCloseBtn = useRef(null);
  const submitProductReport = async () => {
    if (!hasProduct || !reportReason || reportBody.trim().length < 10) {
      setReportError("Select a reason and provide at least 10 characters of detail.");
      return;
    }
    setIsReporting(true);
    setReportError("");
    try {
      const response = await apiConnector("POST", authroutes.PRODUCT_REPORTS, {
        productid: request.product._id,
        reason: reportReason,
        details: reportBody.trim(),
      }, { Authorization: `Bearer ${localStorage.getItem("campusrecycletoken")}` });
      if (!response.data.success) throw new Error(response.data.message);
      toast.success("Report submitted for review");
      setReportBody("");
      setReportReason("");
      reportTabCloseBtn.current?.click();
    } catch (error) {
      setReportError(error?.response?.data?.message || error.message || "Could not submit the report.");
    } finally {
      setIsReporting(false);
    }
  };

  return (
    <>
      <div className="requested-product-item">
        <div className="requested-product-item-img">
          <img src={productImage} alt="" />
          <div className="product-info">
            <span className={`request-status-badge${isScheduled ? " request-status-badge--scheduled" : ""}`}>
              {isScheduled ? "Meeting scheduled" : "Awaiting seller"}
            </span>
            <b>{request.product?.productname || "Product no longer available"}</b>
            <p>{request.product?.productdescription || "This product was deleted by the seller."}</p>
            {hasProduct && <strong className="requested-product-price">&#8377; {request.product.price}</strong>}
          </div>
        </div>
        <div className="requested-product-item-status">
          <p><UserRound size={15} /><span><b>Seller</b>{isScheduled ? `${request.seller?.firstname || "Seller"} ${request.seller?.lastname || ""}` : "Seller"}<small>{isScheduled ? request.seller?.email : "Identity is shared after a meeting is scheduled."}</small></span></p>
          <p><CalendarDays size={15} /><span><b>Requested</b>{requestedOn}</span></p>
        </div>
        <div className="requested-product-item-btns">
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
              data-bs-toggle="modal"
              data-bs-target={`#schedule_data_complete_request_modal-${request._id}`}
            >
              Complete
            </button>
          )}
          {hasProduct && isScheduled && (
            <button
              className="delete-btn"
              aria-label={`Report ${request.product.productname}`}
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
                        {(request.seller?.firstname || "Seller") + " " + (request.seller?.lastname || "")}
                      </p>
                    </div>
                    <div>
                      <b>Email </b>
                      <p>{request.seller?.email || "Available after a meeting is scheduled"} </p>
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
                      <p>{scheduleData?.locationSnapshot?.name || scheduleData?.venue} {scheduleData?.locationSnapshot?.address ? `· ${scheduleData.locationSnapshot.address}` : ""}</p>
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
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    aria-label={`OTP digit ${index + 1}`}
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
                <button onClick={submitCompleteOTP} disabled={otp.some((digit) => !digit)}>Submit</button>
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
                ref={reportTabCloseBtn}
              ></button>
            </div>
            <div className="modal-body">
              <div className="report-container">
                <label htmlFor={`product-report-reason-${request._id}`}>Reason</label>
                <select
                  id={`product-report-reason-${request._id}`}
                  value={reportReason}
                  onChange={(e) => { setReportReason(e.target.value); setReportError(""); }}
                >
                  <option value="">Select a reason</option>
                  <option value="misleading">Misleading listing</option>
                  <option value="prohibited">Prohibited item</option>
                  <option value="condition">Condition differs from listing</option>
                  <option value="safety">Safety concern</option>
                  <option value="other">Other</option>
                </select>
                <label htmlFor={`product-report-${request._id}`}>Details</label>
                <textarea
                  name="product-report"
                  id={`product-report-${request._id}`}
                  rows={5}
                  cols={55}
                  minLength={10}
                  maxLength={1000}
                  value={reportBody}
                  onChange={(e) => { setReportBody(e.target.value); setReportError(""); }}
                  placeholder="Explain what is wrong with this listing…"
                ></textarea>
                {reportError && <p role="alert">{reportError}</p>}
              </div>
              <div className="complete-transaction-footer">
                <button onClick={submitProductReport} disabled={isReporting}>{isReporting ? "Submitting…" : "Report"}</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default ProductRequestElim;
