const { Password } = require("../../../../middleware/models/Password");
const { Otp } = require("../../../../middleware/models/Otp");

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

      const otpDocDeletion = await Otp.deleteOne({ ownerID: id });

      if (!otpDocDeletion.acknowledged && !otpDocDeletion.deletedCount)
        throw new Error("something went wrong, 'otp'");

      res.status(200).json({
        message: "Logged out sucessfully",
      });
    } catch (err) {
      if (err?.message) res.status(400).json({ error: err.message });
    }
  },
};

module.exports = logoutControllers;
