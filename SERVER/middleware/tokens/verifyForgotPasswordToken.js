const { verify } = require("jsonwebtoken");

require("dotenv").config();

const verifyForgotPasswordToken = (req, res, next) => {
  try {
    if (!req.headers.token) throw new Error("Unauthorized action.");

    const { token } = req.headers;

    const { id, email } = verify(token, process.env.FORGOT_SECRET_KEY);

    if (!id || !email) throw new Error("Unauthorized action.");

    req.body.id = id;
    req.body.email = email;

    delete req.headers.token;

    next();
  } catch (err) {
    if (
      err?.message === ("jwt expired" || "invalid token" || "jwt malformed")
    ) {
      res.status(403).json({ error: "Unauthorized action." });
    } else {
      res.status(500).json({ error: err?.message });
    }
  }
};

module.exports = { verifyForgotPasswordToken };
