const mongoose = require("mongoose");
const Product = require("../models/Product");
const ProductReport = require("../models/ProductReport");
const AdminAuditLog = require("../models/AdminAuditLog");
const logger = require("../utils/logger");

const REPORT_REASONS = new Set(["misleading", "prohibited", "condition", "safety", "other"]);

exports.createProductReport = async (req, res) => {
    try {
        const { productid } = req.body;
        const reason = String(req.body.reason || "").trim().toLowerCase();
        const details = String(req.body.details || "").trim();
        if (!mongoose.Types.ObjectId.isValid(productid) || !REPORT_REASONS.has(reason)) {
            return res.status(400).json({ success: false, message: "Select a valid product and report reason" });
        }
        if (details.length < 10 || details.length > 1000) {
            return res.status(400).json({ success: false, message: "Report details must be between 10 and 1000 characters" });
        }
        const product = await Product.findById(productid).select("owner productname");
        if (!product) return res.status(404).json({ success: false, message: "Product not found" });
        if (String(product.owner) === String(req.user.id)) {
            return res.status(403).json({ success: false, message: "You cannot report your own listing" });
        }
        const duplicate = await ProductReport.exists({
            reporter: req.user.id,
            product: productid,
            status: { $in: ["open", "reviewing"] },
        });
        if (duplicate) return res.status(409).json({ success: false, message: "You already have an open report for this product" });

        const report = await ProductReport.create({ reporter: req.user.id, product: productid, reason, details });
        return res.status(201).json({ success: true, message: "Report submitted for review", data: { _id: report._id } });
    } catch (error) {
        logger.error("Could not submit product report: %s", error.message);
        return res.status(500).json({ success: false, message: "Could not submit the report" });
    }
};

exports.listProductReports = async (_req, res) => {
    try {
        const reports = await ProductReport.find({ status: { $in: ["open", "reviewing"] } })
            .populate("reporter", "firstname lastname email")
            .populate({ path: "product", select: "productname productdescription images publicationStatus owner", populate: { path: "owner", select: "firstname lastname email" } })
            .sort({ createdAt: 1 })
            .lean();
        return res.json({ success: true, data: reports });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Could not load product reports" });
    }
};

exports.reviewProductReport = async (req, res) => {
    try {
        const { resolution, hideProduct = false } = req.body;
        if (!["resolved", "dismissed"].includes(resolution)) {
            return res.status(400).json({ success: false, message: "A valid resolution is required" });
        }
        const report = await ProductReport.findOne({ _id: req.params.reportId, status: { $in: ["open", "reviewing"] } });
        if (!report) return res.status(404).json({ success: false, message: "Product report not found" });

        if (resolution === "resolved" && hideProduct) {
            await Product.findByIdAndUpdate(report.product, { publicationStatus: "hidden" });
        }
        report.status = resolution;
        report.resolution = resolution === "dismissed" ? "Report dismissed" : hideProduct ? "Listing hidden" : "Report resolved";
        report.resolvedBy = req.user.id;
        await report.save();
        await AdminAuditLog.create({
            actor: req.user.id,
            action: `product_report_${resolution}`,
            targetType: "ProductReport",
            targetId: report._id,
            before: { status: "open" },
            after: { status: resolution, hideProduct: Boolean(hideProduct) },
        });
        return res.json({ success: true, message: "Product report reviewed", data: report });
    } catch (error) {
        logger.error("Could not review product report: %s", error.message);
        return res.status(500).json({ success: false, message: "Could not review product report" });
    }
};
