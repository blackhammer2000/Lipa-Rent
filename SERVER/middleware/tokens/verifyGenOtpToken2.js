const { verify } = require("jsonwebtoken");

require("dotenv").config();

const verifyGenOtpToken = (req, res, next) => {
  try {
    if (!req.headers.logintoken) throw new Error("Unauthorized action.");

    const { logintoken } = req.headers;

    const { id, currentSubscription, disabled } = verify(
      logintoken,
      process.env.LOGIN_SECRET_KEY2
    );

    if (!id || !currentSubscription || !disabled)
      throw new Error("Invalid Token");

    req.body.id = id;
    req.body.currentSubscription = currentSubscription;
    req.body.disabled = disabled;

    delete req.headers.logintoken;

    next();
  } catch (err) {
    if (
      err?.message === ("jwt expired" || "invalid token" || "jwt malformed")
    ) {
      res.status(403).json({ error: "session expired" });
    } else {
      res.status(500).json({ error: err?.message });
    }
  }
};

module.exports = { verifyGenOtpToken };
