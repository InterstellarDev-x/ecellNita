import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import AdminRoute from "../router/AdminRoute";
import NotFound from "../screens/NotFound";
import ActivitySection from "../components/CommonInterface/LoginSignup/Activity/ActivitySection";
import Getstarted from "../components/CommonInterface/LoginSignup/Getstarted/Getstarted";
import { MAX_LISTING_QUANTITY, listingQuantitySchema } from "../validation/product";

describe("product listing validation", () => {
  it("accepts bounded whole-number quantities and rejects extreme values", () => {
    expect(listingQuantitySchema.parse("1")).toBe(1);
    expect(listingQuantitySchema.parse(String(MAX_LISTING_QUANTITY))).toBe(MAX_LISTING_QUANTITY);
    for (const quantity of ["", "0", "1.5", "101", "1e100", "not-a-number"]) {
      expect(listingQuantitySchema.safeParse(quantity).success).toBe(false);
    }
  });
});

describe("role and fallback routing", () => {
  it("allows moderators into the control panel", () => {
    localStorage.setItem("campusrecycleuser", JSON.stringify({ roles: ["moderator"] }));
    render(<MemoryRouter><AdminRoute><p>Control panel</p></AdminRoute></MemoryRouter>);
    expect(screen.getByText("Control panel")).toBeInTheDocument();
  });

  it("redirects regular users away from admin routes", () => {
    localStorage.setItem("campusrecycleuser", JSON.stringify({ roles: ["user"] }));
    render(
      <MemoryRouter initialEntries={["/admin"]}>
        <Routes>
          <Route path="/admin" element={<AdminRoute><p>Control panel</p></AdminRoute>} />
          <Route path="/buyer/productlist" element={<p>Marketplace</p>} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByText("Marketplace")).toBeInTheDocument();
  });

  it("offers a useful destination on the not-found page", () => {
    render(<MemoryRouter><NotFound /></MemoryRouter>);
    expect(screen.getByRole("heading", { name: /no longer on the shelf/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /back home/i })).toHaveAttribute("href", "/");
  });
});

describe("account entry UI", () => {
  it("associates login labels and exposes an accessible password toggle", () => {
    render(<MemoryRouter initialEntries={["/student-login"]}><ActivitySection /></MemoryRouter>);
    const password = screen.getByLabelText("Password");
    expect(password).toHaveAttribute("type", "password");
    fireEvent.click(screen.getByRole("button", { name: "Show password" }));
    expect(password).toHaveAttribute("type", "text");
  });

  it("keeps Get Started disabled until a marketplace role is selected", () => {
    render(<MemoryRouter><Getstarted /></MemoryRouter>);
    const start = screen.getByRole("button", { name: /get started/i });
    expect(start).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: /i’m here to buy/i }));
    expect(start).toBeEnabled();
    expect(screen.getByText(/discover useful products/i)).toBeInTheDocument();
  });
});
