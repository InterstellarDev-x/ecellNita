const { button, emailLayout, escapeHtml } = require("./emailLayout");

const appUrl = () => (process.env.HOST || "http://localhost:3000").split(",")[0].trim().replace(/\/$/, "");

exports.shedulevenue = ({ recipientName, counterpartName, productname, venue, date, time, quantity, recipientRole }) => emailLayout({
    title: "Your pickup is confirmed",
    preview: `${productname} pickup confirmed for ${date} at ${time}.`,
    eyebrow: "MEETING CONFIRMED",
    content: `<p style="margin-top:0;">Hi ${escapeHtml(recipientName)},</p>
      <p>Your ${escapeHtml(recipientRole)} pickup with <strong>${escapeHtml(counterpartName)}</strong> has been confirmed.</p>
      <div style="margin:20px 0;padding:16px;border-radius:12px;background:#f4f8f1;">
        <div style="margin-bottom:12px;font-size:17px;font-weight:800;color:#0b2f24;">${escapeHtml(productname)}</div>
        <div style="margin:5px 0;"><strong>Quantity:</strong> ${escapeHtml(quantity)}</div>
        <div style="margin:5px 0;"><strong>Meet at:</strong> ${escapeHtml(venue)}</div>
        <div style="margin:5px 0;"><strong>Date:</strong> ${escapeHtml(date)}</div>
        <div style="margin:5px 0;"><strong>Time:</strong> ${escapeHtml(time)}</div>
      </div>
      <p style="margin-bottom:0;">Please arrive on time and complete the handoff safely on campus.</p>`,
    action: button(`${appUrl()}/${recipientRole === "purchase" ? "buyer" : "seller"}/product-requests`, "View pickup details"),
});
