const mongoose = require("mongoose");
const Product = require("../models/Product");
const Wishlist = require("../models/Wishlist");

const invalidProductId = (res) =>
    res.status(400).json({ success: false, message: "A valid product id is required" });

exports.getWishlist = async (req, res) => {
    try {
        const wishlistItems = await Wishlist.find({ user: req.user.id })
            .sort({ createdAt: -1 })
            .populate({
                path: "product",
                populate: [
                    { path: "owner", select: "_id" },
                    { path: "category", select: "name" },
                ],
                match:{publicationStatus:"published",status:"Forsale",quantity:{$gt:0}},
            });

        return res.json({
            success: true,
            message: "Wishlist fetched successfully",
            data: wishlistItems.map((item) => item.product).filter(Boolean),
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Could not fetch wishlist" });
    }
};

exports.addToWishlist = async (req, res) => {
    try {
        const { productid } = req.body;
        if (!mongoose.Types.ObjectId.isValid(productid)) return invalidProductId(res);

        const product = await Product.findOne({_id:productid,publicationStatus:"published",status:"Forsale",quantity:{$gt:0}});
        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        const existingItem = await Wishlist.findOne({ user: req.user.id, product: productid });
        if (existingItem) {
            return res.status(409).json({ success: false, message: "Product is already in your wishlist" });
        }

        await Wishlist.create({ user: req.user.id, product: productid });
        return res.status(201).json({ success: true, message: "Added to wishlist" });
    } catch (error) {
        if (error?.code === 11000) {
            return res.status(409).json({ success: false, message: "Product is already in your wishlist" });
        }
        return res.status(500).json({ success: false, message: "Could not update wishlist" });
    }
};

exports.removeFromWishlist = async (req, res) => {
    try {
        const { productid } = req.body;
        if (!mongoose.Types.ObjectId.isValid(productid)) return invalidProductId(res);

        await Wishlist.findOneAndDelete({ user: req.user.id, product: productid });
        return res.json({ success: true, message: "Removed from wishlist" });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Could not update wishlist" });
    }
};
