import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authroutes } from "../apis/apis";
import { apiConnector } from "../utils/Apiconnecter";

const headers = () => ({ Authorization: `Bearer ${localStorage.getItem("campusrecycletoken")}` });

const read = (response, message) => {
  if (!response?.data?.success) throw new Error(response?.data?.message || message);
  return response.data.data;
};

export const adminQueryKeys = {
  dashboard: ["admin-dashboard"],
  products: ["admin-products"],
  users: ["admin-users"],
  submissions: ["admin-submissions"],
  settings: ["admin-review-settings"],
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
export const useAdminSettings = () => useQuery(queryOptions(adminQueryKeys.settings, authroutes.ADMIN_SETTINGS, "Could not load review settings.", true, 5 * 60 * 1000));

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
