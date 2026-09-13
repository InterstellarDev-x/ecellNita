const router = require("express").Router();
const { rateLimit } = require("express-rate-limit");
const { auth } = require("../middlewares/auth");
const controller = require("../controllers/chat");
router.use(auth);
router.get("/", controller.list);
router.post("/", rateLimit({ windowMs: 60000, limit: 30, keyGenerator: (req) => req.user.id,
    message: { success: false, message: "Please wait before starting another conversation" } }), controller.start);
router.post("/from-question", controller.continueQuestion);
router.get("/meeting-locations", controller.meetingLocations);
router.post("/:threadId/images", rateLimit({ windowMs: 60000, limit: 10, keyGenerator: (req) => req.user.id,
    message: { success: false, message: "Please wait before uploading another image" } }), controller.uploadImage);
router.get("/:threadId", controller.detail);
router.get("/:threadId/messages", controller.messages);
module.exports = router;
