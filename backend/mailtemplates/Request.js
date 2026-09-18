const { button, emailLayout, escapeHtml } = require("./emailLayout");

const appUrl = () => (process.env.HOST || "http://localhost:3000").split(",")[0].trim().replace(/\/$/, "");

exports.requestproduct = (buyername, sellername, productname, quantity) => emailLayout({
    title: "New request for your listing",
    preview: `${buyername} would like to buy ${productname}.`,
    eyebrow: "SELLER UPDATE",
    content: `<p style="margin-top:0;">Hi ${escapeHtml(sellername)},</p>
      <p><strong>${escapeHtml(buyername)}</strong> would like to buy your listing, <strong>${escapeHtml(productname)}</strong>.</p>
      <div style="margin:20px 0;padding:16px;border-radius:12px;background:#f4f8f1;">
        <div style="margin-bottom:5px;font-size:12px;font-weight:700;letter-spacing:.7px;color:#6d8178;text-transform:uppercase;">Quantity requested</div>
        <div style="font-size:22px;font-weight:800;color:#0b2f24;">${escapeHtml(quantity)}</div>
      </div>
      <p style="margin-bottom:0;">Review the request in your seller workspace to decide what to do next.</p>`,
    action: button(`${appUrl()}/seller/product-requests`, "Review request"),
});
