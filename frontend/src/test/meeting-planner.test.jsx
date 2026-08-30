import React from "react";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import MeetingPlanner from "../components/CommonInterface/MeetingPlanner/MeetingPlanner";

vi.mock("../hooks/useBuyerQueries", () => ({
  useActiveMeetingLocations: () => ({ data: [] }),
  useProposeRequestSchedule: () => ({ isPending: false, mutateAsync: vi.fn() }),
  useAcceptRequestSchedule: () => ({ isPending: false, mutateAsync: vi.fn() }),
}));

describe("meeting proposal display", () => {
  beforeEach(() => {
    localStorage.setItem("campusrecycleuser", JSON.stringify({ _id: "buyer-id" }));
  });

  it("shows proposal details when a schedule arrives after the first render", () => {
    const { rerender } = render(<MeetingPlanner requestId="request-id" schedule={null} />);
    expect(screen.getByText("Start with a proposal")).toBeInTheDocument();

    rerender(<MeetingPlanner requestId="request-id" schedule={{
      status: "proposed",
      proposedBy: "seller-id",
      locationSnapshot: { name: "Main Gate", address: "Near security desk" },
      date: "2026-09-01",
      time: "14:30",
    }} />);

    expect(screen.getByText("New meeting proposal")).toBeInTheDocument();
    expect(screen.getByText("Main Gate")).toBeInTheDocument();
    expect(screen.getByText("Near security desk")).toBeInTheDocument();
    expect(screen.getByText("14:30")).toBeInTheDocument();
    expect(screen.queryByText("Counter-proposal")).not.toBeInTheDocument();
  });
});
