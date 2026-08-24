const mongoose = require("mongoose");
const MeetingLocation = require("../models/MeetingLocation");

const validTime = (value) => /^([01]\d|2[0-3]):[0-5]\d$/.test(value || "");
const minutes = (value) => Number(value.slice(0, 2)) * 60 + Number(value.slice(3));

const validateLocation = ({ name, address, startTime, endTime }) => {
    if (![name, address, startTime, endTime].every((value) => typeof value === "string" && value.trim())) return "Name, address, and both times are required";
    if (!validTime(startTime) || !validTime(endTime) || minutes(startTime) >= minutes(endTime)) return "End time must be after the start time";
    return null;
};

exports.listLocations = async (_req, res) => {
    try {
        const locations = await MeetingLocation.find().sort({ active: -1, name: 1 }).lean();
        return res.json({ success: true, data: locations });
    } catch (error) { return res.status(500).json({ success: false, message: "Could not load meeting locations" }); }
};

exports.createLocation = async (req, res) => {
    try {
        const message = validateLocation(req.body);
        if (message) return res.status(400).json({ success: false, message });
        const location = await MeetingLocation.create({ ...req.body, name: req.body.name.trim(), address: req.body.address.trim(), updatedBy: req.user.id });
        return res.status(201).json({ success: true, data: location });
    } catch (error) {
        if (error?.code === 11000) return res.status(409).json({ success: false, message: "A location with this name already exists" });
        return res.status(500).json({ success: false, message: "Could not create meeting location" });
    }
};

exports.updateLocation = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.locationId)) return res.status(400).json({ success: false, message: "Invalid location" });
        const current = await MeetingLocation.findById(req.params.locationId);
        if (!current) return res.status(404).json({ success: false, message: "Meeting location not found" });
        const data = { name: req.body.name ?? current.name, address: req.body.address ?? current.address, startTime: req.body.startTime ?? current.startTime, endTime: req.body.endTime ?? current.endTime };
        const message = validateLocation(data);
        if (message) return res.status(400).json({ success: false, message });
        Object.assign(current, data, { active: typeof req.body.active === "boolean" ? req.body.active : current.active, updatedBy: req.user.id });
        await current.save();
        return res.json({ success: true, data: current });
    } catch (error) {
        if (error?.code === 11000) return res.status(409).json({ success: false, message: "A location with this name already exists" });
        return res.status(500).json({ success: false, message: "Could not update meeting location" });
    }
};

exports.deactivateLocation = async (req, res) => {
    try {
        const location = await MeetingLocation.findByIdAndUpdate(req.params.locationId, { active: false, updatedBy: req.user.id }, { new: true });
        if (!location) return res.status(404).json({ success: false, message: "Meeting location not found" });
        return res.json({ success: true, data: location });
    } catch (error) { return res.status(400).json({ success: false, message: "Could not deactivate meeting location" }); }
};

exports.isTimeWithinRange = (time, location) => validTime(time) && minutes(time) >= minutes(location.startTime) && minutes(time) <= minutes(location.endTime);
