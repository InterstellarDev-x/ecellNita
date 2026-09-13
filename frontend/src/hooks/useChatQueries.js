import { useInfiniteQuery, useMutation, useQuery } from "@tanstack/react-query";
import { authroutes } from "../apis/apis";
import { apiConnector } from "../utils/Apiconnecter";
const headers = () => ({ Authorization: `Bearer ${localStorage.getItem("campusrecycletoken")}` });
export const chatUserId = () => { try { return JSON.parse(localStorage.getItem("campusrecycleuser"))?._id || "anonymous"; } catch { return "anonymous"; } };
const read = (res) => { if (!res.data?.success) throw new Error(res.data?.message || "Could not load chat"); return res.data.data; };
export function useChats(audience) {
  return useQuery({
    queryKey: ["chats", chatUserId(), audience],
    queryFn: async () => {
      if (audience !== "all") return read(await apiConnector("GET", `${authroutes.CHATS}?audience=${audience}`, null, headers()));
      const results = await Promise.allSettled([
        apiConnector("GET", `${authroutes.CHATS}?audience=buyer`, null, headers()),
        apiConnector("GET", `${authroutes.CHATS}?audience=seller`, null, headers()),
      ]);
      const conversations = results.flatMap((result) => result.status === "fulfilled" ? read(result.value) : []);
      if (!conversations.length && results.every((result) => result.status === "rejected")) throw results[0].reason;
      return [...new Map(conversations.map((thread) => [thread._id, thread])).values()]
        .sort((left, right) => new Date(right.lastMessageAt || right.updatedAt || 0) - new Date(left.lastMessageAt || left.updatedAt || 0));
    },
  });
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

export function useUploadChatImage() {
  return useMutation({
    mutationFn: async ({ threadId, file, body = "" }) => {
      const form = new FormData();
      form.append("image", file, file.name);
      form.append("clientId", crypto.randomUUID());
      if (body) form.append("body", body);
      return read(await apiConnector("POST", `${authroutes.CHATS}/${threadId}/images`, form, headers()));
    },
  });
}
