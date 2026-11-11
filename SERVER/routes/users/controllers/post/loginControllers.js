const { compare, hash } = require("bcrypt");

const {
  signAccessToken,
} = require("../../../../middleware/tokens/accessToken");
const { signRefreshToken } = require("../../../../middleware/tokens/refreshToken");

const { Subscription } = require("../../../../middleware/models/Subscription");

const { Password } = require("../../../../middleware/models/Password");
const { RefreshToken } = require("../../../../middleware/models/RefreshToken");

const { Owner } = require("../../../../middleware/models/Owner");

const { Otp } = require("../../../../middleware/models/Otp");

const {
  generateOTP,
  generateOTPExpiryTime,
} = require("../../helpers/generateOtp");

const { checkSubscriptionExpiry } = require("../../helpers/checkSubscription");

const { encrypt } = require("../../../helpers/cipher");

const { signLoginToken } = require("../../../../middleware/tokens/loginToken");

const { sendEmail } = require("../../../helpers/mailtrap");

const {
  recordFailedAttempt,
  resetFailedAttempts,
} = require("../../../../middleware/validators/loginAttempt");

const loginControllers = {
  //! LOGIN USER.

  //?  below is the expected requestBody from the user when creating a property.
  //* {
  //*   email: "ELKO APARTMENTS",
  //*   nationalID: "NGONG/NGONG/12058",
  //*   password: "NGONG",
  //* },
  login: async (req, res) => {
    try {
      if (!req.body.email || !req.body.nationalID || !req.body.password)
        throw new Error("Provide all the necessary credentials");

      const { email, nationalID, password } = req?.body;

      const encryptedPassword = encrypt(password);

      const user = await Owner?.findOne({
        nationalID,
        email,
      });

      if (!user) {
        await recordFailedAttempt(req);
        throw new Error("Incorrect Email,NationalID or Password.");
      }

      const { _id, paid, disabled, emailVerified } = user;

      if (emailVerified === false) {
        await recordFailedAttempt(req);
        throw new Error("Unverified email.");
      }

      if (paid === false) {
        await recordFailedAttempt(req);
        throw new Error("Renew subscription to regain access.");
      }

      if (disabled === true) {
        await recordFailedAttempt(req);
        throw new Error("Account has been disabled.");
      }

      const dbPassword = await Password?.findOne({
        ownerID: _id,
      });

      if (!dbPassword) {
        await recordFailedAttempt(req);
        throw new Error("Incorrect Email,NationalID or Password.");
      }

      const passwordMatch = await compare(
        encryptedPassword,
        dbPassword?.password,
      );

      if (!passwordMatch) {
        await recordFailedAttempt(req);
        throw new Error("Incorrect Email,NationalID or Password.");
      }

      const { currentSubscription } = await Subscription?.findOne({
        ownerID: _id,
      });

      if (!currentSubscription) throw new Error("Subscribe to proceed.");

      const isSubscriptionExpired =
        checkSubscriptionExpiry(currentSubscription);

      if (isSubscriptionExpired && isSubscriptionExpired.error) {
        const updatePaidStatus = await Owner.findOneAndUpdate(
          { _id: _id },
          { $set: { paid: false, disabled: true } },
        );

        if (updatePaidStatus) throw new Error(isSubscriptionExpired?.error);
      }

      // Successful login — reset failed attempts
      await resetFailedAttempts(req);

      const userData = {
        id: _id,
        email,
        currentSubscription,
        disabled,
        otp: false,
      };

      // Sign short-lived access token (2h)
      const accessToken = await signAccessToken(userData);

      if (!accessToken) throw new Error(accessToken);

      // Sign long-lived refresh token (7d) and store in DB
      const refreshToken = await signRefreshToken(userData);

      if (!refreshToken) throw new Error(refreshToken);

      const refreshTokenDoc = await RefreshToken.create({
        ownerID: _id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      });

      if (!refreshTokenDoc) throw new Error("Failed to store refresh token.");

      // Set refresh token as HttpOnly, Secure cookie
      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: "/",
      });

      res.status(200).json({
        message: "Login successful",
        token: accessToken,
      });
    } catch (err) {
      if (err?.message)
        res
          .status(500)
          .json({ error: err?.message, response_status: "danger" });
    }
  },

  generateLoginOtp: async (req, res) => {
    try {
      if (
        !req.body.id ||
        !req.body.email ||
        !req.body.currentSubscription ||
        req.body.disabled !== false ||
        req.body.otp !== false
      )
        throw new Error("Unauthorized action.");

      const { id, email, currentSubscription, disabled } = req.body;

      const userOtpDoc = (await Otp.findOne({ ownerID: id })) || null;

      const loginOtp = userOtpDoc?.loginOtp || null;
      const isLoginOtpVerified =
        userOtpDoc?.isLoginOtpVerified !== (null || undefined)
          ? userOtpDoc.isLoginOtpVerified
          : null;
      const loginOtpExpiry = userOtpDoc?.loginOtpExpiry || null;

      if (
        loginOtp !== null &&
        loginOtp &&
        isLoginOtpVerified !== null &&
        isLoginOtpVerified === false &&
        loginOtpExpiry &&
        loginOtpExpiry !== null &&
        Date.now() < loginOtpExpiry
      )
        res.status(200).json({
          message:
            "OTP has already been sent, please try again after a few minutes",
        });

      if (
        loginOtp !== null &&
        loginOtp &&
        isLoginOtpVerified !== null &&
        isLoginOtpVerified === false &&
        loginOtpExpiry !== null &&
        loginOtpExpiry &&
        Date.now() > loginOtpExpiry
      ) {
        const newLoginOtp = generateOTP();
        const newLoginOtpExpiry = generateOTPExpiryTime();

        const hashedLoginOtp = await hash(encrypt(newLoginOtp), 10);

        if (!hashedLoginOtp) throw new Error(hashedLoginOtp);

        const isEmailSent = await sendEmail(
          email,
          "LIPARENT Login OTP",
          `Your login OTP is: ${newLoginOtp}`,
        );

        if (!isEmailSent) throw new Error("Failed to send login OTP email.");

        const resetLoginOtpDetails = await Otp.updateOne(
          { ownerID: id },
          {
            $set: {
              loginOtp: hashedLoginOtp,
              isLoginOtpVerified: false,
              loginOtpExpiry: newLoginOtpExpiry,
            },
          },
        );

        if (
          !resetLoginOtpDetails.acknowledged &&
          !resetLoginOtpDetails.modifiedCount
        )
          throw new Error("An error has occurred");

        const loginToken = await signLoginToken({
          id,
          email,
          currentSubscription,
          disabled,
          otp: newLoginOtp,
        });

        if (!loginToken) throw new Error(loginToken);

        res.status(200).json({
          message: "Login Otp has been sent to your email",
          newLoginOtp,
          loginToken,
        });
      }

      if (!userOtpDoc || (!loginOtp && isLoginOtpVerified && !loginOtpExpiry)) {
        const newLoginOtp = generateOTP();
        const newLoginOtpExpiry = generateOTPExpiryTime();

        const hashedLoginOtp = await hash(encrypt(newLoginOtp), 10);

        if (!hashedLoginOtp) throw new Error(hashedLoginOtp);

        const isEmailSent = await sendEmail(
          email,
          "LIPARENT Login OTP",
          `Your login OTP is: ${newLoginOtp}`,
        );

        if (!isEmailSent) throw new Error("Failed to send login OTP email.");

        const loginOtpDetailsToDB = !userOtpDoc
          ? await Otp.create({
              ownerID: id,
              loginOtp: hashedLoginOtp,
              isLoginOtpVerified: false,
              loginOtpExpiry: newLoginOtpExpiry,
            })
          : await Otp.updateOne(
              { ownerID: id },
              {
                loginOtp: hashedLoginOtp,
                isLoginOtpVerified: false,
                loginOtpExpiry: newLoginOtpExpiry,
              },
            );

        if (!loginOtpDetailsToDB) throw new Error("Error getting login otp");

        const loginToken = await signLoginToken({
          id,
          email,
          currentSubscription,
          disabled,
          otp: newLoginOtp,
        });

        if (!loginToken) throw new Error(loginToken);

        res.status(200).json({
          message: "Login Otp has been sent to your email",
          newLoginOtp,
          loginToken,
        });
      }
    } catch (err) {
      if (err.message) res.status(400).json({ error: err.message });
    }
  },

  verifyLoginOtp: async (req, res) => {
    try {
      if (
        !req.body.id ||
        !req.body.currentSubscription ||
        req.body.disabled !== false ||
        !req.body.otp
      )
        throw new Error("Unauthorized action");

      const { id, email, currentSubscription, disabled, otp } = req.body;

      if (otp !== req.headers.otp) throw new Error("Invalid OTP");

      const userOtpDoc = await Otp.findOne({ ownerID: id });

      const loginOtp = userOtpDoc?.loginOtp || null;
      const isLoginOtpVerified =
        userOtpDoc?.isLoginOtpVerified === false
          ? userOtpDoc?.isLoginOtpVerified
          : null;
      const loginOtpExpiry = userOtpDoc?.loginOtpExpiry || null;

      if (!loginOtp || loginOtp === null)
        throw new Error("Something went wrong");

      if (isLoginOtpVerified !== false || isLoginOtpVerified === null)
        throw new Error("Something went wrong");

      if (loginOtpExpiry && Date.now() > loginOtpExpiry)
        throw new Error("Invalid Otp");

      const isOtpValid = await compare(encrypt(otp), loginOtp);

      if (!isOtpValid) throw new Error("Invalid Otp");

      const loginOtpDetailsToDB = await Otp.updateOne(
        { ownerID: id },
        {
          $set: {
            loginOtp: null,
            isLoginOtpVerified: true,
            loginOtpExpiry: null,
          },
        },
      );

      if (
        !loginOtpDetailsToDB.acknowledged &&
        !loginOtpDetailsToDB.modifiedCount
      )
        throw new Error("Error adding login otp details to database");

      const passwordDoc = await Password.findOne({ ownerID: id });

      const tokenVersion = passwordDoc?.tokenVersion ?? 0;

      const userData = {
        id,
        email,
        currentSubscription,
        disabled,
        user: true,
        tokenVersion,
      };

      const loginToken = await signAccessToken(userData);

      if (!loginToken) throw new Error(loginToken);

      res.status(200).json({
        message: "Login successful",
        token: loginToken,
      });
    } catch (err) {
      if (err.message) res.status(400).json({ error: err.message });
    }
  },
};

module.exports = loginControllers;
