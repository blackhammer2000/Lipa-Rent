require("dotenv").config();
const { verify } = require("jsonwebtoken");
const { Otp } = require("../models/Otp");
const { Password } = require("../models/Password");

const {
  checkSubscriptionExpiry,
} = require("../../routes/users/helpers/checkSubscription");

const verifyUserAccessToken = async (req, res, next) => {
  try {
    if (!req.headers.token) throw new Error("Access Denied.");

    const {
      headers: { token },
    } = req;

    const { id, email, currentSubscription, user, disabled, tokenVersion } =
      verify(token, process.env.ACCESS_SECRET_KEY);

    if (!user) throw new Error("Unauthorized action, unknown role.");

    if (user && disabled === true) throw new Error("Account has been disabled");

    if (!id || (!currentSubscription && user))
      throw new Error("Please Log in again...");

    const isSubscriptionExpired = user
      ? checkSubscriptionExpiry(currentSubscription)
      : null;

    if (user && isSubscriptionExpired)
      throw new Error(isSubscriptionExpired?.error);

    // Token version check: reject tokens issued before the latest logout
    const passwordDoc = await Password.findOne({ ownerID: id });
    const currentVersion = passwordDoc?.tokenVersion ?? 0;

    if ((tokenVersion ?? 0) !== currentVersion) {
      throw new Error("Session has been invalidated, please log in again.");
    }

    req.body.id = id;
    req.body.email = email;

    user ? (req.body.user = user) : null;

    delete req.headers.token;

    next();
  } catch (err) {
    if (
      err?.message === "jwt expired" ||
      err?.message === "invalid token" ||
      err?.message === "jwt malformed"
    ) {
      res.status(403).json({ error: "session expired" });
    } else {
      res.status(500).json({ error: err?.message });
    }
  }
};

module.exports = { verifyUserAccessToken };
