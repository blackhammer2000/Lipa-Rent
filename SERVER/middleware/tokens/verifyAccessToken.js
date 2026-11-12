require("dotenv").config();
const { verify } = require("jsonwebtoken");
const { Otp } = require("../models/Otp");
const { Password } = require("../models/Password");

const {
  checkSubscriptionExpiry,
} = require("../../routes/users/helpers/checkSubscription");

const verifyUserAccessToken = async (req, res, next) => {
  try {
    if (!req.cookies.accessToken) throw new Error("Access Denied.");

    const token = req.cookies.accessToken;

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

    next();
  } catch (err) {
    // Pass to global error handler (S12): logs server-side, returns generic in production
    next(err);
  }
};

module.exports = { verifyUserAccessToken };
