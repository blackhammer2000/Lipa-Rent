const { compare, hash } = require("bcrypt");

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

const { encrypt } = require("../../../helpers/cipher");

const {
  signSignUpToken,
} = require("../../../../middleware/tokens/signUpToken");

const { sendEmail } = require("../../../helpers/mailtrap");

const signUpControllers = {
  //! SIGN UP NEW USER.
  generateSignUpOtp: async (req, res) => {
    try {
      if (
        !req.body.user.name ||
        !req.body.user.nationalID ||
        !req.body.user.email ||
        !req.body.user.phone ||
        !req.body.user.confirmPassword ||
        !req.body.user.password
      )
        throw new Error("provide all valid details");

      const {
        user: { name, nationalID, email, phone, password, confirmPassword },
      } = req.body;

      if (encrypt(password) !== encrypt(confirmPassword))
        throw new Error("passwords do not match.");

      if (encrypt(password).length < 8)
        throw new Error("Password must be at least 8 characters long.");

      const emailExists = await Owner?.findOne({
        email: email,
      });

      const nationalIDExists = await Owner?.findOne({
        nationalID: nationalID,
      });

      const accountExists = await Owner?.findOne({
        email: email,
        nationalID: nationalID,
      });

      const otpExists = accountExists
        ? await Otp?.findOne({
            ownerID: accountExists._id,
          })
        : null;

      if (
        accountExists &&
        accountExists._id &&
        otpExists &&
        otpExists.isSignUpOtpVerified === false &&
        otpExists.signUpOtpExpiry &&
        otpExists.signUpOtpExpiry !== null &&
        Date.now() < otpExists.signUpOtpExpiry
      ) {
        const signUpToken = await signSignUpToken({
          id: accountExists._id.toString(),
          otp: 1,
          repeat: 1,
        });

        if (!signUpToken) throw new Error(signUpToken);

        res.status(200).json({
          message:
            "OTP has already been sent, check your email or try again after a few minutes",
          signUpToken,
        });
      }

      if (
        accountExists &&
        accountExists?._id &&
        otpExists &&
        otpExists.isSignUpOtpVerified === false &&
        otpExists.signUpOtpExpiry &&
        otpExists.signUpOtpExpiry !== null &&
        Date.now() > otpExists.signUpOtpExpiry
      ) {
        const signUpOtp = generateOTP();
        const signUpOtpExpiry = generateOTPExpiryTime();

        const hashedSignUpOtp = await hash(encrypt(signUpOtp), 10);

        if (!hashedSignUpOtp) throw new Error(hashedSignUpOtp);

        const isEmailSent = await sendEmail(
          email,
          "LIPARENT signup OTP",
          `Your signup OTP is: ${signUpOtp}`,
        );

        if (!isEmailSent) throw new Error("Failed to send signup OTP email.");

        const signUpOtpDetailsToDB = await Otp.updateOne(
          { ownerID: accountExists._id.toString() },
          {
            $set: {
              signUpOtp: hashedSignUpOtp,
              isSignUpOtpVerified: false,
              signUpOtpExpiry: signUpOtpExpiry,
            },
          },
        );

        if (
          !accountExists._id &&
          !signUpOtpDetailsToDB.acknowledged &&
          !signUpOtpDetailsToDB.modifiedCount
        )
          throw new Error("Error adding sign up otp details to database");

        const signUpToken = await signSignUpToken({
          id: accountExists._id.toString(),
          otp: signUpOtp,
        });

        if (!signUpToken) throw new Error(signUpToken);

        res.status(200).json({
          message: "Verify your email, check your email for code.",
          signUpOtp,
          signUpToken,
        });
      }

      if ((emailExists || nationalIDExists) && !accountExists)
        throw new Error(
          `Invalid ${emailExists ? "Email" : "NationalID"}, try signing up with a different ${emailExists ? "Email" : "NationalID"}.`,
        );

      if (!accountExists && !otpExists) {
        const owner = {
          name: name.toUpperCase(),
          nationalID,
          email,
          emailVerified: false,
          phone,
          phoneVerified: false,
          dateRegistered: new Date().toLocaleDateString(),
          disabled: false,
          paid: true,
        };

        const newOwner = await Owner?.create(owner);

        if (!newOwner)
          throw new Error("Something went wrong, please try again later.");

        const signUpOtp = generateOTP();
        const signUpOtpExpiry = generateOTPExpiryTime();

        const hashedSignUpOtp = await hash(encrypt(signUpOtp), 10);

        if (!hashedSignUpOtp) throw new Error(hashedSignUpOtp);

        const isEmailSent = await sendEmail(
          [{ email }],
          "LIPARENT signup OTP",
          `Your signup OTP is: ${signUpOtp}`,
        );

        if (!isEmailSent) throw new Error("Failed to send signup OTP email.");

        const signUpOtpDetailsToDB = await Otp.create({
          ownerID: newOwner._id.toString(),
          signUpOtp: hashedSignUpOtp,
          isSignUpOtpVerified: false,
          signUpOtpExpiry: signUpOtpExpiry,
        });

        if (
          !accountExists._id &&
          !signUpOtpDetailsToDB._id &&
          !signUpOtpDetailsToDB.ownerID
        )
          throw new Error("Error adding sign up otp details to database");

        const signUpToken = await signSignUpToken({
          id: newOwner._id.toString(),
          otp: signUpOtp,
        });

        if (!signUpToken) throw new Error(signUpToken);

        res.status(200).json({
          message: "Verify your email, check your email for code.",
          signUpOtp,
          signUpToken,
        });
      }
    } catch (err) {
      if (err.message) res.status(400).json({ error: err.message });
    }
  },

  verifySignUpOtp: async (req, res) => {
    try {
      if (!req.body.id || !req.body.otp) throw new Error("Unauthorized action");

      const { id, otp } = req.body;

      if (otp !== req.headers.otp) throw new Error("Invalid otp");

      const userOtpDoc = await Otp.findOne({ ownerID: id });

      const signUpOtp = userOtpDoc.signUpOtp || null;
      const isSignUpOtpVerified = userOtpDoc.isSignUpOtpVerified || null;
      const signUpOtpExpiry = userOtpDoc.signUpOtpExpiry || null;

      if (signUpOtpExpiry && Date.now() > signUpOtpExpiry)
        throw new Error("Invalid Otp");

      if (!signUpOtp || !signUpOtpExpiry || isSignUpOtpVerified !== null)
        throw new Error("Invalid Otp");

      const isOtpValid = await compare(encrypt(otp), signUpOtp);

      if (!isOtpValid) throw new Error("Invalid Otp");

      const signUpOtpDetailsToDB = await Otp.updateOne(
        { ownerID: id },
        {
          $set: {
            signUpOtp: null,
            isSignUpOtpVerified: true,
            signUpOtpExpiry: null,
          },
        },
      );

      if (
        !signUpOtpDetailsToDB.acknowledged &&
        !signUpOtpDetailsToDB.modifiedCount
      )
        throw new Error("Error adding sign up otp details");

      const ownerDetailsToDB = await Owner.updateOne(
        { _id: id },
        {
          $set: {
            emailVerified: true,
          },
        },
      );

      if (!ownerDetailsToDB.acknowledged && !ownerDetailsToDB.modifiedCount)
        throw new Error("Something went wrong when updating owner details");

      const signUpToken = await signSignUpToken({
        id,
        otpVerified: true,
      });

      if (!signUpToken) throw new Error(signUpToken);

      res.status(200).json({
        message: "Email verified successfully",
        signUpToken,
      });
    } catch (err) {
      if (err.message) res.status(400).json({ error: err.message });
    }
  },

  signUp: async (req, res) => {
    try {
      if (
        !req.body.id ||
        !req.body.password ||
        !req.body.confirmPassword ||
        !req.body.otpVerified
      )
        throw new Error("Unauthorized action.");

      const { id, password, confirmPassword } = req.body;

      if (encrypt(password) !== encrypt(confirmPassword))
        throw new Error("passwords do not match.");

      const accountExists = await Owner?.findOne({
        _id: id.toString(),
      });

      if (!accountExists)
        throw new Error(
          "Error occured, please repeat the sign up process from the beginning",
        );

      if (accountExists.emailVerified !== true)
        throw new Error("Please complete email verification");

      const userOtpDoc = await Otp.findOne({ ownerID: id });

      if (!userOtpDoc)
        throw new Error(
          "Error occured, please repeat the sign up process from the beginning",
        );

      if (
        !userOtpDoc.isSignUpOtpVerified ||
        (userOtpDoc.isSignUpOtpVerified !== (null || undefined) &&
          userOtpDoc.isSignUpOtpVerified === false)
      )
        throw new Error("Please complete email verification");

      const newOwnerPasswordDB = await Password.create({
        ownerID: id,
        password: encrypt(password),
      });

      if (!newOwnerPasswordDB)
        throw new Error(
          "Failed to create a new instance of the password DB document.",
        );

      const thirtyDaysMilliseconds = 30 * 24 * 60 * 60 * 1000;

      const currentSubscription = {
        start: Date.now(),
        expires: Date.now() + thirtyDaysMilliseconds,
      };

      const first_subscription_report = {
        subscription_id: generateOTP(),
        subscription_payment: 1,
        subscription_payment_date: `${new Date().toLocaleDateString()} | ${new Date().toLocaleTimeString()}`,
        currentSubscription,
      };

      let newInstitutionSubscriptionBody = {
        ownerID: id,
        currentSubscription,
        subscription_reports: [],
      };

      newInstitutionSubscriptionBody.subscription_reports.push(
        first_subscription_report,
      );

      // console.log(newInstitutionSubscriptionBody);

      const newInstitutionSubscription = await Subscription?.create(
        newInstitutionSubscriptionBody,
      );

      if (!newInstitutionSubscription)
        throw new Error(
          "Failed to create a new instance of the subscription document.",
        );

      const newOwnerPropertyBody = {
        ownerID: id,
        propertiesOwned: [{}],
      };

      const newOwnerPropertyCollection =
        await Property?.create(newOwnerPropertyBody);

      if (!newOwnerPropertyCollection)
        throw new Error(
          "Failed to create a new instance of the property document in the database.",
        );

      const newOwnerTenantBody = {
        ownerID: id,
        tenants: [{}],
      };

      const newOwnerTenantCollection = await Tenant?.create(newOwnerTenantBody);

      if (!newOwnerTenantCollection)
        throw new Error(
          "Failed to create a new instance of the tenant document in the database.",
        );

      const newOwnerRoomsBody = {
        ownerID: id,
        rooms: [{}],
      };

      const newOwnerRoomsCollection = await Room?.create(newOwnerRoomsBody);

      if (!newOwnerRoomsCollection)
        throw new Error(
          "Failed to create a new instance of the room document in the database.",
        );

      const newOwnerRentBody = {
        ownerID: id,
        rents: [{}],
      };

      const newOwnerRentCollection = await Rent?.create(newOwnerRentBody);

      if (!newOwnerRentCollection)
        throw new Error(
          "Failed to create a new instance of the property document in the database.",
        );

      const otpDocDeletion = await Otp.deleteOne({ ownerID: id });

      if (!otpDocDeletion.acknowledged && !otpDocDeletion.deletedCount)
        throw new Error("something went wrong, 'otp'");

      res.status(201).json({
        message: `An account has been succesfully created, proceed to log in to your account.`,
      });
    } catch (err) {
      if (err?.message)
        res
          .status(500)
          .json({ error: err?.message, response_status: "danger" });
    }
  },
};

module.exports = signUpControllers;
