const { button, emailLayout, escapeHtml } = require("./emailLayout");

exports.forgotpasswordtemplate = (email, link) => emailLayout({
    title: "Reset your password",
    preview: "Use this secure link to set a new RecyCool password.",
    eyebrow: "ACCOUNT SECURITY",
    content: `<p style="margin-top:0;">We received a password-reset request for <strong>${escapeHtml(email)}</strong>.</p>
      <p>Use the button below to choose a new password. This secure link expires in <strong>5 minutes</strong>.</p>
      <p style="margin-bottom:0;">If you did not request this, you can safely ignore this email.</p>`,
    action: button(link, "Reset password"),
});
