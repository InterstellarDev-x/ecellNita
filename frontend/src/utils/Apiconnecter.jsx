import axios from "axios";

export const axiosInstance = axios.create({});

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const data = error?.response?.data;
    if (
      status === 401 ||
      (data && data.success === false &&
        typeof data.message === "string" &&
        data.message.toLowerCase().includes("invalid token"))
    ) {
      localStorage.removeItem("campusrecycletoken");
      localStorage.removeItem("campusrecycleuser");
      window.location.href = "/student-login";
    }
    return Promise.reject(error);
  }
);

export const apiConnector = (method, url, bodyData, headers, params) => {
  return axiosInstance({
    method: `${method}`,
    url: `${url}`,
    data: bodyData ? bodyData : null,
    headers: headers ? headers : null,
    params: params ? params : null,
  });
};
