const mongoose = require("mongoose");
const Request = require("../models/Request");
require("dotenv").config();

const run = async () => {
    if (!process.env.MONGODB_URL) {
        throw new Error("MONGODB_URL is required");
    }

    await mongoose.connect(process.env.MONGODB_URL);

    const duplicates = await Request.aggregate([
        { $group: { _id: { buyer: "$buyer", product: "$product" }, count: { $sum: 1 } } },
        { $match: { count: { $gt: 1 } } },
        { $limit: 10 },
    ]);

    if (duplicates.length) {
        throw new Error(
            `Cannot create the unique buyer/product request index: ${duplicates.length} duplicate group(s) found. Resolve them before rerunning this migration.`
        );
    }

    const indexName = "buyer_1_product_1";
    const indexes = await Request.collection.indexes();
    const currentIndex = indexes.find((index) => index.name === indexName);

    if (currentIndex && !currentIndex.unique) {
        await Request.collection.dropIndex(indexName);
    }

    await Request.collection.createIndex({ buyer: 1, product: 1 }, { unique: true, name: indexName });
    console.log("Unique buyer/product request index is ready.");
};

run()
    .catch((error) => {
        console.error(error.message);
        process.exitCode = 1;
    })
    .finally(async () => {
        await mongoose.disconnect();
    });
