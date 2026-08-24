const FeatureRequest = require("../models/FeatureRequest");

exports.createFeatureRequest = async (req, res) => {
    try {
        const { title, description } = req.body;
        if (typeof title !== "string" || !title.trim() || typeof description !== "string" || !description.trim()) {
            return res.status(400).json({ success: false, message: "A title and description are required" });
        }
        const item = await FeatureRequest.create({ title: title.trim(), description: description.trim(), submittedBy: req.user.id });
        return res.status(201).json({ success: true, message: "Feature request submitted", data: item });
    } catch (error) { return res.status(500).json({ success: false, message: "Could not submit feature request" }); }
};

exports.listFeatureRequests = async (_req, res) => {
    try {
        const requests = await FeatureRequest.find().populate("submittedBy", "firstname lastname email").sort({ createdAt: -1 }).lean();
        return res.json({ success: true, data: requests });
    } catch (error) { return res.status(500).json({ success: false, message: "Could not load feature requests" }); }
};
