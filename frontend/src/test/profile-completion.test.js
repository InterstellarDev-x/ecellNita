import { describe, expect, it } from "vitest";
import { getProfileCompletion } from "../utils/profileCompletion";
import { signupDetailsSchema } from "../validation/auth";

const completeUser = {
  firstname: "Aditi",
  lastname: "Sharma",
  email: "aditi@nita.ac.in",
  additionaldetails: {
    gender: "Female",
    enrollmentno: "23UEC123",
    contactno: 9876543210,
    graduationyr: 3,
    about: "I reuse books and electronics across campus.",
  },
};

describe("profile completion", () => {
  it("marks a profile complete only when every shared readiness field is present", () => {
    expect(getProfileCompletion(completeUser)).toMatchObject({
      completedFields: 8,
      totalFields: 8,
      percentage: 100,
      isComplete: true,
      missingFields: [],
    });
  });

  it("treats whitespace as missing and reports the same percentage to every screen", () => {
    const incomplete = {
      ...completeUser,
      additionaldetails: { ...completeUser.additionaldetails, about: "   " },
    };
    expect(getProfileCompletion(incomplete)).toMatchObject({
      percentage: 88,
      isComplete: false,
      missingFields: ["About"],
    });
  });

  it("supports legacy profile values stored on the user object", () => {
    const { additionaldetails, ...user } = completeUser;
    expect(getProfileCompletion({ ...user, ...additionaldetails, additionaldetails: null }).isComplete).toBe(true);
  });
});

describe("signup enrollment validation", () => {
  const validSignup = {
    firstname: "Aditi",
    lastname: "Sharma",
    email: "aditi@nita.ac.in",
    enrollmentno: "23UEC123",
    password: "Campus123",
    confirmpassword: "Campus123",
    accounttype: "Buyer",
  };

  it("requires the enrollment number before OTP verification", () => {
    expect(signupDetailsSchema.safeParse(validSignup).success).toBe(true);
    expect(signupDetailsSchema.safeParse({ ...validSignup, enrollmentno: "" }).success).toBe(false);
    expect(signupDetailsSchema.safeParse({ ...validSignup, enrollmentno: "23 UEC 123" }).success).toBe(false);
  });
});
