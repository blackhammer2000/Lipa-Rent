const { Schema, model } = require("mongoose");

const OtpSchema = new Schema({
  signUpOtp: {
    type: String,
    required: true,
  },
  isSignUpOtpVerified: {
    type: Boolean,
    required: true,
  },
  loginOtp: {
    type: String,
    required: true,
  },
  isLoginOtpVerified: {
    type: Boolean,
    required: true,
  },
});

const Otp = model("otp", OtpSchema);

module.exports = { Otp };
