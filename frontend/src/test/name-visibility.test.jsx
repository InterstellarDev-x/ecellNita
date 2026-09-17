import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import StudentprofileView from "../components/CommonInterface/Studentprofile/StudentprofileView";
import BuyerProductView from "../components/BuyerInterface/BuyerProductView/BuyerProductView";
import { authroutes } from "../apis/apis";

const state = vi.hoisted(() => ({ api: vi.fn(), product: null }));
vi.mock("../utils/Apiconnecter", () => ({ apiConnector: (...args) => state.api(...args) }));
vi.mock("../components/CommonInterface/Reviews/ReputationPanel", () => ({ default: () => null }));
vi.mock("../hooks/useChatQueries", () => ({ useStartChat: () => ({}) }));
vi.mock("../hooks/useBuyerQueries", () => ({
  useMarketplaceProduct: () => ({ data: state.product }),
  useBuyerRequests: () => ({ data: [] }),
  useCreateBuyerRequest: () => ({}),
}));
const user = { _id: "seller", firstname: "Aditi", lastname: "Sharma", email: "aditi@nita.ac.in", additionaldetails: { gender: "Female", enrollmentno: "23UEC123", contactno: "9876543210", graduationyr: "3" } };
const show = (component) => render(<QueryClientProvider client={new QueryClient()}><MemoryRouter>{component}</MemoryRouter></QueryClientProvider>);
beforeEach(() => {
  state.api.mockReset();
  localStorage.setItem("campusrecycleuser", JSON.stringify(user));
});
it("defaults existing profiles to private, saves public, and persists the choice after reopening", async () => {
  state.api.mockImplementation(async (_method, url, data) => ({ data: { success: true, data: url === authroutes.UPDATE_PROFILE ? user.additionaldetails : { ...user, nameVisibility: data.get("nameVisibility") } } }));
  const view = show(<StudentprofileView />);
  fireEvent.click(screen.getByRole("button", { name: "Edit Profile" }));
  expect(screen.getByLabelText("Name visibility")).toHaveValue("private");
  fireEvent.change(screen.getByLabelText("Name visibility"), { target: { value: "public" } });
  fireEvent.click(screen.getByRole("button", { name: "Save Changes" }));
  await screen.findByText("Profile updated successfully.");
  expect(JSON.parse(localStorage.getItem("campusrecycleuser")).nameVisibility).toBe("public");
  const update = state.api.mock.calls.find((call) => call[1] === authroutes.UPDATE_USER);
  expect(update[2].get("nameVisibility")).toBe("public");
  view.unmount();
  show(<StudentprofileView />);
  fireEvent.click(screen.getByRole("button", { name: "Edit Profile" }));
  expect(screen.getByLabelText("Name visibility")).toHaveValue("public");
  fireEvent.change(screen.getByLabelText("Name visibility"), { target: { value: "private" } });
  fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
  expect(screen.getByText("Public · Your name is shown on listings")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Edit Profile" }));
  fireEvent.change(screen.getByLabelText("Name visibility"), { target: { value: "private" } });
  fireEvent.click(screen.getByRole("button", { name: "Save Changes" }));
  await waitFor(() => expect(JSON.parse(localStorage.getItem("campusrecycleuser")).nameVisibility).toBe("private"));
});
it.each(["public", "private", undefined])("only displays a seller name when visibility is public (%s)", (nameVisibility) => {
  state.product = { _id: "product", productname: "Lamp", productdescription: "Study lamp", status: "Forsale", quantity: 1, price: 500, images: [], owner: { _id: "seller", firstname: "Aditi", lastname: "Sharma", nameVisibility } };
  show(<BuyerProductView />);
  if (nameVisibility === "public") {
    expect(screen.getByRole("heading", { name: "Aditi Sharma" })).toBeInTheDocument();
    expect(screen.getByText("Public")).toBeInTheDocument();
  } else {
    expect(screen.queryByText("Aditi Sharma")).not.toBeInTheDocument();
    expect(screen.getByText("Private")).toBeInTheDocument();
  }
});
