const { emailLayout, escapeHtml } = require("./emailLayout");

exports.otptemplate = (otp) => emailLayout({
    title: "Verify your email",
    preview: "Use this code to finish creating your RecyCool account.",
    eyebrow: "ACCOUNT SECURITY",
    content: `<p style="margin-top:0;">Use the verification code below to finish creating your RecyCool account.</p>
      <div style="margin:22px 0;padding:17px;border-radius:14px;background:#eef8f1;color:#0b2f24;font-size:28px;font-weight:800;letter-spacing:7px;text-align:center;">${escapeHtml(otp)}</div>
      <p style="margin-bottom:0;">This code expires in <strong>5 minutes</strong>. Never share it with anyone.</p>`,
});
