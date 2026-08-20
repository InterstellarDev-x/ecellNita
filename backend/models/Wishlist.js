const mongoose = require("mongoose");

const wishlistSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "User",
            index: true,
        },
        product: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "Product",
            index: true,
        },
    },
    { timestamps: true }
);

wishlistSchema.index({ user: 1, product: 1 }, { unique: true });

module.exports = mongoose.model("Wishlist", wishlistSchema);
