const { Schema, model } = require("mongoose");

const OtpSchema = new Schema({
  ownerID: {
    type: String,
    required: true,
  },
  signUpOtp: {
    type: String,
  },
  isSignUpOtpVerified: {
    type: Boolean,
  },
  signUpOtpExpiry: {
    type: Number,
  },
  loginOtp: {
    type: String,
  },
  isLoginOtpVerified: {
    type: Boolean,
  },
  loginOtpExpiry: {
    type: Number,
  },
  deleteAccountOtp: {
    type: String,
  },
  isDeleteAccountOtpVerified: {
    type: Boolean,
  },
  deleteAccountOtpExpiry: {
    type: Number,
  },
});

const Otp = model("otp", OtpSchema);

module.exports = { Otp };
