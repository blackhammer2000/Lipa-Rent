const { verify } = require("jsonwebtoken");

require("dotenv").config();

const verifySignUpToken = (req, res, next) => {
  try {
    if (!req.headers.signuptoken) throw new Error("Unauthorized action.");

    const { signuptoken } = req.headers;

    const { id, otp, otpVerified } = verify(
      signuptoken,
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

    delete req.headers.signuptoken;

    next();
  } catch (err) {
    res.status(500).json({ error: err?.message });
  }
};

module.exports = { verifySignUpToken };
