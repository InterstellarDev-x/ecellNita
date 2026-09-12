import { z } from "zod";

const nameSchema = z
  .string()
  .trim()
  .min(2, "Must be at least 2 characters")
  .max(50, "Must be at most 50 characters")
  .regex(/^[\p{L}]+(?:[ '-][\p{L}]+)*$/u, "Use letters, spaces, apostrophes, or hyphens only");

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Must be at most 128 characters")
  .regex(/[a-z]/, "Include a lowercase letter")
  .regex(/[A-Z]/, "Include an uppercase letter")
  .regex(/\d/, "Include a number");

export const enrollmentNumberSchema = z
  .string()
  .trim()
  .min(3, "Enrollment number must be at least 3 characters")
  .max(30, "Enrollment number must be at most 30 characters")
  .regex(/^[A-Za-z0-9][A-Za-z0-9/-]*$/, "Use letters, numbers, hyphens, or slashes only");

const signupFields = z.object({
  firstname: nameSchema,
  lastname: nameSchema,
  email: z.string().trim().max(254, "Email is too long").email("Enter a valid email address"),
  enrollmentno: enrollmentNumberSchema,
  password: passwordSchema,
  confirmpassword: z.string(),
  accounttype: z.literal("Buyer"),
});

const withMatchingPasswords = (schema) =>
  schema.superRefine(({ password, confirmpassword }, context) => {
    if (password !== confirmpassword) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["confirmpassword"],
        message: "Passwords do not match",
      });
    }
  });

export const signupDetailsSchema = withMatchingPasswords(signupFields);

export const signupSchema = withMatchingPasswords(signupFields.extend({
  otp: z.string().regex(/^\d{6}$/, "OTP must be a 6-digit number"),
}));

export const resetPasswordSchema = withMatchingPasswords(z.object({
  password: passwordSchema,
  confirmpassword: z.string(),
}));
