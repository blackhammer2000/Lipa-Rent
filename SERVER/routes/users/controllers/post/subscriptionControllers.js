const { compare, hash } = require("bcrypt");
import Subscriptions from "./../../../../../CLIENT/react/src/pages/Subscriptions";

const {
  signAccessToken,
} = require("../../../../middleware/tokens/accessToken");

const {
  ObjectId: { isValid },
} = require("mongodb");

const { Subscription } = require("../../../../middleware/models/Subscription");
const { Password } = require("../../../../middleware/models/Password");
const { Property } = require("../../../../middleware/models/Property");
const { Tenant } = require("../../../../middleware/models/Tenant");
const { Owner } = require("../../../../middleware/models/Owner");
const { Room } = require("../../../../middleware/models/Room");
const { Rent } = require("../../../../middleware/models/Rent");
const { Otp } = require("../../../../middleware/models/Otp");

const {
  generateOTP,
  generateOTPExpiryTime,
} = require("../../helpers/generateOtp");
const { checkSubscriptionExpiry } = require("../../helpers/checkSubscription");
const { encrypt } = require("../../../helpers/cipher");
const {
  signSignUpToken,
} = require("../../../../middleware/tokens/signUpToken");
const { signLoginToken } = require("../../../../middleware/tokens/loginToken");
const {
  signForgotPasswordToken,
} = require("../../../../middleware/tokens/forgotPasswordToken");

const { sendEmail } = require("../../../helpers/mailtrap");

const subscriptionControllers = {
  //! SUBSCRIPTIONS.

  createPayment: async (req, res) => {},

  verifyPayment: async (req, res) => {},

  createSubscription: async (req, res) => {},

  checkSubscription: async (req, res) => {},
};

module.exports = subscriptionControllers;
