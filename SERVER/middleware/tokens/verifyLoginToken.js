const { verify } = require("jsonwebtoken");

require("dotenv").config();

const verifyLoginToken = (req, res, next) => {
  try {
    if (!req.headers.logintoken) throw new Error("Unauthorized action.");

    const { logintoken } = req.headers;

    const { id, currentSubscription, disabled, otp } = verify(
      logintoken,
      process.env.LOGIN_SECRET_KEY
    );

    if (
      id &&
      currentSubscription &&
      disabled !== (null || undefined) &&
      otp !== (null || undefined)
    ) {
      req.body.id = id;
      req.body.currentSubscription = currentSubscription;
      req.body.disabled = disabled;
      req.body.otp = otp;
    }

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

module.exports = { verifyLoginToken };
