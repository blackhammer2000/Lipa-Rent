const { compare } = require("bcrypt");

const crypto = require("node:crypto");

const accessToken = require("../../../middlewares/tokens/signToken");

const {
  ObjectId: { isValid },
} = require("mongodb");

const { Landlord } = require("../../../middleware/models/landlord");
const { Password } = require("../../../middleware/models/Password");
const { Subscription } = require("../../../middleware/models/Subscription");

// const {
//   checkSubscriptionExpiry,
// } = require("../../../middlewares/helpers/subscription");

// const { encrypt } = require("../../helpers/cipher");

// const { searchForSelectedBooks } = require("../helpers/findBooks");

///////*************************POST CONTROLLERS************************////////////////

const post_controllers = {
  signUp: async (req, res) => {
    try {
      const { name, email, phone, password, confirm_password } = req.body;

      if (encrypt(password) !== encrypt(confirm_password))
        throw new Error("passwords do not match.");

      const institute = {
        name,
        email,
        phone,
        date_registered: new Date().toLocaleDateString(),
        password,
      };

      const accountExists = await Institute?.findOne({ email: email });

      if (accountExists)
        throw new Error("an account with the given email already exists.");

      institute.password = encrypt(password);
      institute.disabled = false;
      institute.paid = true;

      const newInstitution = await Institute?.create(institute);

      if (!newInstitution)
        throw new Error("Failed to create a new instance of the institution.");

      const thirtyDaysMilliseconds = 30 * 24 * 60 * 60 * 1000;

      const first_subscription_report = {
        subscription_id: crypto.randomUUID(),
        subscription_payment: 1,
        subscription_payment_date: `${
          new Date().toLocaleDateString() | new Date().toLocaleTimeString()
        }`,
        subscription: {
          start: Date.now(),
          expires: Date.now() + thirtyDaysMilliseconds,
        },
      };

      let newInstitutionSubscriptionBody = {
        institutionID: newInstitution?._id?.toString(),
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

      const newInstitutionBookCollectionBody = {
        institutionID: newInstitution?._id?.toString(),
        books: [{}],
      };

      const newInstitutionBookCollection = await Book?.create(
        newInstitutionBookCollectionBody
      );

      if (!newInstitutionBookCollection)
        throw new Error("Failed to create a new instance of the institution.");

      const newInstitutionStudentCollectionBody = {
        institutionID: newInstitution?._id?.toString(),
        students: [],
      };

      const newInstitutionStudentCollection = await Student?.create(
        newInstitutionStudentCollectionBody
      );

      if (!newInstitutionStudentCollection)
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
        subscription: subscription_reports?.at(-1)?.subscription,
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
