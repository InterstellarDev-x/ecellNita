const BASE_URL = process.env.REACT_APP_BASE_URL || "http://localhost:4000/api/v1";
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
    GET_ALL_PRODUCTS:BASE_URL+"/product/getallproduct",
    DELETE_PRODUCT_REQUEST:BASE_URL+"/conversation/deleterequest",
    SCHEDULE_MEET:BASE_URL+"/conversation/shedulemeet",
    GET_SCHEDULE_DATA:BASE_URL+"/conversation/get_shedule_data",
    DELETE_SCHEDULED_MEET:BASE_URL+"/conversation/delete_shedule_data",
    GET_ALL_SENT_PRODUCT_REQUESTS:BASE_URL+"/conversation/all_send_request",
    SEND_TRANSACTION_OTP:BASE_URL+"/transaction/sendtransotp",
    VERIFY_TRANSACTION_OTP:BASE_URL+"/transaction/verifytransotp",
    GET_ALL_CATEGORIES:BASE_URL+"/category/getcategories",
    UPDATE_USER:BASE_URL+"/user/updateuser",
    UPDATE_PROFILE:BASE_URL+"/user/updateprofile",
    GET_WISHLIST:BASE_URL+"/wishlist",
    ADD_TO_WISHLIST:BASE_URL+"/wishlist",
    REMOVE_FROM_WISHLIST:BASE_URL+"/wishlist"
    ,ADMIN_DASHBOARD:BASE_URL+"/admin/dashboard"
    ,ADMIN_PRODUCTS:BASE_URL+"/admin/products"
    ,ADMIN_USERS:BASE_URL+"/admin/users"
    ,ADMIN_SUBMISSIONS:BASE_URL+"/admin/submissions"
    ,ADMIN_SETTINGS:BASE_URL+"/admin/settings"
}
