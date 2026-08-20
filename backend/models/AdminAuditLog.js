const mongoose = require("mongoose");

const adminAuditLogSchema = new mongoose.Schema({
    actor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    action: { type: String, required: true },
    targetType: { type: String, required: true },
    targetId: mongoose.Schema.Types.ObjectId,
    before: mongoose.Schema.Types.Mixed,
    after: mongoose.Schema.Types.Mixed,
}, { timestamps: true });

adminAuditLogSchema.index({ targetType: 1, targetId: 1, createdAt: -1 });
module.exports = mongoose.model("AdminAuditLog", adminAuditLogSchema);
