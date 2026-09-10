const { compare, hash } = require("bcrypt");

const { Password } = require("../../../../middleware/models/Password");

const {
  generateOTP,
  generateOTPExpiryTime,
} = require("../../helpers/generateOtp");

const { encrypt } = require("../../../helpers/cipher");

const { sendEmail } = require("../../../helpers/mailtrap");

const resetPasswordControllers = {
  genarateResetPasswordOTP: async (req, res) => {
    try {
      if (!req.body.id || !req.body.email)
        throw new Error("Unauthorized action");

      const { id, email } = req.body;

      const passwordDoc = await Password.findOne({ ownerID: id });

      if (!passwordDoc) throw new Error("Something went wrong");

      const lastResetTime = passwordDoc.lastReset || null;

      const twentyFourHours = 24 * 60 * 60 * 1000;

      if (
        lastResetTime !== null &&
        Date.now() < lastResetTime + twentyFourHours
      )
        throw new Error(
          "Password can only be reset 24hrs after the last reset",
        );

      const tokenIsNotVerifiedAndHasNotExpired =
        passwordDoc.resetToken !== (null || undefined) &&
        passwordDoc.resetTokenVerified !== (null || undefined) &&
        passwordDoc.resetTokenVerified === false &&
        passwordDoc.resetTokenExpiry !== (null || undefined) &&
        Date.now() < passwordDoc.resetTokenExpiry;

      if (tokenIsNotVerifiedAndHasNotExpired)
        return res.status(200).json({
          message:
            "OTP has already been sent, please try again after a few minutes",
        });

      const tokenIsNotVerifiedAndHasExpired =
        passwordDoc.resetToken !== (null || undefined) &&
        passwordDoc.resetTokenVerified !== (null || undefined) &&
        passwordDoc.resetTokenVerified === false &&
        passwordDoc.resetTokenExpiry !== (null || undefined) &&
        Date.now() > passwordDoc.resetTokenExpiry;

      const noExistingToken =
        passwordDoc.resetToken == null &&
        passwordDoc.resetTokenVerified == null &&
        passwordDoc.resetTokenExpiry == null;

      if (tokenIsNotVerifiedAndHasExpired || noExistingToken) {
        const resetPasswordToken = req.body.otp || generateOTP();
        const resetPasswordTokenExpiry = generateOTPExpiryTime();

        const hashedresetPasswordToken = await hash(
          encrypt(resetPasswordToken),
          10,
        );

        if (!hashedresetPasswordToken)
          throw new Error(
            "Could not generate reset password OTP, please try again later.",
          );

        const isEmailSent = await sendEmail(
          email,
          "LIPARENT reset password OTP",
          `Your reset password OTP is: ${resetPasswordToken}`,
        );

        if (!isEmailSent)
          throw new Error("Failed to send reset password OTP email.");

        const addResetTokenToDB = await Password.updateOne(
          { ownerID: id },
          {
            $set: {
              resetToken: hashedresetPasswordToken,
              resetTokenExpiry: resetPasswordTokenExpiry,
              resetTokenVerified: false,
            },
          },
        );

        if (!addResetTokenToDB.acknowledged && !addResetTokenToDB.modifiedCount)
          throw new Error("Error adding reset token to database");

        res.status(200).json({
          message: "Password reset token sent to your email",
          resetPasswordOTP: resetPasswordToken,
        });
      }
    } catch (err) {
      if (err?.message) res.status(400).json({ error: err.message });
    }
  },

  verifyResetPasswordOTP: async (req, res) => {
    try {
      if (!req.body.id) throw new Error("Unknown user.");
      if (!req.headers.resettoken) throw new Error("Unauthorized action1.");

      if (req.body.otp && req.body.otp !== req.headers.resettoken)
        throw new Error("Invalid otp.");

      const { id } = req.body;

      const {
        headers: { resettoken: resetOTP },
      } = req;

      const passwordDoc = await Password.findOne({ ownerID: id });

      const resetPasswordToken = passwordDoc.resetToken || null;

      if (!resetPasswordToken) throw new Error("Invalid otp.");

      const resetPasswordTokenMatch = await compare(
        encrypt(resetOTP),
        resetPasswordToken,
      );

      if (!resetPasswordTokenMatch) throw new Error("Invalid otp");

      const resetPasswordTokenExpiry = passwordDoc.resetTokenExpiry || null;

      if (!resetPasswordTokenExpiry) throw new Error("Invalid otp.");

      const isTokenValid = Date.now() < resetPasswordTokenExpiry ? true : false;

      if (!isTokenValid) {
        const removeInvalidToken = await Password.updateOne(
          { ownerID: id },
          {
            $unset: ["resetToken", "resetTokenExpiry", "resetTokenVerified"],
          },
        );

        if (
          !removeInvalidToken.acknowledged &&
          !removeInvalidToken.modifiedCount
        )
          throw new Error("Error removing invalid reset token.");

        throw new Error("Invalid otp");
      }

      const verifyToken = await Password.updateOne(
        { ownerID: id },
        {
          $set: {
            resetTokenVerified: true,
          },
        },
      );

      if (!verifyToken.acknowledged && !verifyToken.modifiedCount)
        throw new Error("Error verifying reset token.");

      res.status(200).json({
        message: "Otp verification successful",
      });
    } catch (err) {
      if (err?.message) res.status(400).json({ error: err.message });
    }
  },
};

module.exports = resetPasswordControllers;
