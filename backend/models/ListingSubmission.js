const mongoose = require("mongoose");

const listingSubmissionSchema = new mongoose.Schema({
    seller: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    operation: { type: String, enum: ["create", "update"], default: "create" },
    listing: {
        productname: String,
        productdescription: String,
        price: Number,
        quantity: Number,
        status: String,
        category: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
    },
    stagedAssets: [{
        publicId: String,
        assetId: String,
        resourceType: { type: String, default: "image" },
        mimeType: String,
        size: Number,
    }],
    state: {
        type: String,
        enum: ["pending_human_review", "ai_reviewing", "approved", "rejected", "upload_failed", "expired"],
        default: "pending_human_review",
        index: true,
    },
    reviewMode: { type: String, enum: ["human", "ai_escalation"], required: true },
    expiresAt: { type: Date, index: true },
}, { timestamps: true });

listingSubmissionSchema.index({ state: 1, createdAt: -1 });
listingSubmissionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("ListingSubmission", listingSubmissionSchema);
