const express = require("express");
const router = express.Router();
const config = require("./config");
const { getTransporterCacheStats } = require("./mailer");

const serverStartTime = Date.now();
const endpointHitCounts = {
  mail: 0,
};

router.get("/", (req, res) => {
  const uptime = Math.floor((Date.now() - serverStartTime) / 1000);
  const accounts = config.getAccounts();

  res.status(200).json({
    service: "MailSync API",
    version: "1.1.0",
    status: "healthy",
    uptime: `${uptime}s`,
    startTime: new Date(serverStartTime).toISOString(),
    currentTime: new Date().toISOString(),
    smtpConfigured: accounts.length > 0,
    accountsConfigured: accounts.length,
    activeAccounts: accounts.map((a) => a.user),
    failoverEnabled: accounts.length > 1,
    transporterCache: getTransporterCacheStats(),
    authRequired: Boolean(config.accessKey),
    endpointHitCounts,
  });
});

module.exports = { router, endpointHitCounts };
