import { z } from "zod";

export const MAX_LISTING_QUANTITY = 100;

export const listingQuantitySchema = z.coerce
  .number({ invalid_type_error: "Quantity must be a number" })
  .finite("Quantity must be a finite number")
  .int("Quantity must be a whole number")
  .safe("Quantity is too large")
  .min(1, "Quantity must be at least 1")
  .max(MAX_LISTING_QUANTITY, `Quantity cannot exceed ${MAX_LISTING_QUANTITY}`);

export const getFirstValidationMessage = (error) => error.issues[0]?.message || "Invalid quantity";
