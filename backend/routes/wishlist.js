const express = require("express");
const { auth } = require("../middlewares/auth");
const { getWishlist, addToWishlist, removeFromWishlist } = require("../controllers/wishlist");

const router = express.Router();

router.use(auth);
router.get("/", getWishlist);
router.post("/", addToWishlist);
router.delete("/", removeFromWishlist);

module.exports = router;
