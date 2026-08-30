import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authroutes } from "../apis/apis";
import { apiConnector } from "../utils/Apiconnecter";

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("campusrecycletoken")}`,
});

const userScope = () => {
  try {
    const user = JSON.parse(localStorage.getItem("campusrecycleuser"));
    return user?._id || user?.email || "anonymous";
  } catch {
    return "anonymous";
  }
};

const requireSuccess = (response, fallbackMessage) => {
  if (!response?.data?.success) throw new Error(response?.data?.message || fallbackMessage);
  return response.data.data;
};

const buyerQueryKeys = {
  products: ["marketplace-products"],
  categories: ["marketplace-categories"],
  wishlist: (user) => ["wishlist", user],
  requests: (user) => ["buyer-requests", user],
  product: (productId) => ["marketplace-product", productId],
  schedule: (requestId) => ["buyer-request-schedule", requestId],
  meetingLocations: ["active-meeting-locations"],
};

const fetchProducts = async ({ pageParam = 1, filters = {} }) => requireSuccess(
  await apiConnector("POST", authroutes.GET_ALL_PRODUCTS, { page: pageParam, limit: 12, ...filters }, authHeaders()),
  "Could not load products."
);

const fetchCategories = async () => requireSuccess(
  await apiConnector("POST", authroutes.GET_ALL_CATEGORIES, {}, authHeaders()),
  "Could not load categories."
);

const fetchWishlist = async () => requireSuccess(
  await apiConnector("GET", authroutes.GET_WISHLIST, null, authHeaders()),
  "Could not load wishlist."
);

const fetchRequests = async () => requireSuccess(
  await apiConnector("POST", authroutes.GET_ALL_SENT_PRODUCT_REQUESTS, {}, authHeaders()),
  "Could not load requests."
);

const fetchProduct = async (productId) => requireSuccess(
  await apiConnector("POST", authroutes.GET_PRODUCT_DETAILS, { productid: productId }, authHeaders()),
  "Could not load this product."
);

const fetchSchedule = async (requestId) => {
  const response = await apiConnector("POST", authroutes.GET_SCHEDULE_DATA, { requestid: requestId }, authHeaders());
  return response?.data?.success ? response.data.data : null;
};

const fetchMeetingLocations = async () => requireSuccess(
  await apiConnector("GET", authroutes.MEETING_LOCATIONS, null, authHeaders()),
  "Could not load meeting locations."
);

export function useMarketplaceProducts(filters = {}) {
  return useInfiniteQuery({
    queryKey: [...buyerQueryKeys.products, filters],
    queryFn: ({ pageParam }) => fetchProducts({ pageParam, filters }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage?.hasNextPage ? lastPage.page + 1 : undefined,
    staleTime: 2 * 60 * 1000,
  });
}

export function useMarketplaceCategories() {
  return useQuery({ queryKey: buyerQueryKeys.categories, queryFn: fetchCategories, staleTime: 30 * 60 * 1000 });
}

export function useWishlist() {
  const scope = userScope();
  return useQuery({ queryKey: buyerQueryKeys.wishlist(scope), queryFn: fetchWishlist, staleTime: 2 * 60 * 1000, enabled: scope !== "anonymous" });
}

export function useBuyerRequests() {
  const scope = userScope();
  return useQuery({ queryKey: buyerQueryKeys.requests(scope), queryFn: fetchRequests, staleTime: 45 * 1000, enabled: scope !== "anonymous" });
}

export function useMarketplaceProduct(productId) {
  return useQuery({ queryKey: buyerQueryKeys.product(productId), queryFn: () => fetchProduct(productId), staleTime: 2 * 60 * 1000, enabled: Boolean(productId) });
}

export function useRequestSchedule(requestId) {
  return useQuery({
    queryKey: buyerQueryKeys.schedule(requestId),
    queryFn: () => fetchSchedule(requestId),
    staleTime: 10 * 1000,
    refetchInterval: 15 * 1000,
    refetchOnWindowFocus: "always",
    enabled: Boolean(requestId),
  });
}

export function useActiveMeetingLocations() {
  return useQuery({ queryKey: buyerQueryKeys.meetingLocations, queryFn: fetchMeetingLocations, staleTime: 2 * 60 * 1000 });
}

export function useToggleWishlist() {
  const queryClient = useQueryClient();
  const scope = userScope();
  const wishlistKey = buyerQueryKeys.wishlist(scope);

  return useMutation({
    mutationFn: async ({ product, isSaved }) => {
      const response = await apiConnector(
        isSaved ? "DELETE" : "POST",
        isSaved ? authroutes.REMOVE_FROM_WISHLIST : authroutes.ADD_TO_WISHLIST,
        { productid: product?._id },
        authHeaders()
      );
      requireSuccess(response, "Could not update wishlist.");
      return { product, isSaved };
    },
    onSuccess: ({ product, isSaved }) => {
      queryClient.setQueryData(wishlistKey, (current = []) => (
        isSaved ? current.filter((item) => item._id !== product._id) : [product, ...current.filter((item) => item._id !== product._id)]
      ));
    },
  });
}

export function useCreateBuyerRequest() {
  const queryClient = useQueryClient();
  const scope = userScope();

  return useMutation({
    mutationFn: async ({ productid, quantity }) => requireSuccess(
      await apiConnector("POST", authroutes.PRODUCT_REQUEST, { productid, quantity }, authHeaders()),
      "Could not request this product."
    ),
    onSuccess: async (_, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: buyerQueryKeys.requests(scope) }),
        queryClient.invalidateQueries({ queryKey: buyerQueryKeys.product(variables.productid) }),
        queryClient.invalidateQueries({ queryKey: buyerQueryKeys.products }),
      ]);
    },
  });
}

export function useDeleteBuyerRequest() {
  const queryClient = useQueryClient();
  const scope = userScope();

  return useMutation({
    mutationFn: async (requestid) => requireSuccess(
      await apiConnector("POST", authroutes.DELETE_PRODUCT_REQUEST, { requestid }, authHeaders()),
      "Could not delete this request."
    ),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: buyerQueryKeys.requests(scope) });
    },
  });
}

export function useDeleteRequestSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (requestid) => requireSuccess(
      await apiConnector("POST", authroutes.DELETE_SCHEDULED_MEET, { requestid }, authHeaders()),
      "Could not delete the schedule."
    ),
    onSuccess: (_, requestid) => queryClient.invalidateQueries({ queryKey: buyerQueryKeys.schedule(requestid) }),
  });
}

export function useProposeRequestSchedule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ requestid, locationId, date, time }) => requireSuccess(
      await apiConnector("POST", authroutes.SCHEDULE_MEET, { requestid, locationId, date, time }, authHeaders()),
      "Could not send the meeting proposal."
    ),
    onSuccess: (schedule, variables) => {
      queryClient.setQueryData(buyerQueryKeys.schedule(variables.requestid), schedule);
    },
  });
}

export function useAcceptRequestSchedule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (requestid) => requireSuccess(
      await apiConnector("POST", authroutes.ACCEPT_MEETING, { requestid }, authHeaders()),
      "Could not confirm the meeting."
    ),
    onSuccess: (schedule, requestid) => {
      queryClient.setQueryData(buyerQueryKeys.schedule(requestid), schedule);
      return queryClient.invalidateQueries({ queryKey: ["buyer-requests"] });
    },
  });
}
