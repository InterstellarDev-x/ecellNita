import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authroutes } from "../apis/apis";
import { apiConnector } from "../utils/Apiconnecter";

const headers = () => ({ Authorization: `Bearer ${localStorage.getItem("campusrecycletoken")}` });
const read = (response, fallback) => {
  if (!response?.data?.success) throw new Error(response?.data?.message || fallback);
  return response.data.data;
};
const explain = (error, fallback) => new Error(error?.response?.data?.message || error?.message || fallback);

export const reputationKeys = {
  context: (transactionId) => ["transaction-review-context", transactionId],
  user: (userId) => ["user-reputation", userId],
  notifications: ["in-app-notifications"],
};

export function useReviewContext(transactionId) {
  return useQuery({
    queryKey: reputationKeys.context(transactionId),
    queryFn: async () => {
      try {
        return read(await apiConnector("GET", `${authroutes.TRANSACTIONS}/${transactionId}/review-context`, null, headers()), "Could not load this review request.");
      } catch (error) {
        throw explain(error, "Could not load this review request.");
      }
    },
    enabled: Boolean(transactionId),
    staleTime: 30 * 1000,
  });
}

export function useSubmitTransactionReview() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async ({ transactionId, rating, comment, tags }) => {
      try {
        return read(await apiConnector("POST", `${authroutes.TRANSACTIONS}/${transactionId}/reviews`, { rating, comment, tags }, headers()), "Could not save your review.");
      } catch (error) {
        throw explain(error, "Could not save your review.");
      }
    },
    onSuccess: () => Promise.all([
      client.invalidateQueries({ queryKey: reputationKeys.notifications }),
      client.invalidateQueries({ queryKey: ["user-reputation"] }),
      client.invalidateQueries({ queryKey: ["marketplace-product"] }),
      client.invalidateQueries({ queryKey: ["marketplace-products"] }),
    ]),
  });
}

export function useUserReputation(userId = "me") {
  return useQuery({
    queryKey: reputationKeys.user(userId),
    queryFn: async () => {
      try {
        return read(await apiConnector("GET", `${authroutes.TRANSACTIONS}/reputation/${userId}`, null, headers()), "Could not load reputation.");
      } catch (error) {
        throw explain(error, "Could not load reputation.");
      }
    },
    staleTime: 60 * 1000,
  });
}
