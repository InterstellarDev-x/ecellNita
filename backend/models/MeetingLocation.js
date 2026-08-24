const mongoose = require("mongoose");

const meetingLocationSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true, maxlength: 120 },
    address: { type: String, required: true, trim: true, maxlength: 300 },
    startTime: { type: String, required: true, match: /^([01]\d|2[0-3]):[0-5]\d$/ },
    endTime: { type: String, required: true, match: /^([01]\d|2[0-3]):[0-5]\d$/ },
    active: { type: Boolean, default: true, index: true },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });

meetingLocationSchema.index({ name: 1 }, { unique: true });

module.exports = mongoose.model("MeetingLocation", meetingLocationSchema);
