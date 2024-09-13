const { compare } = require("bcrypt");

const crypto = require("node:crypto");

const { signAccessToken } = require("../../../middleware/tokens/accessToken");

const {
  ObjectId: { isValid },
} = require("mongodb");

const { Landlord } = require("../../../middleware/models/Owner");
const { Password } = require("../../../middleware/models/Password");
const { Subscription } = require("../../../middleware/models/Subscription");
const { Property } = require("../../../middleware/models/Property");
const { Tenant } = require("../../../middleware/models/Tenant");

const { checkSubscriptionExpiry } = require("../helpers/checkSubscription");
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
        throw new Error(
          "Failed to create a new instance of the landlord document."
        );

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
        subscription_payment_date: `${new Date().toLocaleDateString()} | ${new Date().toLocaleTimeString()}`,
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
          "Failed to create a new instance of the subscription document."
        );

      const newLandlordPropertyBody = {
        landlordID: newLandlord?._id?.toString(),
        propertiesOwned: [],
      };

      const newLandlordPropertyCollection = await Property?.create(
        newLandlordPropertyBody
      );

      if (!newLandlordPropertyCollection)
        throw new Error(
          "Failed to create a new instance of the property document in the database."
        );

      const newLandlordTenantBody = {
        landlordID: newLandlord?._id?.toString(),
        tenants: [],
      };

      const newLandlordTenantCollection = await Tenant?.create(
        newLandlordTenantBody
      );

      if (!newLandlordTenantCollection)
        throw new Error(
          "Failed to create a new instance of the tenant document in the database."
        );

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
      if (!req?.body?.email || !req?.body?.nationalID || !req?.body?.password)
        throw new Error("Provide all the necessary credentials");

      const { email, nationalID, password } = req?.body;

      const encryptedPassword = encrypt(password);

      const user = await Landlord?.findOne({
        nationalID,
        email,
      });

      if (!user) throw new Error("Incorrect Email or Password.");

      const { _id, paid, disabled } = user;

      if (paid === false)
        throw new Error("Renew subscription to regain access.");

      if (disabled === true) throw new Error("Account has been disabled.");

      const dbPassword = await Password?.findOne({
        landlordID: _id,
      });

      if (!dbPassword) throw new Error("Incorrect Email or Password.");

      const passwordMatch = await compare(
        encryptedPassword,
        dbPassword?.password
      );

      if (!passwordMatch) throw new Error("Incorrect Email or Password.");

      const { currentSubscription } = await Subscription?.findOne({
        landlordID: _id,
      });

      if (!currentSubscription) throw new Error("Subscribe to proceed.");

      const isSubscriptionExpired =
        checkSubscriptionExpiry(currentSubscription);

      if (isSubscriptionExpired && isSubscriptionExpired.error) {
        const updatePaidStatus = await Landlord.findOneAndUpdate(
          { _id: _id },
          { $set: { paid: false } }
        );

        if (updatePaidStatus) throw new Error(isSubscriptionExpired?.error);
      }

      const userData = {
        _id,
        currentSubscription,
        disabled,
        user: true,
      };

      const token = await signAccessToken(userData);

      if (!token) throw new Error(token);

      res.status(200).json({
        message: "login successful",
        response_status: "success",
        token,
      });
    } catch (err) {
      if (err?.message)
        res
          .status(500)
          .json({ error: err?.message, response_status: "danger" });
    }
  },

  readSinglePropertyOwned: async (req, res) => {
    try {
      const { id, propertyNumber } = req.body;

      if (!id)
        throw new Error("Unauthorized action, not a user or not logged in.");
      if (!propertyNumber) throw new Error("provide a valid property number.");

      const allProperties = await Property.findOne({ landlordID: id });

      if (!allProperties) throw new Error(allProperties);

      const { propertiesOwned } = allProperties;

      const selectedProperty = propertiesOwned.find(
        (property) => property.property_number === propertyNumber
      );

      if (!selectedProperty)
        throw new Error(
          "Selected property is not found/not registered in the database."
        );

      if (selectedProperty) res.status(200).json({ selectedProperty });
    } catch (err) {
      if (err?.message)
        res
          .status(500)
          .json({ error: err?.message, response_status: "danger" });
    }
  },
  readAllTenantsOnSingleProperty: async (req, res) => {},
  readSingleTenantOnProperty: async (req, res) => {},
};

module.exports = post_controllers;
