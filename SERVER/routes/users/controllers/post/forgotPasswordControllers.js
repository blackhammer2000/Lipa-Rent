const { Owner } = require("../../../../middleware/models/Owner");

const { generateOTP } = require("../../helpers/generateOtp");

const {
  signForgotPasswordToken,
} = require("../../../../middleware/tokens/forgotPasswordToken");

const forgotPasswordControllers = {
  //? Forgot password, utilises the reset tokens methods for otp issuing and verification
  verifyUserInfo: async (req, res) => {
    try {
      if (!req.body.email) throw new Error("Unauthorized action.");
      if (!req.body.nationalId) throw new Error("Unauthorized action.");

      const { email, nationalId } = req.body;

      const ownerDoc = await Owner.findOne({ email, nationalID: nationalId });

      if (!ownerDoc) throw new Error("Invalid credentials");

      const id = ownerDoc?._id || null;

      const nationalID = ownerDoc?.nationalID || null;

      if (!nationalID || !id) throw new Error("Invalid credentials");

      if (nationalID !== nationalId) throw new Error("Invalid credentials");

      const otp = generateOTP();

      const token = await signForgotPasswordToken({ id, email, otp });

      res
        .status(200)
        .json({ message: "User info verification successful", token });
    } catch (err) {
      if (err?.message) res.status(400).json({ error: err.message });
    }
  },
};

module.exports = forgotPasswordControllers;
