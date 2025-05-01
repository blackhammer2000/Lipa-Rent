function genarateOTP() {
  return crypto.randomUUID().slice(-6);
}

module.exports = { genarateOTP };
