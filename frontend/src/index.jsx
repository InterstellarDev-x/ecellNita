import React from "react";
import ReactDOM from "react-dom/client";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "react-toastify/dist/ReactToastify.css";
import "./index.css";
import { RouterProvider } from "react-router-dom";
import router from "./router/router";
import { cssTransition, ToastContainer } from "react-toastify";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import OfflineFallback from "./components/CommonInterface/OfflineFallback/OfflineFallback";

const root = ReactDOM.createRoot(document.getElementById("root"));
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
  },
});
const smoothToastTransition = cssTransition({
  enter: "campus-toast-enter",
  exit: "campus-toast-exit",
  collapseDuration: 220,
});

root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <OfflineFallback>
        <RouterProvider router={router} />
      </OfflineFallback>
      <ToastContainer
        position="top-right"
        autoClose={1200}
        closeOnClick
        pauseOnHover
        draggable
        newestOnTop
        limit={3}
        icon={false}
        transition={smoothToastTransition}
      />
    </QueryClientProvider>
  </React.StrictMode>
);

if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/service-worker.js").catch(() => {
      // The live app remains fully usable if offline support cannot be registered.
    });
  });
}
