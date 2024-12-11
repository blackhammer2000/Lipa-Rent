const { Schema, model } = require("mongoose");
const { hash } = require("bcrypt");

const OtpSchema = new Schema({
  ownerID: {
    type: String,
    required: true,
  },
  signUpOtp: {
    type: String,
    unique: true,
  },
  isSignUpOtpVerified: {
    type: Boolean,
  },
  signUpOtpExpiry: {
    type: Number,
  },
  loginOtp: {
    type: String,
    unique: true,
  },
  isLoginOtpVerified: {
    type: Boolean,
  },
  loginOtpExpiry: {
    type: Number,
  },
});

OtpSchema.pre("save", async function (next) {
  try {
    const hashedLoginOtp = await hash(this.loginOtp, 10);

    if (!hashedLoginOtp) throw new Error(hashedLoginOtp);

    this.loginOtp = hashedLoginOtp;
    next();
  } catch (err) {
    next(err);
  }
});

const Otp = model("otp", OtpSchema);

module.exports = { Otp };
