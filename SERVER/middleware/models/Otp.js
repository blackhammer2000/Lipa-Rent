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
  isSignUpOtpExpired: {
    type: Number,
  },
  loginOtp: {
    type: String,
    unique: true,
  },
  isLoginOtpVerified: {
    type: Boolean,
  },
  isLoginOtpExpired: {
    type: Number,
  },
});

const Otp = model("otp", OtpSchema);

module.exports = { Otp };
