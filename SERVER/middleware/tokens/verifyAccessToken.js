require("dotenv").config();
const { verify } = require("jsonwebtoken");
const { Otp } = require("../models/Otp");

const {
  checkSubscriptionExpiry,
} = require("../../routes/users/helpers/checkSubscription");

const verifyUserAccessToken = async (req, res, next) => {
  try {
    if (!req.headers.token) throw new Error("Access Denied.");

    const {
      headers: { token },
    } = req;

    var { id, currentSubscription, user, disabled } = verify(
      token,
      process.env.MY_SECRET_KEY
    );

    if (!user) throw new Error("Unauthorized action, unknown role.");

    if (user && disabled === true) throw new Error("Account has been disabled");

    if (!id || (!currentSubscription && user))
      throw new Error("Please Log in again...");

    const isSubscriptionExpired = user
      ? checkSubscriptionExpiry(currentSubscription)
      : null;

    if (user && isSubscriptionExpired)
      throw new Error(isSubscriptionExpired?.error);

    req.body.id = id;

    user ? (req.body.user = user) : null;

    delete req?.headers.token;

    next();
  } catch (err) {
    if (err.message === ("jwt expired" || "invalid token" || "jwt malformed")) {
      const otpDocDeletion = await Otp.deleteOne({ ownerID: id });

      console.log(id);
      console.log(otpDocDeletion);

      if (!otpDocDeletion.acknowledged && !otpDocDeletion.deletedCount)
        res.status(403).json({ error: "something went wrong" });

      res.status(403).json({ error: "session expired" });
    } else {
      res.status(500).json({ error: err?.message });
    }
  }
};

module.exports = { verifyUserAccessToken };
