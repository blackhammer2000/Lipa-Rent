const { verify } = require("jsonwebtoken");
const { signAccessToken } = require("../../../../middleware/tokens/accessToken");
const { signRefreshToken } = require("../../../../middleware/tokens/refreshToken");
const { RefreshToken } = require("../../../../middleware/models/RefreshToken");

const { Subscription } = require("../../../../middleware/models/Subscription");
const { checkSubscriptionExpiry } = require("../../helpers/checkSubscription");

const refreshTokenControllers = {
  //? REFRESH ACCESS TOKEN USING REFRESH TOKEN COOKIE (TOKEN ROTATION)
  refresh: async (req, res) => {
    try {
      const refreshToken = req.cookies.refreshToken;

      if (!refreshToken) {
        return res
          .status(401)
          .json({ error: "Refresh token required. Please log in again." });
      }

      // Verify the refresh token signature
      let decoded;
      try {
        decoded = verify(refreshToken, process.env.REFRESH_SECRET_KEY, {
          algorithms: [process.env.TOKEN_HASHING_ALGO],
          issuer: "LipaRent Inc.",
        });
      } catch (err) {
        return res
          .status(401)
          .json({ error: "Invalid or expired refresh token." });
      }

      const { id } = decoded;

      // Look up the stored refresh token
      const storedToken = await RefreshToken.findOne({
        ownerID: id,
        token: refreshToken,
        isRevoked: false,
      });

      if (!storedToken) {
        return res
          .status(401)
          .json({ error: "Refresh token not found or already revoked." });
      }

      // Check expiry
      if (storedToken.expiresAt < new Date()) {
        await RefreshToken.deleteOne({ _id: storedToken._id });
        return res
          .status(401)
          .json({ error: "Refresh token expired. Please log in again." });
      }

      // --- TOKEN ROTATION: revoke old refresh token ---
      storedToken.isRevoked = true;
      await storedToken.save();

      // Fetch user subscription for new access token
      const { currentSubscription } = await Subscription.findOne({
        ownerID: id,
      });

      if (!currentSubscription) {
        return res.status(403).json({ error: "Subscribe to proceed." });
      }

      const isSubscriptionExpired = checkSubscriptionExpiry(
        currentSubscription,
      );

      if (isSubscriptionExpired && isSubscriptionExpired.error) {
        return res.status(403).json({ error: isSubscriptionExpired.error });
      }

      // Sign new access token (2h)
      const userData = {
        id,
        email: decoded.email,
        currentSubscription,
        disabled: decoded.disabled,
        otp: false,
      };

      const accessToken = await signAccessToken(userData);

      if (!accessToken) throw new Error(accessToken);

      // Sign new refresh token (7d) and store
      const newRefreshToken = await signRefreshToken(userData);

      if (!newRefreshToken) throw new Error(newRefreshToken);

      const newRefreshTokenDoc = await RefreshToken.create({
        ownerID: id,
        token: newRefreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      });

      if (!newRefreshTokenDoc) throw new Error("Failed to store refresh token.");

      // Set new refresh token as HttpOnly, Secure cookie
      res.cookie("refreshToken", newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: "/",
      });

      res.status(200).json({
        message: "Access token refreshed successfully",
        token: accessToken,
      });
    } catch (err) {
      if (err?.message)
        res.status(500).json({ error: err?.message, response_status: "danger" });
    }
  },
};

module.exports = refreshTokenControllers;