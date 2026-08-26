// fallow-ignore-file unused-file -- Node's test runner discovers this file without an import.
const test = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const { signupSchema, resetPasswordSchema } = require("../validation/auth");
const { MAX_LISTING_QUANTITY, listingQuantitySchema } = require("../validation/product");
const { validateFiles } = require("../services/listingReview");
const Profile = require("../models/Profile");
const User = require("../models/User");

const validSignup = {
    firstname: "Aditi",
    lastname: "Sharma",
    email: "ADITI@NITA.AC.IN",
    password: "Campus123",
    confirmpassword: "Campus123",
    accounttype: "Buyer",
    otp: "123456",
};

test("signup validation normalizes email and accepts a strong matching password", () => {
    const result = signupSchema.safeParse(validSignup);
    assert.equal(result.success, true);
    assert.equal(result.data.email, "aditi@nita.ac.in");
});

test("signup and reset validation reject weak or mismatched passwords", () => {
    assert.equal(signupSchema.safeParse({ ...validSignup, password: "weak", confirmpassword: "weak" }).success, false);
    assert.equal(resetPasswordSchema.safeParse({ password: "Campus123", confirmpassword: "Different123", token: crypto.randomUUID() }).success, false);
});

test("listing image validation enforces count, MIME type, size, and temp storage", () => {
    const image = { mimetype: "image/jpeg", size: 1024, tempFilePath: "/tmp/product.jpg" };
    assert.doesNotThrow(() => validateFiles([image, image, image]));
    assert.throws(() => validateFiles([image, image]), /between 3 and 6 images/);
    assert.throws(() => validateFiles([image, image, { ...image, mimetype: "text/html" }]), /JPG, PNG, or WebP/);
    assert.throws(() => validateFiles([image, image, { ...image, size: 4 * 1024 * 1024 }]), /smaller than 3MB/);
});

test("listing quantity validation accepts bounded integers and rejects extreme values", () => {
    assert.equal(listingQuantitySchema.parse("1"), 1);
    assert.equal(listingQuantitySchema.parse(String(MAX_LISTING_QUANTITY)), MAX_LISTING_QUANTITY);
    for (const quantity of ["", "0", "1.5", "101", "1e100", "not-a-number"]) {
        assert.equal(listingQuantitySchema.safeParse(quantity).success, false, `expected ${quantity || "empty input"} to be rejected`);
    }
});

test("profile schema rejects invalid contact numbers and graduation years", () => {
    assert.equal(new Profile({ contactno: 9876543210, graduationyr: 4 }).validateSync(), undefined);
    assert.ok(new Profile({ contactno: 123, graduationyr: 9 }).validateSync());
});

test("authentication fields are excluded from user queries by default", () => {
    assert.equal(User.schema.path("hashedpassword").options.select, false);
    assert.equal(User.schema.path("forgotpasswordlink").options.select, false);
    assert.equal(User.schema.path("forgotpasswordlinkexpires").options.select, false);
});
