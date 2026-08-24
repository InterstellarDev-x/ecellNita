const mongoose = require("mongoose");

const featureRequestSchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true, maxlength: 140 },
    description: { type: String, required: true, trim: true, maxlength: 2000 },
    submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
}, { timestamps: true });

module.exports = mongoose.model("FeatureRequest", featureRequestSchema);
