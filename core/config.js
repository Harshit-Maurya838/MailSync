require("dotenv").config();

function cleanValue(str) {
  if (!str) return "";
  return str.trim().replace(/^['"]|['"]$/g, "").trim();
}

/**
 * Parses comma-separated user emails and passwords into a structured account list.
 * Supports single account or multi-account failover lists:
 * EMAIL_USER="mail1@gmail.com, mail2@gmail.com"
 * EMAIL_PASSWORD="pass1, pass2"
 */
function parseAccounts(customEnv = process.env) {
  const usersRaw = customEnv.EMAIL_USER || "";
  const passwordsRaw = customEnv.EMAIL_PASSWORD || customEnv.EMAIL_PASS || "";

  const users = usersRaw
    ? usersRaw.split(",").map(cleanValue).filter(Boolean)
    : [];
  const passwords = passwordsRaw
    ? passwordsRaw.split(",").map(cleanValue).filter(Boolean)
    : [];

  const count = Math.max(users.length, passwords.length);
  const accounts = [];

  for (let i = 0; i < count; i++) {
    const user = users[i] || users[0] || "";
    const pass = passwords[i] || passwords[0] || "";
    if (user && pass) {
      accounts.push({ user, pass, index: i });
    }
  }

  return accounts;
}

const accounts = parseAccounts();
const primaryAccount = accounts[0] || { user: "", pass: "" };
const emailUser = primaryAccount.user;
const fromName = process.env.FROM_NAME || "MailSync";
const emailFrom =
  process.env.EMAIL_FROM ||
  (emailUser ? `"${fromName}" <${emailUser}>` : `"${fromName}" <noreply@mailsync.com>`);

module.exports = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || "development",
  emailService: process.env.EMAIL_SERVICE || "gmail",
  emailUser,
  emailPassword: primaryAccount.pass,
  accounts,
  getAccounts: parseAccounts,
  fromName,
  emailFrom,
  accessKey: process.env.ACCESS_KEY || process.env.API_KEY || "",
};
