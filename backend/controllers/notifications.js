const Notification = require("../models/Notification");

exports.listNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({ recipient: req.user.id }).sort({ createdAt: -1 }).limit(50).lean();
        const unreadCount = notifications.filter((item) => !item.readAt).length;
        return res.json({ success: true, data: { notifications, unreadCount } });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Could not load notifications" });
    }
};

exports.markNotificationRead = async (req, res) => {
    try {
        const notification = await Notification.findOneAndUpdate(
            { _id: req.params.notificationId, recipient: req.user.id },
            { $set: { readAt: new Date() } }, { new: true }
        );
        if (!notification) return res.status(404).json({ success: false, message: "Notification not found" });
        return res.json({ success: true, data: notification });
    } catch (error) {
        return res.status(400).json({ success: false, message: "Could not update notification" });
    }
};

exports.markAllNotificationsRead = async (req, res) => {
    try {
        await Notification.updateMany({ recipient: req.user.id, readAt: null }, { $set: { readAt: new Date() } });
        return res.json({ success: true });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Could not update notifications" });
    }
};
