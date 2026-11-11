const { Password } = require("../../../../middleware/models/Password");
const { Otp } = require("../../../../middleware/models/Otp");
const { RefreshToken } = require("../../../../middleware/models/RefreshToken");

const logoutControllers = {
  //? logout

  logout: async (req, res) => {
    try {
      if (!req.body.id) throw new Error("Unauthorized action");

      const { id } = req.body;

      // Invalidate all existing access tokens for this user
      const invalidateTokens = await Password.updateOne(
        { ownerID: id },
        { $inc: { tokenVersion: 1 } },
      );

      if (!invalidateTokens.acknowledged)
        throw new Error("something went wrong, 'token invalidation'");

      // Revoke all refresh tokens for this user
      await RefreshToken.updateMany(
        { ownerID: id, isRevoked: false },
        { $set: { isRevoked: true } },
      );

      const otpDocDeletion = await Otp.deleteOne({ ownerID: id });

      if (!otpDocDeletion.acknowledged && !otpDocDeletion.deletedCount)
        throw new Error("something went wrong, 'otp'");

      // Clear refresh token cookie
      res.clearCookie("refreshToken", { path: "/" });

      res.status(200).json({
        message: "Logged out successfully",
      });
    } catch (err) {
      if (err?.message) res.status(400).json({ error: err.message });
    }
  },
};

module.exports = logoutControllers;
