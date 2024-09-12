const { compare } = require("bcrypt");

const crypto = require("node:crypto");

// const { signAcessToken } = require("../../../middlewares/tokens/accessToken");

const {
  ObjectId: { isValid },
} = require("mongodb");

const { Landlord } = require("../../../middleware/models/Owner");
const { Password } = require("../../../middleware/models/Password");
const { Subscription } = require("../../../middleware/models/Subscription");
const { Property } = require("../../../middleware/models/Property");
const { Tenant } = require("../../../middleware/models/Tenant");

// const {
//   checkSubscriptionExpiry,
// } = require("../../../middlewares/helpers/subscription");

const { encrypt } = require("../../helpers/cipher");

// const { searchForSelectedBooks } = require("../helpers/findBooks");

///////*************************POST CONTROLLERS************************////////////////

const post_controllers = {
  signUp: async (req, res) => {
    try {
      const { name, nationalID, email, phone, password, confirmPassword } =
        req.body;

      if (encrypt(password) !== encrypt(confirmPassword))
        throw new Error("passwords do not match.");

      const landlord = {
        name,
        nationalID,
        email,
        phone,
        dateRegistered: new Date().toLocaleDateString(),
      };

      const accountExists = await Landlord?.findOne({ email, nationalID });

      if (accountExists)
        throw new Error(
          "an account with the given credentials already exists."
        );

      landlord.disabled = false;
      landlord.paid = true;

      const newLandlord = await Landlord?.create(landlord);

      if (!newLandlord)
        throw new Error("Failed to create a new instance of the institution.");

      const newPasswordDB = await Password?.create({
        landlordID: newLandlord?._id?.toString(),
        password: encrypt(password),
      });

      if (!newPasswordDB)
        throw new Error(
          "Failed to create a new instance of the password DB document."
        );

      const thirtyDaysMilliseconds = 30 * 24 * 60 * 60 * 1000;

      const currentSubscription = {
        start: Date.now(),
        expires: Date.now() + thirtyDaysMilliseconds,
      };

      const first_subscription_report = {
        subscription_id: crypto.randomUUID(),
        subscription_payment: 1,
        subscription_payment_date: `${
          new Date().toLocaleDateString() | new Date().toLocaleTimeString()
        }`,
        currentSubscription,
      };

      let newInstitutionSubscriptionBody = {
        landlordID: newLandlord?._id?.toString(),
        currentSubscription,
        subscription_reports: [],
      };

      newInstitutionSubscriptionBody.subscription_reports.push(
        first_subscription_report
      );

      // console.log(newInstitutionSubscriptionBody);

      const newInstitutionSubscription = await Subscription?.create(
        newInstitutionSubscriptionBody
      );

      if (!newInstitutionSubscription)
        throw new Error(
          "Failed to create a new instance of the institution subscription document."
        );

      const newLandlordPropertyBody = {
        landlordID: newLandlord?._id?.toString(),
        propertiesOwned: [],
      };

      const newLandlordPropertyCollection = await Property?.create(
        newLandlordPropertyBody
      );

      if (!newLandlordPropertyCollection)
        throw new Error("Failed to create a new instance of the institution.");

      res.status(201).json({
        message: `An account for ${name} has been succesfully created, proceed to log in to your account.`,
        response_status: "success",
      });
    } catch (err) {
      if (err?.message)
        res
          .status(500)
          .json({ error: err?.message, response_status: "danger" });
    }
  },

  login: async (req, res) => {
    try {
      if (!req?.body?.email || !req?.body?.password)
        throw new Error("Provide all the necessary credentials");

      const { email, password } = req?.body;

      const encryptedPassword = encrypt(password);

      const user = await Institute?.findOne({
        email: email,
      });

      if (!user) throw new Error("Incorrect Email or Password.");

      const { _id, paid, disabled } = user;

      if (paid === false)
        throw new Error("Renew subscription to regain access.");

      if (disabled === true) throw new Error("Account has been disabled.");

      const passwordMatch = await compare(encryptedPassword, user?.password);

      if (!passwordMatch) throw new Error("Incorrect Email or Password.");

      const { subscription_reports } = await Subscription?.findOne({
        institutionID: _id,
      });

      if (!subscription_reports) throw new Error("Subscribe to proceed.");

      const isSubscriptionExpired = checkSubscriptionExpiry(
        subscription_reports.at(-1).subscription
      );

      if (isSubscriptionExpired && typeof isSubscriptionExpired === "object") {
        const updatePaidStatus = await Institute.findOneAndUpdate(
          { _id: _id },
          { $set: { paid: false } }
        );

        if (updatePaidStatus) throw new Error(isSubscriptionExpired?.error);
      }

      const userData = {
        _id,
        subscription: subscription_reports?.at(-1)?.currentSubscription,
        disabled,
        user: true,
      };

      const generatedToken = await accessToken(userData);

      res.status(200).json({
        message: "login successful",
        response_status: "success",
        token: generatedToken,
      });
    } catch (err) {
      if (err?.message)
        res
          .status(500)
          .json({ error: err?.message, response_status: "danger" });
    }
  },
};

module.exports = post_controllers;
