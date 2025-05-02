function generateOTP() {
  return crypto.randomUUID().slice(-6);
}

module.exports = { generateOTP };
