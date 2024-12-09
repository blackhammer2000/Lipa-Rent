const { Schema, model } = require("mongoose");

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

const Otp = model("otp", OtpSchema);

module.exports = { Otp };
