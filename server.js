const express = require("express");
const cors = require("cors");
const path = require("path");
const config = require("./core/config");
const logger = require("./core/logger");
const verifyApiKey = require("./core/auth");
const { sendMail, verifyTransporter } = require("./core/mailer");
const { router: serverInformation, endpointHitCounts } = require("./core/serverInformation");

const app = express();

// Middlewares
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Serve static assets from public folder
app.use(express.static(path.join(__dirname, "public")));

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`);
  next();
});

// Root: Serve MailSync documentation & interactive web UI
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "pages", "index.html"));
});

// Health check endpoint
app.get(["/health", "/api/health"], (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "MailSync",
    timestamp: new Date().toISOString(),
  });
});

// Server Information & Hit stats
app.use(["/server-info", "/api/info"], serverInformation);

// Diagnostic logs endpoint
app.get(["/logs", "/api/logs"], (req, res) => {
  res.status(200).json({ logs: logger.getRecentLogs() });
});

// SMTP Connection Verification endpoint
app.get("/api/verify", async (req, res) => {
  try {
    const verification = await verifyTransporter();
    res.status(200).json({
      success: true,
      message: "Transporter verified successfully. Ready to send emails.",
      verification,
    });
  } catch (error) {
    logger.error(`Transporter verification failed: ${error.message}`);
    res.status(500).json({
      success: false,
      error: "Transporter verification failed",
      details: error.message,
    });
  }
});

// Core Email Sending Endpoint: POST /mail & POST /api/mail
const handleSendMail = async (req, res) => {
  endpointHitCounts.mail++;

  const { email, to, name, fromName, from, subject, message, html } = req.body;
  const recipient = email || to;

  if (!recipient) {
    return res.status(400).json({
      success: false,
      error: "Missing required field: 'email' (or 'to') is required.",
    });
  }

  if (!message && !html) {
    return res.status(400).json({
      success: false,
      error: "Missing required field: either 'message' or 'html' is required.",
    });
  }

  // Basic email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(recipient)) {
    return res.status(400).json({
      success: false,
      error: `Invalid email address format: '${recipient}'.`,
    });
  }

  try {
    const info = await sendMail({
      email: recipient,
      name,
      fromName,
      from,
      subject,
      message,
      html,
    });

    res.status(200).json({
      success: true,
      message: "Email sent successfully",
      messageId: info.messageId,
      recipient,
      sentVia: info.sentVia,
      attempt: info.attempt,
      totalAccounts: info.totalAccounts,
    });
  } catch (error) {
    logger.error(`Error sending email to ${recipient}: ${error.message}`);
    res.status(500).json({
      success: false,
      error: "Failed to send email",
      details: error.details || error.message,
    });
  }
};

app.post("/mail", verifyApiKey, handleSendMail);
app.post("/api/mail", verifyApiKey, handleSendMail);

// 404 handler for unknown routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Endpoint not found",
    message: "Use POST /mail to send emails. Visit GET / for API documentation.",
  });
});

// Start local server if run directly
if (require.main === module) {
  app.listen(config.port, () => {
    logger.info(`MailSync server running on port ${config.port}`);
    console.log(`MailSync server active: http://localhost:${config.port}`);
  });
}

module.exports = app;
