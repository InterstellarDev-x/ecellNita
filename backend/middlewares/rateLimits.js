const { rateLimit } = require("express-rate-limit");

const createAuthLimiter = (max, message) => rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: max,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: { success: false, message },
});

module.exports = {
    loginLimiter: createAuthLimiter(10, "Too many sign-in attempts. Try again in 15 minutes"),
    otpLimiter: createAuthLimiter(5, "Too many OTP requests. Try again in 15 minutes"),
    signupLimiter: createAuthLimiter(10, "Too many signup attempts. Try again in 15 minutes"),
    passwordResetLimiter: createAuthLimiter(5, "Too many password-reset attempts. Try again in 15 minutes"),
};
