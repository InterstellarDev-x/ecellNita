const Product = require("../models/Product");
const User = require("../models/User");
const Request = require("../models/Request");
const ListingSubmission = require("../models/ListingSubmission");
const ModerationReview = require("../models/ModerationReview");
const ReviewConfiguration = require("../models/ReviewConfiguration");
const AdminAuditLog = require("../models/AdminAuditLog");
const ContentReport = require("../models/ContentReport");
const cloudinary = require("cloudinary").v2;
const { getReviewConfiguration, publishSubmission, destroyStagedAssets } = require("../services/listingReview");

const pageOptions = (query) => ({
    page: Math.max(Number(query.page) || 1, 1),
    limit: Math.min(Math.max(Number(query.limit) || 20, 1), 100),
});

const logAction = (actor, action, targetType, targetId, before, after) =>
    AdminAuditLog.create({ actor, action, targetType, targetId, before, after });

exports.dashboard = async (_req, res) => {
    try {
        const [products, users, requests, pendingReviews, rejectedReviews] = await Promise.all([
            Product.countDocuments(), User.countDocuments(), Request.countDocuments(),
            ListingSubmission.countDocuments({ state: "pending_human_review" }),
            ModerationReview.countDocuments({ decision: "rejected" }),
        ]);
        return res.json({ success: true, data: { products, users, requests, pendingReviews, rejectedReviews } });
    } catch (error) { return res.status(500).json({ success: false, message: "Could not load dashboard" }); }
};

exports.listProducts = async (req, res) => {
    try {
        const { page, limit } = pageOptions(req.query);
        const search = req.query.search?.trim();
        const filter = {};
        if (req.query.publicationStatus) filter.publicationStatus = req.query.publicationStatus;
        if (search) filter.$or = [{ productname: new RegExp(search, "i") }, { productdescription: new RegExp(search, "i") }];
        const [items, total] = await Promise.all([
            Product.find(filter).populate("owner", "firstname lastname email accountStatus").populate("category", "name").sort({ createdat: -1 }).skip((page - 1) * limit).limit(limit).lean(),
            Product.countDocuments(filter),
        ]);
        return res.json({ success: true, data: items, pagination: { page, limit, total } });
    } catch (error) { return res.status(500).json({ success: false, message: "Could not load products" }); }
};

exports.listUsers = async (req, res) => {
    try {
        const { page, limit } = pageOptions(req.query);
        const search = req.query.search?.trim();
        const filter = search ? { $or: [{ firstname: new RegExp(search, "i") }, { lastname: new RegExp(search, "i") }, { email: new RegExp(search, "i") }] } : {};
        const [items, total] = await Promise.all([
            User.find(filter).select("firstname lastname email image roles accountStatus products accounttype").sort({ _id: -1 }).skip((page - 1) * limit).limit(limit).lean(),
            User.countDocuments(filter),
        ]);
        return res.json({ success: true, data: items, pagination: { page, limit, total } });
    } catch (error) { return res.status(500).json({ success: false, message: "Could not load users" }); }
};

exports.listSubmissions = async (_req, res) => {
    try {
        const items = await ListingSubmission.find({ state: "pending_human_review" }).populate("seller", "firstname lastname email image").populate("listing.category", "name").sort({ createdAt: 1 }).lean();
        return res.json({ success: true, data: items.map((item) => ({
            ...item,
            previewUrls: (item.stagedAssets || []).map((asset) => cloudinary.url(asset.publicId, { resource_type: asset.resourceType || "image", type: "authenticated", sign_url: true })),
        })) });
    } catch (error) { return res.status(500).json({ success: false, message: "Could not load review queue" }); }
};

