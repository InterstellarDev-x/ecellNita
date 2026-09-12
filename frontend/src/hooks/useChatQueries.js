import { useInfiniteQuery, useMutation, useQuery } from "@tanstack/react-query";
import { authroutes } from "../apis/apis";
import { apiConnector } from "../utils/Apiconnecter";
const headers = () => ({ Authorization: `Bearer ${localStorage.getItem("campusrecycletoken")}` });
export const chatUserId = () => { try { return JSON.parse(localStorage.getItem("campusrecycleuser"))?._id || "anonymous"; } catch { return "anonymous"; } };
const read = (res) => { if (!res.data?.success) throw new Error(res.data?.message || "Could not load chat"); return res.data.data; };
export function useChats(audience) {
  return useQuery({ queryKey: ["chats", chatUserId(), audience], queryFn: async () => read(await apiConnector("GET", `${authroutes.CHATS}?audience=${audience}`, null, headers())) });
}
export function useChatMessages(threadId) {
  return useInfiniteQuery({ queryKey: ["chat-messages", chatUserId(), threadId], enabled: Boolean(threadId), initialPageParam: null,
    queryFn: async ({ pageParam }) => read(await apiConnector("GET", `${authroutes.CHATS}/${threadId}/messages${pageParam ? `?before=${pageParam}` : ""}`, null, headers())),
    getNextPageParam: (page) => page.nextCursor || undefined });
}
export function useStartChat() {
  return useMutation({ mutationFn: async (productid) => read(await apiConnector("POST", authroutes.CHATS, { productid }, headers())) });
}

export function useChatThread(threadId, enabled) {
  return useQuery({ queryKey: ["chats", chatUserId(), "detail", threadId], enabled: Boolean(threadId && enabled),
    queryFn: async () => read(await apiConnector("GET", `${authroutes.CHATS}/${threadId}`, null, headers())) });
}
export function useContinueChat() {
  return useMutation({ mutationFn: async (questionId) => read(await apiConnector("POST", `${authroutes.CHATS}/from-question`, { questionId }, headers())) });
}
