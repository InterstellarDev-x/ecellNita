const fs = require("fs/promises");
const mongoose = require("mongoose");
const cloudinary = require("cloudinary").v2;
const OpenAI = require("openai");
const Category = require("../models/Category");
const ListingSubmission = require("../models/ListingSubmission");
const ModerationReview = require("../models/ModerationReview");
const Product = require("../models/Product");
const ReviewConfiguration = require("../models/ReviewConfiguration");
const User = require("../models/User");
const { cloudinaryuploader } = require("../utils/cloudinaryuploader");

const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_IMAGE_BYTES = 3 * 1024 * 1024;
const MIN_IMAGES = 3;
const MAX_IMAGES = 6;

const getReviewConfiguration = () => ReviewConfiguration.findOneAndUpdate(
    { key: "global_listing_review" },
    { $setOnInsert: { key: "global_listing_review" } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
);

const normaliseFiles = (imageInput) => (Array.isArray(imageInput) ? imageInput : [imageInput]).filter(Boolean);

const validateFiles = (files) => {
    if (files.length < MIN_IMAGES || files.length > MAX_IMAGES) {
        throw new Error(`Upload between ${MIN_IMAGES} and ${MAX_IMAGES} images`);
    }
    for (const file of files) {
        if (!ALLOWED_IMAGE_TYPES.has(file.mimetype) || file.size > MAX_IMAGE_BYTES || !file.tempFilePath) {
            throw new Error("Images must be JPG, PNG, or WebP files smaller than 3MB");
        }
    }
};

const cleanupTempFiles = async (files) => {
    await Promise.all(files.map((file) => fs.unlink(file.tempFilePath).catch(() => undefined)));
};

const toImageInput = async (file) => {
    const content = await fs.readFile(file.tempFilePath);
    return { type: "input_image", image_url: `data:${file.mimetype};base64,${content.toString("base64")}` };
};

const getReasonCodes = (categories = {}) => Object.entries(categories)
    .filter(([, flagged]) => flagged)
    .map(([category]) => category.replaceAll("/", "_"));

const runAiReview = async ({ files, listing, configuration }) => {
    if (!process.env.OPENAI_API_KEY) {
        return { decision: "escalated", reasonCodes: ["ai_service_not_configured"], sellerMessage: "This listing requires a human review." };
    }

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, timeout: configuration.ai.timeoutMs });
    const imageInputs = await Promise.all(files.map(toImageInput));
    const listingText = `Marketplace listing: title=${listing.productname}; description=${listing.productdescription}; category=${listing.category}; price=${listing.price}; quantity=${listing.quantity}.`;

    try {
        const moderation = await client.moderations.create({
            model: configuration.ai.moderationModel,
            input: [{ type: "text", text: listingText }, ...imageInputs.map((image) => ({ type: "image_url", image_url: { url: image.image_url } }))],
        });
        const moderationResult = moderation.results?.[0];
        if (moderationResult?.flagged) {
            return {
                decision: "rejected",
                reasonCodes: getReasonCodes(moderationResult.categories),
                sellerMessage: "This listing does not meet our marketplace safety policy.",
                ai: { provider: "openai", model: configuration.ai.moderationModel, confidence: 1, categoryScores: moderationResult.category_scores },
            };
        }

        const response = await client.responses.create({
            model: configuration.ai.visionModel,
            input: [{
                role: "user",
                content: [{
                    type: "input_text",
                    text: `${listingText}\nReview against this policy: images must show the listed product, content must be suitable for a campus marketplace, and the listing must not promote prohibited, misleading, or unrelated items. Return JSON only.`,
                }, ...imageInputs],
            }],
            text: {
                format: {
                    type: "json_schema",
                    name: "listing_review",
                    strict: true,
                    schema: {
                        type: "object",
                        properties: {
                            decision: { type: "string", enum: ["approve", "reject", "human_review"] },
                            confidence: { type: "number" },
                            reasonCodes: { type: "array", items: { type: "string" } },
                            sellerMessage: { type: "string" },
                        },
                        required: ["decision", "confidence", "reasonCodes", "sellerMessage"],
                        additionalProperties: false,
                    },
                },
            },
        });
        const verdict = JSON.parse(response.output_text || "{}");
        const confidence = Number(verdict.confidence) || 0;
        if (verdict.decision === "approve" && confidence >= configuration.ai.autoApproveThreshold) {
            return { decision: "approved", reasonCodes: verdict.reasonCodes, sellerMessage: verdict.sellerMessage, ai: { provider: "openai", model: configuration.ai.visionModel, confidence } };
        }
        if (verdict.decision === "reject" && confidence >= configuration.ai.autoRejectThreshold) {
            return { decision: "rejected", reasonCodes: verdict.reasonCodes, sellerMessage: verdict.sellerMessage, ai: { provider: "openai", model: configuration.ai.visionModel, confidence } };
        }
        return { decision: "escalated", reasonCodes: verdict.reasonCodes || ["human_review_required"], sellerMessage: "This listing needs a quick human review.", ai: { provider: "openai", model: configuration.ai.visionModel, confidence } };
    } catch (error) {
        if (configuration.ai.onProviderFailure === "reject") {
            return { decision: "rejected", reasonCodes: ["ai_review_unavailable"], sellerMessage: "We could not review this listing. Please try again later." };
        }
        return { decision: "escalated", reasonCodes: ["ai_review_unavailable"], sellerMessage: "This listing needs a quick human review." };
    }
};

