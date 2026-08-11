function generateOTP() {
  return crypto.randomUUID().slice(-6);
}

function generateOTPExpiryTime() {
  return Date.now() + 10 * 60 * 1000;
}

module.exports = { generateOTP, generateOTPExpiryTime };
