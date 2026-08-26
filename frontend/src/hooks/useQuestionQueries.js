import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authroutes } from "../apis/apis";
import { apiConnector } from "../utils/Apiconnecter";

const headers = () => ({ Authorization: `Bearer ${localStorage.getItem("campusrecycletoken")}` });

const read = (response, fallback) => {
  if (!response?.data?.success) throw new Error(response?.data?.message || fallback);
  return response.data.data;
};

const questionKeys = {
  buyer: ["private-product-questions", "buyer"],
  seller: ["private-product-questions", "seller"],
  notifications: ["in-app-notifications"],
};

export function useBuyerQuestions(enabled = true) {
  return useQuery({
    queryKey: questionKeys.buyer,
    queryFn: async () => read(await apiConnector("GET", `${authroutes.QUESTIONS}/buyer`, null, headers()), "Could not load your questions."),
    staleTime: 30 * 1000,
    enabled,
  });
}

export function useSellerQuestions(enabled = true) {
  return useQuery({
    queryKey: questionKeys.seller,
    queryFn: async () => read(await apiConnector("GET", `${authroutes.QUESTIONS}/seller`, null, headers()), "Could not load buyer questions."),
    staleTime: 30 * 1000,
    enabled,
  });
}

export function useCreateProductQuestion() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async ({ productid, question }) => read(await apiConnector("POST", authroutes.QUESTIONS, { productid, question }, headers()), "Could not send your question."),
    onSuccess: () => client.invalidateQueries({ queryKey: questionKeys.buyer }),
  });
}

export function useAnswerProductQuestion() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async ({ questionId, answer }) => read(await apiConnector("POST", `${authroutes.QUESTIONS}/${questionId}/answer`, { answer }, headers()), "Could not send the reply."),
    onSuccess: () => client.invalidateQueries({ queryKey: questionKeys.seller }),
  });
}

export function useDeleteProductQuestion() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (questionId) => read(await apiConnector("DELETE", `${authroutes.QUESTIONS}/${questionId}`, null, headers()), "Could not unsend the question."),
    onSuccess: () => Promise.all([
      client.invalidateQueries({ queryKey: questionKeys.buyer }),
      client.invalidateQueries({ queryKey: questionKeys.seller }),
      client.invalidateQueries({ queryKey: questionKeys.notifications }),
    ]),
  });
}

export function useReportProductQuestion() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async ({ questionId, targetType, reason }) => read(await apiConnector("POST", `${authroutes.QUESTIONS}/${questionId}/report`, { targetType, reason }, headers()), "Could not report this message."),
    onSuccess: () => Promise.all([
      client.invalidateQueries({ queryKey: questionKeys.buyer }),
      client.invalidateQueries({ queryKey: questionKeys.seller }),
    ]),
  });
}

export function useNotifications() {
  return useQuery({
    queryKey: questionKeys.notifications,
    queryFn: async () => read(await apiConnector("GET", authroutes.NOTIFICATIONS, null, headers()), "Could not load notifications."),
    staleTime: 20 * 1000,
    refetchInterval: 45 * 1000,
  });
}

export function useMarkNotificationRead() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (notificationId) => read(await apiConnector("PATCH", `${authroutes.NOTIFICATIONS}/${notificationId}/read`, {}, headers()), "Could not update notification."),
    onSuccess: () => client.invalidateQueries({ queryKey: questionKeys.notifications }),
  });
}

export function useMarkAllNotificationsRead() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async () => read(await apiConnector("PATCH", `${authroutes.NOTIFICATIONS}/read-all`, {}, headers()), "Could not update notifications."),
    onSuccess: () => client.invalidateQueries({ queryKey: questionKeys.notifications }),
  });
}
