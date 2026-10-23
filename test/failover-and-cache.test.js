const assert = require("assert");
const config = require("../core/config");
const mailer = require("../core/mailer");
const nodemailer = require("nodemailer");

console.log("=========================================");
console.log(" Running MailSync Failover & Cache Tests");
console.log("=========================================\n");

// --- TEST 1: Multi-Account Parsing ---
console.log("Test 1: Parsing comma-separated credentials");
const sampleEnv = {
  EMAIL_USER: "mail1@gmail.com, mail2@gmail.com, 'mail3@gmail.com'",
  EMAIL_PASSWORD: "pass1, pass2, pass3",
};

const parsed = config.getAccounts(sampleEnv);
assert.strictEqual(parsed.length, 3, "Should parse 3 accounts");
assert.strictEqual(parsed[0].user, "mail1@gmail.com");
assert.strictEqual(parsed[0].pass, "pass1");
assert.strictEqual(parsed[1].user, "mail2@gmail.com");
assert.strictEqual(parsed[1].pass, "pass2");
assert.strictEqual(parsed[2].user, "mail3@gmail.com");
assert.strictEqual(parsed[2].pass, "pass3");
console.log("✓ Multi-account credentials parsed correctly with quotes and spacing stripped.\n");

// --- TEST 2: Transporter Caching & Re-use ---
console.log("Test 2: Transporter Caching outside request handler scope");
mailer.clearTransporterCache();
const initialStats = mailer.getTransporterCacheStats();
assert.strictEqual(initialStats.cachedCount, 0, "Cache should be empty initially");

const acc1 = { user: "test1@gmail.com", pass: "app-pass-1" };
const t1 = mailer.getTransporter(acc1);
const t2 = mailer.getTransporter(acc1);

assert.strictEqual(t1, t2, "Second call for the same account must return the exact same cached transporter instance");
const afterFirstStats = mailer.getTransporterCacheStats();
assert.strictEqual(afterFirstStats.cachedCount, 1, "Cache size should be 1");
assert(afterFirstStats.cachedAccounts.includes("gmail:test1@gmail.com"), "Cache should contain gmail:test1@gmail.com");

const acc2 = { user: "test2@gmail.com", pass: "app-pass-2" };
const t3 = mailer.getTransporter(acc2);
assert.notStrictEqual(t1, t3, "Different account must get its own cached transporter instance");
const afterSecondStats = mailer.getTransporterCacheStats();
assert.strictEqual(afterSecondStats.cachedCount, 2, "Cache size should now be 2");

mailer.clearTransporterCache();
assert.strictEqual(mailer.getTransporterCacheStats().cachedCount, 0, "Cache cleared successfully");
console.log("✓ Transporter caching verified: pooled instances are reused across calls.\n");

// --- TEST 3: Dynamic Multi-Account Failover Simulation ---
console.log("Test 3: Dynamic Failover on Rate-Limit / SMTP Error");

// Temporarily stub nodemailer.createTransport to simulate failover
const originalCreateTransport = nodemailer.createTransport;

let callCount = 0;
const attemptedUsers = [];

nodemailer.createTransport = function (opts) {
  const user = opts.auth?.user;
  return {
    sendMail: async function (mailOptions) {
      callCount++;
      attemptedUsers.push(user);
      if (user === "primary-fail@gmail.com") {
        const rateLimitErr = new Error("452 4.5.3 Daily user sending quota exceeded");
        rateLimitErr.responseCode = 452;
        throw rateLimitErr;
      }
      return {
        messageId: "<mock-success-id@gmail.com>",
        response: "250 2.0.0 OK",
      };
    },
    verify: async function () {
      return true;
    },
    close: function () {},
  };
};

(async () => {
  try {
    // Override getAccounts temporarily for this test
    const originalGetAccounts = config.getAccounts;
    config.getAccounts = () => [
      { user: "primary-fail@gmail.com", pass: "pass1" },
      { user: "backup-success@gmail.com", pass: "pass2" },
    ];

    mailer.clearTransporterCache();

    const result = await mailer.sendMail({
      to: "recipient@example.com",
      subject: "Test Failover",
      message: "This should fail over to backup account.",
      fromName: "Failover Test",
    });

    assert.strictEqual(result.sentVia, "backup-success@gmail.com", "Must report sentVia as the successful backup account");
    assert.strictEqual(result.attempt, 2, "Must report attempt 2");
    assert.strictEqual(callCount, 2, "Must have called sendMail twice (1 fail + 1 success)");
    assert.deepStrictEqual(attemptedUsers, ["primary-fail@gmail.com", "backup-success@gmail.com"], "Must have attempted primary then backup");

    console.log("✓ Dynamic failover successfully tried primary, caught 452 rate limit, and instantly delivered via backup account!\n");

    // --- TEST 4: Aggregated Failure if All Accounts Fail ---
    console.log("Test 4: Aggregated Failure when all accounts fail");
    config.getAccounts = () => [
      { user: "primary-fail@gmail.com", pass: "pass1" },
      { user: "primary-fail@gmail.com", pass: "pass2" },
    ];
    mailer.clearTransporterCache();

    let threwError = false;
    try {
      await mailer.sendMail({
        to: "recipient@example.com",
        message: "This should fail completely.",
      });
    } catch (err) {
      threwError = true;
      assert(err.message.includes("Failed to send email to recipient@example.com after trying 2 account(s)"));
      assert.strictEqual(err.attempts, 2);
    }
    assert(threwError, "Should throw error when all accounts fail");
    console.log("✓ Aggregated error thrown cleanly when all fallback accounts fail.\n");

    // Restore stubs
    nodemailer.createTransport = originalCreateTransport;
    config.getAccounts = originalGetAccounts;
    mailer.clearTransporterCache();

    console.log("🎉 ALL TESTS PASSED SUCCESSFULLY!");
  } catch (err) {
    nodemailer.createTransport = originalCreateTransport;
    mailer.clearTransporterCache();
    console.error("Test failed:", err);
    process.exit(1);
  }
})();
