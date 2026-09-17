const escapeHtml = (value = "") => String(value)
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;")
  .replace(/'/g, "&#39;");

const button = (href, label) => `
  <a href="${escapeHtml(href)}" style="display:inline-block;padding:13px 20px;border-radius:999px;background:#159a63;color:#ffffff;font:700 14px Arial,sans-serif;text-decoration:none;">
    ${escapeHtml(label)}
  </a>`;

const emailLayout = ({ title, preview, eyebrow = "RECYCOOL", content, action, footer = "Need help? Reply to this email and our team will be happy to assist." }) => `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(title)}</title>
  </head>
  <body style="margin:0;padding:0;background:#f3f6ee;color:#173b2c;font-family:Arial,Helvetica,sans-serif;">
    <span style="display:none!important;visibility:hidden;opacity:0;color:transparent;height:0;width:0;overflow:hidden;">${escapeHtml(preview || title)}</span>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="padding:32px 16px;background:#f3f6ee;">
      <tr><td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;overflow:hidden;border-radius:20px;background:#fffef9;box-shadow:0 10px 30px rgba(11,47,36,.10);">
          <tr><td style="padding:26px 32px;background:#0b2f24;color:#ffffff;">
            <div style="margin-bottom:7px;color:#c7f542;font-size:11px;font-weight:800;letter-spacing:1.5px;">${escapeHtml(eyebrow)}</div>
            <div style="font-size:27px;font-weight:800;letter-spacing:-.5px;">${escapeHtml(title)}</div>
          </td></tr>
          <tr><td style="padding:30px 32px;font-size:15px;line-height:1.6;color:#3d5d50;">${content}${action ? `<div style="margin-top:24px;">${action}</div>` : ""}</td></tr>
          <tr><td style="padding:18px 32px;border-top:1px solid #e1e9df;font-size:12px;line-height:1.5;color:#6d8178;">${escapeHtml(footer)}</td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;

module.exports = { button, emailLayout, escapeHtml };
