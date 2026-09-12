import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import PrivateQuestions from "../components/CommonInterface/Questions/PrivateQuestions";
import { notificationDestination } from "../components/CommonInterface/Notifications/NotificationBell";

const state = vi.hoisted(() => ({ connected: true, emit: vi.fn(), messages: [] }));
vi.mock("../realtime/RealtimeProvider", () => ({
  useRealtime: () => ({ connected: state.connected, socket: { on: vi.fn(), off: vi.fn() } }),
  emitAcknowledged: (...args) => state.emit(...args),
}));
vi.mock("../hooks/useQuestionQueries", () => ({ useNotifications: () => ({ data: { notifications: [] } }),
  useMarkNotificationRead: vi.fn(), useMarkAllNotificationsRead: vi.fn() }));
vi.mock("../components/CommonInterface/Questions/LegacyQuestions", () => ({ default: () => null }));
vi.mock("../hooks/useChatQueries", () => ({
  chatUserId: () => "buyer",
  useChats: () => ({ data: [{ _id: "thread", product: { _id: "product", productname: "Campus lamp", price: 500, status: "Forsale" }, buyer: { _id: "buyer", firstname: "Aditi" }, seller: { _id: "seller", firstname: "Rahul" }, lastMessageAt: "2026-09-11T10:00:00Z" }] }),
  useChatThread: () => ({}),
  useChatMessages: () => ({ data: { pages: [{ messages: state.messages }] } }),
}));
const renderChat = () => render(<QueryClientProvider client={new QueryClient()}><MemoryRouter initialEntries={["/buyer/questions?chat=thread"]}><PrivateQuestions audience="buyer" /></MemoryRouter></QueryClientProvider>);
beforeEach(() => { state.connected = true; state.messages = []; state.emit.mockReset(); Element.prototype.scrollIntoView = vi.fn(); });

describe("negotiation chat", () => {
  it("keeps drafts while disconnected and prevents accidental sends", () => {
    state.connected = false;
    renderChat();
    fireEvent.change(screen.getByLabelText("Message"), { target: { value: "Is it available?" } });
    expect(screen.getByRole("button", { name: "Send message" })).toBeDisabled();
    expect(screen.getByLabelText("Message")).toHaveValue("Is it available?");
    expect(screen.getByText(/Your draft stays here/)).toBeInTheDocument();
  });
  it("reuses the client ID after an uncertain send instead of duplicating the message", async () => {
    state.emit.mockImplementation((_socket, event) => event === "chat:send" ? Promise.reject(new Error("Delivery not confirmed")) : Promise.resolve({}));
    renderChat();
    fireEvent.change(screen.getByLabelText("Message"), { target: { value: "Can you do 450?" } });
    fireEvent.click(screen.getByRole("button", { name: "Send message" }));
    await screen.findByRole("alert");
    await waitFor(() => expect(screen.getByRole("button", { name: "Send message" })).toBeEnabled());
    const first = state.emit.mock.calls.find((call) => call[1] === "chat:send")[2];
    fireEvent.click(screen.getByRole("button", { name: "Send message" }));
    await waitFor(() => expect(state.emit.mock.calls.filter((call) => call[1] === "chat:send")).toHaveLength(2));
    const second = state.emit.mock.calls.filter((call) => call[1] === "chat:send")[1][2];
    expect(second.clientId).toBe(first.clientId);
    expect(screen.getByLabelText("Message")).toHaveValue("Can you do 450?");
  });
  it("only gives accept/decline controls to the recipient of an offer", () => {
    state.messages = [{ _id: "offer", kind: "offer", sender: "buyer", recipient: "seller", amount: 450, offerStatus: "pending", createdAt: "2026-09-11T10:00:00Z" }];
    renderChat();
    expect(screen.getByText("Your price offer")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Accept", exact: true })).not.toBeInTheDocument();
  });
  it("routes incoming chat notifications to the correct buying or selling inbox", () => {
    expect(notificationDestination({ chat: "thread", audience: "buyer" }, "seller")).toBe("/buyer/questions?chat=thread");
    expect(notificationDestination({ chat: "thread", audience: "seller" }, "buyer")).toBe("/seller/questions?chat=thread");
  });
});
