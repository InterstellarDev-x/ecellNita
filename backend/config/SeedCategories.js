const Category = require("../models/Category");
const logger = require("../utils/logger");

const DEFAULT_CATEGORIES = [
    "Electronics",
    "Books & Notes",
    "Clothing",
    "Furniture",
    "Sports & Fitness",
    "Stationery",
    "Cycles & Transport",
    "Other",
];

exports.seedCategories = async () => {
    try {
        const count = await Category.countDocuments();
        if (count > 0) return;

        await Category.insertMany(DEFAULT_CATEGORIES.map(name => ({ name })));
        logger.info("Default categories seeded: %s", DEFAULT_CATEGORIES.join(", "));
    } catch (err) {
        logger.error("Failed to seed categories: %s", err.message);
    }
};
