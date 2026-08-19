const { verify } = require("jsonwebtoken");

require("dotenv").config();

const verifySignUpToken = (req, res, next) => {
  try {
    if (!req.headers.token) throw new Error("Unauthorized action.");

    const { token } = req.headers;

    const { id, otp, otpVerified, repeat } = verify(
      token,
      process.env.SIGNUP_SECRET_KEY
    );

    if (
      id !== (null || undefined) &&
      otp !== (null || undefined) &&
      otpVerified === (null || undefined)
    ) {
      req.body.id = id;
      req.body.otp = repeat ? req.headers.otp : otp;
    }

    if (
      id !== (null || undefined) &&
      otp === (null || undefined) &&
      otpVerified !== (null || undefined)
    ){
      req.body.id = id;
      req.body.otpVerified = otpVerified;
    }

    delete req.headers.token;

    next();
  } catch (err) {
    res.status(500).json({ error: err?.message });
  }
};

module.exports = { verifySignUpToken };
