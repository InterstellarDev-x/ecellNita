const express = require("express");
const { auth } = require("../middlewares/auth");
const notifications = require("../controllers/notifications");

const router = express.Router();
router.use(auth);
router.get("/", notifications.listNotifications);
router.patch("/read-all", notifications.markAllNotificationsRead);
router.patch("/:notificationId/read", notifications.markNotificationRead);

module.exports = router;
