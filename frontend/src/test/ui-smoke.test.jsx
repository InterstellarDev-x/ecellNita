import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import AdminRoute from "../router/AdminRoute";
import NotFound from "../screens/NotFound";
import ActivitySection from "../components/CommonInterface/LoginSignup/Activity/ActivitySection";
import { MAX_LISTING_QUANTITY, listingQuantitySchema } from "../validation/product";
import { MAX_SOURCE_PRODUCT_IMAGE_SIZE_MB, validateProductImage } from "../utils/productImageCompression";
import { formatProductStatus } from "../utils/productStatus";
import { getOptimizedImageUrl, getResponsiveImageSrcSet } from "../utils/cloudinaryImage";
import { notificationDestination } from "../components/CommonInterface/Notifications/NotificationBell";

describe("product listing validation", () => {
  it("builds responsive Cloudinary delivery URLs without changing other hosts", () => {
    const source = "https://res.cloudinary.com/demo/image/upload/v1/products/chair.jpg";
    expect(getOptimizedImageUrl(source, { width: 480, height: 360 })).toContain("/image/upload/w_480,h_360,c_fill,g_auto,q_auto:good,f_auto/");
    expect(getResponsiveImageSrcSet(source, [320, 480], { aspectRatio: 4 / 3 })).toContain("320w");
    expect(getOptimizedImageUrl("https://example.com/chair.jpg", { width: 480 })).toBe("https://example.com/chair.jpg");
  });

  it("formats the internal Forsale status for display", () => {
    expect(formatProductStatus("Forsale")).toBe("For sale");
    expect(formatProductStatus("ForSale")).toBe("For sale");
    expect(formatProductStatus("Sold")).toBe("Sold");
  });

  it("accepts bounded whole-number quantities and rejects extreme values", () => {
    expect(listingQuantitySchema.parse("1")).toBe(1);
    expect(listingQuantitySchema.parse(String(MAX_LISTING_QUANTITY))).toBe(MAX_LISTING_QUANTITY);
    for (const quantity of ["", "0", "1.5", "101", "1e100", "not-a-number"]) {
      expect(listingQuantitySchema.safeParse(quantity).success).toBe(false);
    }
  });

  it("accepts supported source images up to 10MB", () => {
    const validImage = new File([new Uint8Array(1024)], "product.jpg", { type: "image/jpeg" });
    const oversizedImage = { ...validImage, name: "large.jpg", type: "image/jpeg", size: (MAX_SOURCE_PRODUCT_IMAGE_SIZE_MB * 1024 * 1024) + 1 };
    expect(validateProductImage(validImage)).toBe("");
    expect(validateProductImage(oversizedImage)).toMatch(/10MB or smaller/);
    expect(validateProductImage(new File(["text"], "product.txt", { type: "text/plain" }))).toMatch(/JPG, PNG, or WebP/);
  });
});

describe("role and fallback routing", () => {
  it("routes meeting proposal notifications to each participant's requests page", () => {
    const notification = { type: "meeting_proposed" };
    expect(notificationDestination(notification, "buyer")).toBe("/buyer/product-requests");
    expect(notificationDestination(notification, "seller")).toBe("/seller/product-requests");
  });

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

});
