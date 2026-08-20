const express = require("express");
const { auth } = require("../middlewares/auth");
const { requireRole } = require("../middlewares/roles");
const admin = require("../controllers/admin");

const router = express.Router();
router.use(auth, requireRole("admin", "moderator"));
router.get("/dashboard", admin.dashboard);
router.get("/products", admin.listProducts);
router.get("/users", admin.listUsers);
router.get("/submissions", admin.listSubmissions);
router.post("/submissions/:submissionId/review", admin.reviewSubmission);
router.get("/settings", requireRole("admin"), admin.getSettings);
router.put("/settings", requireRole("admin"), admin.updateSettings);
router.patch("/users/:userId/status", requireRole("admin"), admin.updateUserStatus);
module.exports = router;
