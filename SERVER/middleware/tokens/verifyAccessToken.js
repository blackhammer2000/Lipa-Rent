const { verify } = require("jsonwebtoken");

const {
  checkSubscriptionExpiry,
} = require("../../routes/users/helpers/checkSubscription");

require("dotenv").config();

const verifyAccessToken = (req, res, next) => {
  try {
    if (!req.headers.token) throw new Error("Access Denied.");

    const {
      headers: { token },
    } = req;

    const { _id, currentSbuscription, user, admin, disabled } = verify(
      token,
      process.env.MY_SECRET_KEY
    );

    if (!admin && !user) throw new Error("Unauthorized action, unknown role.");

    if (user && !admin && disabled === true) throw new Error("session expired");

    if (!_id || (!currentSbuscription && user))
      throw new Error("Please Log in again...");

    const isSubscriptionExpired = user
      ? checkSubscriptionExpiry(currentSbuscription)
      : null;

    if (user && isSubscriptionExpired)
      throw new Error(isSubscriptionExpired?.error);

    req.body.id = _id;

    user ? (req.body.user = user) : admin ? (req.body.admin = admin) : null;

    delete req.headers.token;

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

module.exports = { verifyAccessToken };
