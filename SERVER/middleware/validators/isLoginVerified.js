require("dotenv").config();

const { Otp } = require("../models/Otp");

const isLoginVerified = async (req, res, next) => {
  try {
    if (!req.body.id) throw new Error("Unauthorized action.");

    var {
      body: { id },
    } = req;

    const otpDoc = (await Otp.findOne({ ownerID: id })) || null;

    if (!otpDoc) throw new Error("Something went wrong.");

    const isLoginOtpVerified = otpDoc?.isLoginOtpVerified || null;

    if (!isLoginOtpVerified) throw new Error("invalid session");

    next();
  } catch (err) {
    if (err?.message === "invalid session") {
      const otpDocDeletion = await Otp.deleteOne({ ownerID: id });

      if (!otpDocDeletion.acknowledged && !otpDocDeletion.deletedCount)
        throw new Error("something went wrong, 'otp'");

      res.status(403).json({ error: "session expired" });
    } else {
      res.status(500).json({ error: err?.message });
    }
  }
};

module.exports = { isLoginVerified };
