const { verify } = require("jsonwebtoken");

require("dotenv").config();

const verifyLoginToken = (req, res, next) => {
  try {
    if (!req.headers.logintoken) throw new Error("Unauthorized action.");

    const { logintoken } = req.headers;

    const { id } = verify(logintoken, process.env.LOGIN_SECRET_KEY);

    if (!id) throw new Error("Invalid Token");

    req.body.id;
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
