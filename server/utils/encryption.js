const crypto = require("crypto");

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

/**
 * Generate encryption key (run once)
 */
function generateEncryptionKey() {
  return crypto.randomBytes(32).toString("hex");
}

module.exports = {
  generateEncryptionKey,
};