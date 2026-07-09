const BASE_URL = process.env.REACT_APP_BASE_URL;
//user routes apis
export const authroutes={
    LOGIN_API:BASE_URL+"/auth/login",
    SEND_OTP_API:BASE_URL+"/auth/sendotp",
    SIGNUP_API:BASE_URL+"/auth/signup",
    FORGOT_PASSWORD_TOKEN_REQUEST:BASE_URL+"/auth/forgotpasswordtoken",
    RESET_PASSWORD:BASE_URL+"/auth/forgotpassword",
    ADD_PRODUCT:BASE_URL+"/product/createproduct",
    GET_PRODUCT_DETAILS:BASE_URL+"/product/getproductpagedetails",
    EDIT_PRODUCT:BASE_URL+"/product/updateproduct",
    DELETE_PRODUCT:BASE_URL+"/product/deleteproduct",
    PRODUCT_REQUEST:BASE_URL+"/conversation/productrequest",
    GET_ALL_PRODUCT_REQUESTS:BASE_URL+"/conversation/all_received_request",
    DELETE_PRODUCT_REQUEST:BASE_URL+"/conversation/deleterequest",
    SCHEDULE_MEET:BASE_URL+"/conversation/shedulemeet",
    GET_SCHEDULE_DATA:BASE_URL+"/conversation/get_shedule_data",
    DELETE_SCHEDULED_MEET:BASE_URL+"/conversation/delete_shedule_data",
    GET_ALL_SENT_PRODUCT_REQUESTS:BASE_URL+"/conversation/all_send_request",
    SEND_TRANSACTION_OTP:BASE_URL+"/transaction/sendtransotp",
    VERIFY_TRANSACTION_OTP:BASE_URL+"/transaction/verifytransotp",
    GET_ALL_CATEGORIES:BASE_URL+"/category/getcategories",
    UPDATE_USER:BASE_URL+"/user/updateuser",
    UPDATE_PROFILE:BASE_URL+"/user/updateprofile"
}