exports.reviewSubmission = async (req, res) => {
    try {
        const { decision, reasonCodes = [], sellerMessage = "" } = req.body;
        if (!["approved", "rejected"].includes(decision)) return res.status(400).json({ success: false, message: "A valid decision is required" });
        const submission = await ListingSubmission.findById(req.params.submissionId);
        if (!submission || submission.state !== "pending_human_review") return res.status(404).json({ success: false, message: "Review submission not found" });

        let product;
        if (decision === "approved") {
            product = await publishSubmission(submission, req.user.id);
            submission.state = "approved";
        } else {
            await destroyStagedAssets(submission.stagedAssets);
            submission.state = "rejected";
        }
        await submission.save();
        await ModerationReview.create({ submission: submission._id, product: product?._id, reviewerType: "human", reviewer: req.user.id, decision, reasonCodes, sellerMessage });
        await logAction(req.user.id, `listing_${decision}`, "ListingSubmission", submission._id, { state: "pending_human_review" }, { state: submission.state });
        return res.json({ success: true, message: `Listing ${decision}`, data: product || submission });
    } catch (error) { return res.status(500).json({ success: false, message: "Could not save review decision" }); }
};

exports.getSettings = async (_req, res) => res.json({ success: true, data: await getReviewConfiguration() });

exports.updateSettings = async (req, res) => {
    try {
        const allowedModes = ["no_review", "human", "ai_escalation"];
        if (!allowedModes.includes(req.body.mode)) return res.status(400).json({ success: false, message: "Invalid review mode" });
        const current = await getReviewConfiguration();
        const before = current.toObject();
        current.mode = req.body.mode;
        if (req.body.ai) current.ai = { ...current.ai.toObject(), ...req.body.ai };
        if (req.body.policyVersion) current.policyVersion = req.body.policyVersion;
        current.updatedBy = req.user.id;
        await current.save();
        await logAction(req.user.id, "review_configuration_updated", "ReviewConfiguration", current._id, before, current.toObject());
        return res.json({ success: true, data: current });
    } catch (error) { return res.status(500).json({ success: false, message: "Could not update review settings" }); }
};

exports.updateUserStatus = async (req, res) => {
    try {
        if (!["active", "suspended", "blocked"].includes(req.body.accountStatus)) return res.status(400).json({ success: false, message: "Invalid account status" });
        const user = await User.findById(req.params.userId);
        if (!user) return res.status(404).json({ success: false, message: "User not found" });
        const before = user.accountStatus;
        user.accountStatus = req.body.accountStatus;
        await user.save();
        await logAction(req.user.id, "user_status_updated", "User", user._id, { accountStatus: before }, { accountStatus: user.accountStatus });
        return res.json({ success: true, data: user });
    } catch (error) { return res.status(500).json({ success: false, message: "Could not update user" }); }
};

exports.listContentReports = async (_req, res) => {
    try {
        const reports = await ContentReport.find({ status: "pending" })
            .populate("reporter", "firstname lastname email")
            .populate("reportedUser", "firstname lastname email accountStatus")
            .populate({ path: "question", populate: { path: "product", select: "productname" } })
            .sort({ createdAt: 1 })
            .lean();
        return res.json({ success: true, data: reports });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Could not load content reports" });
    }
};

exports.reviewContentReport = async (req, res) => {
    try {
        const { resolution } = req.body;
        if (!['dismissed', 'actioned'].includes(resolution)) {
            return res.status(400).json({ success: false, message: "A valid report resolution is required" });
        }
        const report = await ContentReport.findById(req.params.reportId);
        if (!report || report.status !== "pending") return res.status(404).json({ success: false, message: "Report not found" });
        report.status = resolution;
        report.reviewedBy = req.user.id;
        report.reviewedAt = new Date();
        await report.save();

        if (resolution === "dismissed") {
            const ProductQuestion = require("../models/ProductQuestion");
            const question = await ProductQuestion.findById(report.question);
            if (question) {
                if (report.targetType === "question") question.questionHidden = false;
                else if (question.answer) question.answer.hidden = false;
                await question.save();
            }
        }
        await logAction(req.user.id, `content_report_${resolution}`, "ContentReport", report._id, { status: "pending" }, { status: resolution });
        return res.json({ success: true, data: report });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Could not review content report" });
    }
};
