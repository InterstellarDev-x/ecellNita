const User = require("../models/User");

const requireRole = (...allowedRoles) => async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id).select("roles accounttype accountStatus");
        if (!user || (user.accountStatus && user.accountStatus !== "active")) {
            return res.status(403).json({ success: false, message: "Account is not permitted to perform this action" });
        }

        const roles = new Set(user.roles || []);
        if (user.accounttype === "Admin") roles.add("admin");
        if (!allowedRoles.some((role) => roles.has(role))) {
            return res.status(403).json({ success: false, message: "You are not authorized to access this area" });
        }

        req.currentUser = user;
        return next();
    } catch (error) {
        return res.status(500).json({ success: false, message: "Could not verify account permissions" });
    }
};

module.exports = { requireRole };
