const express = require("express");
const { auth } = require("../middlewares/auth");
const { requireRole } = require("../middlewares/roles");
const featureRequests = require("../controllers/featureRequests");

const router = express.Router();
router.post("/", auth, featureRequests.createFeatureRequest);
router.get("/", auth, requireRole("admin", "moderator"), featureRequests.listFeatureRequests);

module.exports = router;
