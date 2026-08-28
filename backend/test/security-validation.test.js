// fallow-ignore-file unused-file -- Node's test runner discovers this file without an import.
const test = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const mongoose = require("mongoose");
const { signupSchema, resetPasswordSchema } = require("../validation/auth");
const { MAX_LISTING_QUANTITY, listingQuantitySchema } = require("../validation/product");
const { validateFiles } = require("../services/listingReview");
const Profile = require("../models/Profile");
const User = require("../models/User");
const ProductQuestion = require("../models/ProductQuestion");
const Notification = require("../models/Notification");
const Shedule = require("../models/Shedule");
const questionController = require("../controllers/questions");
const productController = require("../controllers/product");
const { PRODUCT_IMAGE_TRANSFORMATION, productImageUploadOptions } = require("../utils/productImageUpload");

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
    assert.doesNotThrow(() => validateFiles([image]));
    assert.doesNotThrow(() => validateFiles(Array(6).fill(image)));
    assert.throws(() => validateFiles([]), /between 1 and 6 images/);
    assert.throws(() => validateFiles(Array(7).fill(image)), /between 1 and 6 images/);
    assert.throws(() => validateFiles([{ ...image, mimetype: "text/html" }]), /JPG, PNG, or WebP/);
    assert.throws(() => validateFiles([{ ...image, size: 4 * 1024 * 1024 }]), /smaller than 3MB/);
});

test("Cloudinary product uploads cap dimensions and use automatic quality", () => {
    assert.deepEqual(PRODUCT_IMAGE_TRANSFORMATION, [{ width: 1600, height: 1600, crop: "limit", quality: "auto:good" }]);
    assert.deepEqual(productImageUploadOptions({ type: "authenticated" }), {
        resource_type: "image",
        transformation: PRODUCT_IMAGE_TRANSFORMATION,
        type: "authenticated",
    });
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

test("meeting plans require agreement before they are confirmed", () => {
    const proposal = new Shedule({
        requestid: new mongoose.Types.ObjectId(),
        proposedBy: new mongoose.Types.ObjectId(),
        venue: "Library entrance",
        date: "2026-09-01",
        time: "14:00",
        status: "proposed",
    });
    assert.equal(proposal.status, "proposed");
    proposal.status = "confirmed";
    assert.equal(proposal.validateSync(), undefined);
    proposal.status = "accepted-without-consensus";
    assert.ok(proposal.validateSync());
});

test("marketplace pagination rejects unsafe page sizes before querying", async () => {
    const response = {
        statusCode: 200,
        status(code) { this.statusCode = code; return this; },
        json(body) { this.body = body; return this; },
    };
    await productController.getallproduct({ body: { page: 0, limit: 1000 } }, response);
    assert.equal(response.statusCode, 400);
    assert.equal(response.body.success, false);
});

test("buyers can unsend only their unanswered, unreported questions", async () => {
    const questionId = new mongoose.Types.ObjectId().toString();
    const buyerId = new mongoose.Types.ObjectId().toString();
    const originalFindOneAndDelete = ProductQuestion.findOneAndDelete;
    const originalFindOne = ProductQuestion.findOne;
    const originalDeleteMany = Notification.deleteMany;
    const response = () => ({
        statusCode: 200,
        status(code) { this.statusCode = code; return this; },
        json(body) { this.body = body; return this; },
    });

    try {
        ProductQuestion.findOneAndDelete = async (filter) => {
            assert.equal(filter._id, questionId);
            assert.equal(filter.buyer, buyerId);
            assert.equal(filter.questionHidden, false);
            assert.deepEqual(filter["answer.body"], { $exists: false });
            return { _id: questionId };
        };
        Notification.deleteMany = async (filter) => assert.equal(filter.question, questionId);
        const deletedResponse = response();
        await questionController.deleteQuestion({ params: { questionId }, user: { id: buyerId } }, deletedResponse);
        assert.equal(deletedResponse.statusCode, 200);
        assert.equal(deletedResponse.body.success, true);

        ProductQuestion.findOneAndDelete = async () => null;
        ProductQuestion.findOne = () => ({ select: () => ({ lean: async () => ({ questionHidden: false, answer: { body: "Already answered" } }) }) });
        const answeredResponse = response();
        await questionController.deleteQuestion({ params: { questionId }, user: { id: buyerId } }, answeredResponse);
        assert.equal(answeredResponse.statusCode, 409);
        assert.match(answeredResponse.body.message, /after the seller replies/);
    } finally {
        ProductQuestion.findOneAndDelete = originalFindOneAndDelete;
        ProductQuestion.findOne = originalFindOne;
        Notification.deleteMany = originalDeleteMany;
    }
});
