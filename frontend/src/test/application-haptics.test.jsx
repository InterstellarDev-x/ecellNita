import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ApplicationHaptics, { requestAppHaptic } from "../haptics/ApplicationHaptics";

const haptics = vi.hoisted(() => ({ trigger: vi.fn(), cancel: vi.fn() }));

vi.mock("web-haptics/react", () => ({
  useWebHaptics: () => haptics,
}));

beforeEach(() => {
  haptics.trigger.mockReset();
  haptics.cancel.mockReset();
  haptics.trigger.mockResolvedValue();
});

describe("application haptics", () => {
  it("maps ordinary, primary, and destructive actions to semantic feedback", () => {
    render(<><ApplicationHaptics /><button>Open</button><button type="submit">Save</button><button>Delete listing</button></>);

    fireEvent.click(screen.getByRole("button", { name: "Open" }));
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    fireEvent.click(screen.getByRole("button", { name: "Delete listing" }));

    expect(haptics.trigger.mock.calls.map(([preset]) => preset)).toEqual(["light", "medium", "warning"]);
  });

  it("uses selection feedback for controls and supports explicit overrides", () => {
    render(<><ApplicationHaptics /><input aria-label="Saved" type="checkbox" /><button data-haptic="success">Finish</button><button data-haptic="none">Quiet</button></>);

    fireEvent.click(screen.getByLabelText("Saved"));
    fireEvent.click(screen.getByRole("button", { name: "Finish" }));
    fireEvent.click(screen.getByRole("button", { name: "Quiet" }));

    expect(haptics.trigger.mock.calls.map(([preset]) => preset)).toEqual(["selection", "success"]);
  });

  it("plays outcome feedback for application events and toasts", async () => {
    render(<ApplicationHaptics />);
    requestAppHaptic("nudge");

    const toast = document.createElement("div");
    toast.className = "Toastify__toast Toastify__toast--error";
    document.body.appendChild(toast);

    await waitFor(() => expect(haptics.trigger.mock.calls.map(([preset]) => preset)).toEqual(["nudge", "error"]));
  });
});
