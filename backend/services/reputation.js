const mongoose = require("mongoose");
const CompletedTransaction = require("../models/CompletedTransaction");
const TransactionReview = require("../models/TransactionReview");

const visibleReviewFilter = (now = new Date()) => ({
    $or: [
        { visibility: "published" },
        { visibleAfter: { $lte: now } },
    ],
});

const emptySummary = () => ({
    seller: { average: 0, count: 0, completedTransactions: 0 },
    buyer: { average: 0, count: 0, completedTransactions: 0 },
});

const getReputationMap = async (userIds) => {
    const ids = [...new Set((userIds || []).map(String))]
        .filter(mongoose.Types.ObjectId.isValid)
        .map((id) => new mongoose.Types.ObjectId(id));
    if (!ids.length) return new Map();

    const [ratings, sales, purchases] = await Promise.all([
        TransactionReview.aggregate([
            { $match: { reviewedUser: { $in: ids }, ...visibleReviewFilter() } },
            { $group: { _id: { user: "$reviewedUser", direction: "$direction" }, average: { $avg: "$rating" }, count: { $sum: 1 } } },
        ]),
        CompletedTransaction.aggregate([
            { $match: { seller: { $in: ids } } },
            { $group: { _id: "$seller", count: { $sum: 1 } } },
        ]),
        CompletedTransaction.aggregate([
            { $match: { buyer: { $in: ids } } },
            { $group: { _id: "$buyer", count: { $sum: 1 } } },
        ]),
    ]);

    const result = new Map(ids.map((id) => [String(id), emptySummary()]));
    ratings.forEach((item) => {
        const role = item._id.direction === "buyer_to_seller" ? "seller" : "buyer";
        const summary = result.get(String(item._id.user));
        summary[role].average = Number(item.average.toFixed(1));
        summary[role].count = item.count;
    });
    sales.forEach((item) => { result.get(String(item._id)).seller.completedTransactions = item.count; });
    purchases.forEach((item) => { result.get(String(item._id)).buyer.completedTransactions = item.count; });
    return result;
};

const getReputationSummary = async (userId) => {
    const map = await getReputationMap([userId]);
    return map.get(String(userId)) || emptySummary();
};

module.exports = { visibleReviewFilter, getReputationMap, getReputationSummary };
