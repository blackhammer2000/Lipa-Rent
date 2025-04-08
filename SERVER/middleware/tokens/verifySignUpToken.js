const { verify } = require("jsonwebtoken");

require("dotenv").config();

const verifySignUpToken = (req, res, next) => {
  try {
    if (!req.headers.signUpToken) throw new Error("Unauthorized action.");

    const { signUpToken } = req.headers;

    const { id, otp, otpVerified } = verify(
      signUpToken,
      process.env.SIGNUP_SECRET_KEY
    );

    if (
      id !== (null || undefined) &&
      otp !== (null || undefined) &&
      otpVerified === (null || undefined)
    ) {
      req.body.id = id;
      req.body.otp = otp;
    }

    if (
      id !== (null || undefined) &&
      otp === (null || undefined) &&
      otpVerified !== (null || undefined)
    )
      req.body.id = id;

    delete req.headers.signUpToken;

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

module.exports = { verifySignUpToken };
