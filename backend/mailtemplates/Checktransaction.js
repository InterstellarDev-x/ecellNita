const { emailLayout, escapeHtml } = require("./emailLayout");

exports.checktransactiontemplate = (productname, otp) => emailLayout({
    title: "Confirm your pickup",
    preview: `Your verification code for ${productname}.`,
    eyebrow: "PICKUP VERIFICATION",
    content: `<p style="margin-top:0;">You're confirming the pickup of <strong>${escapeHtml(productname)}</strong>.</p>
      <div style="margin:22px 0;padding:17px;border-radius:14px;background:#eef8f1;color:#0b2f24;font-size:28px;font-weight:800;letter-spacing:7px;text-align:center;">${escapeHtml(otp)}</div>
      <p style="margin-bottom:0;">Enter this code in RecyCool to complete the transaction. It expires in <strong>5 minutes</strong>; do not share it with the seller.</p>`,
});
