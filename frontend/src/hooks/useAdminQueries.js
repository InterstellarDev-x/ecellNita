import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authroutes } from "../apis/apis";
import { apiConnector } from "../utils/Apiconnecter";

const headers = () => ({ Authorization: `Bearer ${localStorage.getItem("campusrecycletoken")}` });

const read = (response, message) => {
  if (!response?.data?.success) throw new Error(response?.data?.message || message);
  return response.data.data;
};

const adminQueryKeys = {
  dashboard: ["admin-dashboard"],
  products: ["admin-products"],
  users: ["admin-users"],
  submissions: ["admin-submissions"],
  settings: ["admin-review-settings"],
  meetingLocations: ["admin-meeting-locations"],
  contentReports: ["admin-content-reports"],
  productReports: ["admin-product-reports"],
  featureRequests: ["admin-feature-requests"],
};

const queryOptions = (queryKey, url, message, enabled = true, staleTime = 60 * 1000) => ({
  queryKey,
  queryFn: async () => read(await apiConnector("GET", url, null, headers()), message),
  enabled,
  staleTime,
});

export const useAdminDashboard = (enabled) => useQuery(queryOptions(adminQueryKeys.dashboard, authroutes.ADMIN_DASHBOARD, "Could not load dashboard data.", enabled));
export const useAdminProducts = (enabled) => useQuery(queryOptions(adminQueryKeys.products, authroutes.ADMIN_PRODUCTS, "Could not load listings.", enabled));
export const useAdminUsers = (enabled) => useQuery(queryOptions(adminQueryKeys.users, authroutes.ADMIN_USERS, "Could not load people.", enabled));
export const useAdminSubmissions = (enabled) => useQuery(queryOptions(adminQueryKeys.submissions, authroutes.ADMIN_SUBMISSIONS, "Could not load submissions.", enabled));
export const useAdminSettings = (enabled = true) => useQuery(queryOptions(adminQueryKeys.settings, authroutes.ADMIN_SETTINGS, "Could not load review settings.", enabled, 5 * 60 * 1000));
export const useAdminMeetingLocations = (enabled) => useQuery(queryOptions(adminQueryKeys.meetingLocations, authroutes.ADMIN_MEETING_LOCATIONS, "Could not load meeting locations.", enabled));
export const useAdminContentReports = (enabled) => useQuery(queryOptions(adminQueryKeys.contentReports, authroutes.ADMIN_CONTENT_REPORTS, "Could not load content reports.", enabled));
export const useAdminProductReports = (enabled) => useQuery(queryOptions(adminQueryKeys.productReports, authroutes.ADMIN_PRODUCT_REPORTS, "Could not load product reports.", enabled));
export const useAdminFeatureRequests = (enabled) => useQuery(queryOptions(adminQueryKeys.featureRequests, authroutes.ADMIN_FEATURE_REQUESTS, "Could not load feature requests.", enabled));

export function useUpdateAdminSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (mode) => read(await apiConnector("PUT", authroutes.ADMIN_SETTINGS, { mode }, headers()), "Could not update review mode."),
    onSuccess: (settings) => queryClient.setQueryData(adminQueryKeys.settings, settings),
  });
}

export function useReviewAdminSubmission() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ submissionId, decision }) => read(await apiConnector("POST", `${authroutes.ADMIN_SUBMISSIONS}/${submissionId}/review`, {
      decision,
      reasonCodes: decision === "rejected" ? ["admin_policy_decision"] : [],
      sellerMessage: decision === "approved" ? "Your listing has been approved." : "Your listing does not meet marketplace policy.",
    }, headers()), "Could not save review decision."),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: adminQueryKeys.dashboard }),
        queryClient.invalidateQueries({ queryKey: adminQueryKeys.products }),
        queryClient.invalidateQueries({ queryKey: adminQueryKeys.submissions }),
      ]);
    },
  });
}

export function useUpdateAdminUserStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, accountStatus }) => read(await apiConnector("PATCH", `${authroutes.ADMIN_USERS}/${userId}/status`, { accountStatus }, headers()), "Could not update account status."),
    onSuccess: (_, { userId, accountStatus }) => {
      queryClient.setQueryData(adminQueryKeys.users, (users = []) => users.map((user) => (
        user._id === userId ? { ...user, accountStatus } : user
      )));
    },
  });
}

export function useSaveMeetingLocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ locationId, values }) => read(await apiConnector(locationId ? "PATCH" : "POST", locationId ? `${authroutes.ADMIN_MEETING_LOCATIONS}/${locationId}` : authroutes.ADMIN_MEETING_LOCATIONS, values, headers()), "Could not save meeting location."),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminQueryKeys.meetingLocations }),
  });
}

export function useDeactivateMeetingLocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (locationId) => read(await apiConnector("DELETE", `${authroutes.ADMIN_MEETING_LOCATIONS}/${locationId}`, null, headers()), "Could not deactivate meeting location."),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminQueryKeys.meetingLocations }),
  });
}

export function useReviewContentReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ reportId, resolution }) => read(await apiConnector("POST", `${authroutes.ADMIN_CONTENT_REPORTS}/${reportId}/review`, { resolution }, headers()), "Could not review report."),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminQueryKeys.contentReports }),
  });
}

export function useReviewProductReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ reportId, resolution, hideProduct = false }) => read(
      await apiConnector("POST", `${authroutes.ADMIN_PRODUCT_REPORTS}/${reportId}/review`, { resolution, hideProduct }, headers()),
      "Could not review product report."
    ),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: adminQueryKeys.productReports }),
        queryClient.invalidateQueries({ queryKey: adminQueryKeys.products }),
      ]);
    },
  });
}
