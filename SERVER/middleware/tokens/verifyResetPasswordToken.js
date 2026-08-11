const { verify } = require("jsonwebtoken");

require("dotenv").config();

const verifyResetTokenPassword = (resetToken) => {
  try {
    if (!resetToken) throw new Error("Unauthorized action.");

    const { id } = verify(resetToken, process.env.RESET_SECRET_KEY);

    if (id) return true;
  } catch (err) {
    if (
      err?.message === ("jwt expired" || "invalid token" || "jwt malformed")
    ) {
      return false;
    } else {
      return false;
    }
  }
};

module.exports = { verifyResetTokenPassword };
