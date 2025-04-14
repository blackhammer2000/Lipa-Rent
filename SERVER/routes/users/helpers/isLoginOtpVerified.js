const { Otp } = require("../../../middleware/models/Otp");

async function isLoginOtpVerified(req, res, next) {
  try {
    if (!req.body.id) throw new Error("Unauthorized action.");

    const {
      body: { id },
    } = req;

    const userOtpDoc = await Otp.findOne({ ownerID: id });

    const isLoginOtpVerified = userOtpDoc.isLoginOtpVerified || null;

    if (
      isLoginOtpVerified === false ||
      isLoginOtpVerified === (null || undefined)
    )
      throw new Error("Invalid login sesion");

    next();
  } catch (err) {
    if (err?.message) res.status(500).json({ error: err?.message });
  }
}

module.exports = { isLoginOtpVerified };
