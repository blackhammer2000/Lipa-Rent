const { compare, hash } = require("bcrypt");

const { Password } = require("../../../../middleware/models/Password");
const { Otp } = require("../../../../middleware/models/Otp");

const {
  generateOTP,
  generateOTPExpiryTime,
} = require("../../helpers/generateOtp");

const { encrypt } = require("../../../helpers/cipher");

const { sendEmail } = require("../../../helpers/mailtrap");

const deleteAccountControllers = {
  //? Delete account otp

  genarateDeleteAccountOTP: async (req, res) => {
    try {
      if (!req.body.id || !req.body.email)
        throw new Error("Unauthorized action");

      const { id, email } = req.body;

      const otpDoc = await Otp.findOne({ ownerID: id });

      if (
        otpDoc?.deleteAccountOtp !== (null || undefined) &&
        otpDoc?.isDeleteAccountOtpVerified !== (null || undefined) &&
        otpDoc?.deleteAccountOtpExpiry !== (null || undefined) &&
        Date.now() < otpDoc?.deleteAccountOtpExpiry
      ) {
        res.status(200).json({
          message:
            "OTP has already been sent, please try again after a few minutes",
        });
      }

      const tokenHasExpired =
        otpDoc?.deleteAccountOtp !== (null || undefined) &&
        otpDoc?.isDeleteAccountOtpVerified !== (null || undefined) &&
        otpDoc?.isDeleteAccountOtpVerified === false &&
        otpDoc?.deleteAccountOtpExpiry !== (null || undefined) &&
        Date.now() > otpDoc?.deleteAccountOtpExpiry;

      const noExistingToken =
        otpDoc?.deleteAccountOtp == null &&
        otpDoc?.isDeleteAccountOtpVerified == null &&
        otpDoc?.deleteAccountOtpExpiry == null;

      if (tokenHasExpired || noExistingToken) {
        const deleteAccountToken = generateOTP();
        const deleteAccountTokenExpiry = generateOTPExpiryTime();

        const hashedDeleteAccountToken = await hash(
          encrypt(deleteAccountToken),
          10,
        );

        if (!hashedDeleteAccountToken)
          throw new Error(hashedDeleteAccountToken);

        const isEmailSent = await sendEmail(
          email,
          "LIPARENT Delete Account OTP",
          `Your delete account OTP is: ${deleteAccountToken}`,
        );

        if (!isEmailSent)
          throw new Error("Failed to send delete account OTP email.");

        const addDeleteAccountTokenToDB = await Otp.updateOne(
          { ownerID: id },
          {
            $set: {
              deleteAccountOtp: hashedDeleteAccountToken,
              deleteAccountOtpExpiry: deleteAccountTokenExpiry,
              isDeleteAccountOtpVerified: false,
            },
          },
          { new: true },
        );

        if (
          !addDeleteAccountTokenToDB.acknowledged &&
          !addDeleteAccountTokenToDB.modifiedCount
        )
          throw new Error("Error adding reset token to database");

        res.status(200).json({
          message: "Delete account token sent to your email",
          deleteAccountToken,
        });
      }
    } catch (err) {
      if (err?.message) res.status(400).json({ error: err.message });
    }
  },

  verifyDeleteAccountOTP: async (req, res) => {
    try {
      if (!req.body.id) throw new Error("Unauthorized action.");
      if (!req.headers.deletetoken) throw new Error("Unauthorized action.");

      const { id } = req.body;

      const {
        headers: { deletetoken },
      } = req;

      const otpDoc = await Otp.findOne({ ownerID: id });

      const deleteAccountToken = otpDoc.deleteAccountOtp || null;

      if (!deleteAccountToken) throw new Error("Invalid Token");

      const deleteAccountTokenMatch = await compare(
        encrypt(deletetoken),
        deleteAccountToken,
      );

      if (!deleteAccountTokenMatch) throw new Error("Invalid Token");

      const deleteAccountTokenExpiry = otpDoc.deleteAccountOtpExpiry || null;

      if (!deleteAccountTokenExpiry) throw new Error("Invalid Token.");

      const isTokenValid = Date.now() < deleteAccountTokenExpiry ? true : false;

      if (!isTokenValid) {
        const removeInvalidToken = await Otp.updateOne(
          { ownerID: id },
          {
            $unset: [
              "deleteAccountOtp",
              "deleteAccountOtpExpiry",
              "isDeleteAccountOtpVerified",
            ],
          },
        );

        if (
          !removeInvalidToken.acknowledged &&
          !removeInvalidToken.modifiedCount
        )
          throw new Error("Error removing invalid reset token.");

        throw new Error("Invalid Token, generate a new one.");
      }

      const verifyToken = await Otp.updateOne(
        { ownerID: id },
        {
          $set: {
            isDeleteAccountOtpVerified: true,
          },
        },
      );

      if (!verifyToken.acknowledged && !verifyToken.modifiedCount)
        throw new Error("Error verifying reset token.");

      res.status(200).json({
        message: "Verification successful",
      });
    } catch (err) {
      if (err?.message) res.status(400).json({ error: err.message });
    }
  },

  verifyPassword: async (req, res) => {
    try {
      if (!req.body.id) throw new Error("Unauthorized action.");

      const { id, password } = req.body;

      const passwordDoc = await Password.findOne({ ownerID: id });

      const userPassword = passwordDoc.password || null;

      if (!userPassword) throw new Error("Invalid password");

      const passwordMatch = await compare(encrypt(password), userPassword);

      if (!passwordMatch) throw new Error("Invalid password");

      res.status(200).json({
        message: "Password verification successful",
      });
    } catch (err) {
      if (err?.message) res.status(400).json({ error: err.message });
    }
  },
};

module.exports = deleteAccountControllers;
