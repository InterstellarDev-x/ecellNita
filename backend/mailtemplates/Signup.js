const { button, emailLayout, escapeHtml } = require("./emailLayout");

exports.signuptemplate = (role) => emailLayout({
    title: "Welcome to RecyCool",
    preview: "Your account is ready to use.",
    eyebrow: "YOU'RE ALL SET",
    content: `<p style="margin-top:0;">Your account has been created successfully.</p>
      <p>You're joining RecyCool as a <strong>${escapeHtml(role)}</strong>. Buy useful items from fellow students, or list the things you no longer need.</p>`,
    action: button(`${(process.env.HOST || "http://localhost:3000").split(",")[0].trim().replace(/\/$/, "")}/login`, "Go to RecyCool"),
});