const uploadPublicAssets = async (files) => Promise.all(files.map(async (file) => {
    const result = await cloudinaryuploader(file, process.env.FOLDER_NAME, 1000, 1000);
    return { url: result.secure_url, publicId: result.public_id, assetId: result.asset_id, resourceType: result.resource_type };
}));

const stageAssets = async (files) => Promise.all(files.map(async (file) => {
    const result = await cloudinaryuploader(file, "listing-submissions", 1000, 1000, { type: "authenticated" });
    return { publicId: result.public_id, assetId: result.asset_id, resourceType: result.resource_type, mimeType: file.mimetype, size: file.size };
}));

const publishProduct = async ({ listing, files, ownerId, decision, reviewerId }) => {
    const assets = files ? await uploadPublicAssets(files) : [];
    const product = await Product.create({
        ...listing,
        category: listing.category,
        owner: ownerId,
        images: assets.map((asset) => asset.url),
        imageAssets: assets,
        moderation: { policyVersion: decision.policyVersion, finalDecision: decision.finalDecision, reviewedAt: new Date(), reviewedBy: reviewerId },
    });
    await User.findByIdAndUpdate(ownerId, { $addToSet: { products: product._id } });
    await Category.findByIdAndUpdate(listing.category, { $addToSet: { products: product._id } });
    return product;
};

const createSubmission = async ({ seller, listing, files, reviewMode, aiDecision, product }) => {
    const stagedAssets = await stageAssets(files);
    const submission = await ListingSubmission.create({
        seller,
        product,
        operation: product ? "update" : "create",
        listing,
        stagedAssets,
        reviewMode,
        state: "pending_human_review",
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });
    await ModerationReview.create({
        submission: submission._id,
        reviewerType: aiDecision ? "ai" : "system",
        decision: "escalated",
        reasonCodes: aiDecision?.reasonCodes || ["human_review_required"],
        sellerMessage: aiDecision?.sellerMessage || "Awaiting human review.",
        ai: aiDecision?.ai,
    });
    return submission;
};

const destroyStagedAssets = async (assets = []) => Promise.all(assets.map((asset) =>
    cloudinary.uploader.destroy(asset.publicId, { resource_type: asset.resourceType || "image", type: "authenticated", invalidate: true }).catch(() => undefined)
));

const publishSubmission = async (submission, reviewerId) => {
    const uploadedAssets = await Promise.all(submission.stagedAssets.map(async (asset, index) => {
        const result = await cloudinary.uploader.rename(asset.publicId, `products/${submission._id}/${index}`, {
            resource_type: asset.resourceType || "image", type: "authenticated", to_type: "upload", overwrite: true, invalidate: true,
        });
        return { url: result.secure_url, publicId: result.public_id, assetId: result.asset_id, resourceType: result.resource_type };
    }));
    if (submission.operation === "update" && submission.product) {
        const product = await Product.findByIdAndUpdate(submission.product, {
            ...submission.listing.toObject(),
            ...(uploadedAssets.length ? { images: uploadedAssets.map((asset) => asset.url), imageAssets: uploadedAssets } : {}),
            moderation: { policyVersion: "human-review", finalDecision: "human_approved", reviewedAt: new Date(), reviewedBy: reviewerId },
        }, { new: true });
        return product;
    }
    const product = await Product.create({
        ...submission.listing.toObject(),
        owner: submission.seller,
        images: uploadedAssets.map((asset) => asset.url),
        imageAssets: uploadedAssets,
        moderation: { policyVersion: "human-review", finalDecision: "human_approved", reviewedAt: new Date(), reviewedBy: reviewerId },
    });
    await User.findByIdAndUpdate(submission.seller, { $addToSet: { products: product._id } });
    await Category.findByIdAndUpdate(submission.listing.category, { $addToSet: { products: product._id } });
    return product;
};

module.exports = { getReviewConfiguration, normaliseFiles, validateFiles, cleanupTempFiles, runAiReview, publishProduct, createSubmission, destroyStagedAssets, publishSubmission };
