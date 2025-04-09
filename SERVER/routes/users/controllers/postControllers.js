const { compare, hash } = require("bcrypt");

const crypto = require("node:crypto");

const { signAccessToken } = require("../../../middleware/tokens/accessToken");

const {
  ObjectId: { isValid, createFromHexString },
} = require("mongodb");

const { Owner } = require("../../../middleware/models/Owner");
const { Password } = require("../../../middleware/models/Password");
const { Subscription } = require("../../../middleware/models/Subscription");
const { Property } = require("../../../middleware/models/Property");
const { Room } = require("../../../middleware/models/Room");
const { Tenant } = require("../../../middleware/models/Tenant");
const { Rent } = require("../../../middleware/models/Rent");
const { Otp } = require("../../../middleware/models/Otp");

const { checkSubscriptionExpiry } = require("../helpers/checkSubscription");
const { encrypt } = require("../../helpers/cipher");
const { signSignUpToken } = require("../../../middleware/tokens/signUpToken");
const { signLoginToken } = require("../../../middleware/tokens/loginToken");
const {
  signForgotPasswordToken,
} = require("../../../middleware/tokens/forgotPasswordToken");

///////*************************POST CONTROLLERS************************////////////////

const post_controllers = {
  //! SIGN UP NEW USER.
  generateSignUpOtp: async (req, res) => {
    try {
      if (
        !req.body.name ||
        !req.body.nationalID ||
        !req.body.email ||
        !req.body.phone ||
        !req.body.password ||
        !req.body.confirmPassword
      )
        throw new Error("provide all valid details");

      const { name, nationalID, email, phone, password, confirmPassword } =
        req.body;

      if (encrypt(password) !== encrypt(confirmPassword))
        throw new Error("passwords do not match.");

      const accountExists = await Owner?.findOne({
        email: email,
        nationalID: nationalID,
      });

      let newOwnerId;

      if (!accountExists) {
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

        newOwnerId = newOwner?._id?.toString();
      }

      // const hex = [...crypto.getRandomValues(new Uint32Array(16))]
      //   .map((randomValue) => randomValue.toString(16))
      //   .slice(-4)
      //   .join("")
      //   .slice(-24);

      const id =
        accountExists?._id && !newOwnerId
          ? accountExists?._id?.toString()
          : newOwnerId;

      const signUpOtp = crypto.randomUUID().slice(-12);
      const signUpOtpExpiry = Date.now() + 10 * 60 * 1000;

      const hashedSignUpOtp = await hash(encrypt(signUpOtp), 10);

      if (!hashedSignUpOtp) throw new Error(hashedSignUpOtp);

      const signUpOtpDetailsToDB =
        accountExists?._id && !newOwnerId
          ? await Otp.updateOne(
              { ownerID: id },
              {
                $set: {
                  signUpOtp: hashedSignUpOtp,
                  isSignUpOtpVerified: false,
                  signUpOtpExpiry: signUpOtpExpiry,
                },
              }
            )
          : await Otp.create({
              ownerID: id,
              signUpOtp: hashedSignUpOtp,
              isSignUpOtpVerified: false,
              signUpOtpExpiry: signUpOtpExpiry,
            });

      if (
        accountExists?._id &&
        !newOwnerId &&
        !signUpOtpDetailsToDB.acknowledged &&
        !signUpOtpDetailsToDB.modifiedCount
      )
        throw new Error("Error adding sign up otp details to database");

      if (
        !accountExists?._id &&
        newOwnerId &&
        !signUpOtpDetailsToDB._id &&
        !signUpOtpDetailsToDB.ownerID
      )
        throw new Error("Error adding sign up otp details to database");

      const signUpToken = await signSignUpToken({
        id,
        otp: signUpOtp,
      });

      if (!signUpToken) throw new Error(signUpToken);

      res.status(200).json({
        message: "Verify your email, check your email for code.",
        signUpOtp,
        signUpToken,
      });
    } catch (err) {
      if (err.message) res.status(400).json({ error: err.message });
    }
  },

  verifySignUpOtp: async (req, res) => {
    try {
      if (!req.body.id || !req.body.otp) throw new Error("Unauthorized action");

      const { id, otp } = req.body;

      if (otp !== req.headers.otp) throw new Error("Unauthorized action");

      const userOtpDoc = await Otp.findOne({ ownerID: id });

      const signUpOtp = userOtpDoc.signUpOtp || null;
      const isSignUpOtpVerified = userOtpDoc.isSignUpOtpVerified || null;
      const signUpOtpExpiry = userOtpDoc.signUpOtpExpiry || null;

      if (signUpOtpExpiry && Date.now() > signUpOtpExpiry)
        throw new Error("Invalid Otp");

      // if (!signUpOtp && otp && isSignUpOtpVerified && !signUpOtpExpiry)
      //   throw new Error("OTP verified, please proceed the next step");

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
        }
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
        }
      );

      if (!ownerDetailsToDB.acknowledged && !ownerDetailsToDB.modifiedCount)
        throw new Error("Something went wrong when updating owner details");

      const signUpToken = await signSignUpToken({
        id,
        otpVerified: true,
      });

      if (!signUpToken) throw new Error(signUpToken);

      res.status(200).json({
        message: "Email verified successful",
        signUpToken,
      });
    } catch (err) {
      if (err.message) res.status(400).json({ error: err.message });
    }
  },

  signUp: async (req, res) => {
    try {
      if (!req.body.id || !req.body.password || !req.body.confirmPassword)
        throw new Error("Unauthorized action.");

      const { id, password, confirmPassword } = req.body;

      if (encrypt(password) !== encrypt(confirmPassword))
        throw new Error("passwords do not match.");

      const accountExists = await Owner?.findOne({
        _id: id.toString(),
      });

      if (!accountExists)
        throw new Error(
          "Error occured, please repeat the sign up process from the beginning"
        );

      const userOtpDoc = await Otp.findOne({ ownerID: id });

      if (!userOtpDoc.isSignUpOtpVerified)
        throw new Error("Please complete email verification");

      if (
        userOtpDoc.isSignUpOtpVerified !== (null || undefined) &&
        userOtpDoc.isSignUpOtpVerified === false
      )
        throw new Error("Please complete email verification");

      const newOwnerPasswordDB = await Password.create({
        ownerID: id,
        password: encrypt(password),
      });

      if (!newOwnerPasswordDB)
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
        ownerID: id,
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

      const newOwnerPropertyBody = {
        ownerID: id,
        propertiesOwned: [{}],
      };

      const newOwnerPropertyCollection = await Property?.create(
        newOwnerPropertyBody
      );

      if (!newOwnerPropertyCollection)
        throw new Error(
          "Failed to create a new instance of the property document in the database."
        );

      const newOwnerTenantBody = {
        ownerID: id,
        tenants: [{}],
      };

      const newOwnerTenantCollection = await Tenant?.create(newOwnerTenantBody);

      if (!newOwnerTenantCollection)
        throw new Error(
          "Failed to create a new instance of the tenant document in the database."
        );

      const newOwnerRoomsBody = {
        ownerID: id,
        rooms: [{}],
      };

      const newOwnerRoomsCollection = await Room?.create(newOwnerRoomsBody);

      if (!newOwnerRoomsCollection)
        throw new Error(
          "Failed to create a new instance of the room document in the database."
        );

      const newOwnerRentBody = {
        ownerID: id,
        rents: [{}],
      };

      const newOwnerRentCollection = await Rent?.create(newOwnerRentBody);

      if (!newOwnerRentCollection)
        throw new Error(
          "Failed to create a new instance of the property document in the database."
        );

      const ownerDetailsToDB = await Owner.updateOne(
        { _id: id.toString() },
        {
          $set: {
            emailVerified: true,
          },
        }
      );

      if (!ownerDetailsToDB.acknowledged && !ownerDetailsToDB.modifiedCount)
        throw new Error("Error adding email verification details to database");

      const otpDocDeletion = await Otp.deleteOne({ ownerID: id });

      if (!otpDocDeletion.acknowledged && !otpDocDeletion.deletedCount)
        throw new Error("something went wrong, 'otp'");

      res.status(201).json({
        message: `An account has been succesfully created, proceed to log in to your account.`,
        response_status: "success",
      });
    } catch (err) {
      if (err?.message)
        res
          .status(500)
          .json({ error: err?.message, response_status: "danger" });
    }
  },

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

      if (!user) throw new Error("Incorrect Email,NationalID or Password.");

      const { _id, paid, disabled, emailVerified } = user;

      if (emailVerified === false) throw new Error("Unverified email.");

      if (paid === false)
        throw new Error("Renew subscription to regain access.");

      if (disabled === true) throw new Error("Account has been disabled.");

      const dbPassword = await Password?.findOne({
        ownerID: _id,
      });

      if (!dbPassword)
        throw new Error("Incorrect Email,NationalID or Password.");

      const passwordMatch = await compare(
        encryptedPassword,
        dbPassword?.password
      );

      if (!passwordMatch)
        throw new Error("Incorrect Email,NationalID or Password.");

      const { currentSubscription } = await Subscription?.findOne({
        ownerID: _id,
      });

      if (!currentSubscription) throw new Error("Subscribe to proceed.");

      const isSubscriptionExpired =
        checkSubscriptionExpiry(currentSubscription);

      if (isSubscriptionExpired && isSubscriptionExpired.error) {
        const updatePaidStatus = await Owner.findOneAndUpdate(
          { _id: _id },
          { $set: { paid: false, disabled: true } }
        );

        if (updatePaidStatus) throw new Error(isSubscriptionExpired?.error);
      }

      const userData = { id: _id, currentSubscription, disabled, otp: false };

      const loginToken = await signLoginToken(userData);

      if (!loginToken) throw new Error(loginToken);

      res.status(200).json({
        loginToken,
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
        !req.body.currentSubscription ||
        req.body.disabled !== false ||
        req.body.otp !== false
      )
        throw new Error("Unauthorized action.");

      const { id, currentSubscription, disabled } = req.body;

      const userOtpDoc = await Otp.findOne({ ownerID: id });

      const loginOtp = userOtpDoc.loginOtp || null;
      const isLoginOtpVerified = userOtpDoc.isLoginOtpVerified || null;
      const loginOtpExpiry = userOtpDoc.loginOtpExpiry || null;

      if (
        (loginOtp && loginOtp !== null) ||
        (isLoginOtpVerified && isLoginOtpVerified !== null) ||
        (loginOtpExpiry && loginOtpExpiry !== null)
      ) {
        const resetLoginOtpDetails = await Otp.updateOne(
          { ownerID: id },
          {
            $set: {
              loginOtp: null,
              isLoginOtpVerified: null,
              loginOtpExpiry: null,
            },
          },
          { new: true }
        );

        if (
          !resetLoginOtpDetails.acknowledged &&
          !resetLoginOtpDetails.modified
        )
          throw new Error("An error has occurred");
      }

      const newLoginOtp = crypto.randomUUID().slice(-12);
      const newLoginOtpExpiry = Date.now() + 10 * 60 * 1000;

      const hashedLoginOtp = await hash(encrypt(newLoginOtp), 10);

      if (!hashedLoginOtp) throw new Error(hashedLoginOtp);

      const loginOtpDetailsToDB = await Otp.updateOne(
        { ownerID: id },
        {
          $set: {
            loginOtp: hashedLoginOtp,
            isLoginOtpVerified: false,
            loginOtpExpiry: newLoginOtpExpiry,
          },
        },
        { new: true }
      );

      if (
        !loginOtpDetailsToDB.acknowledged &&
        !loginOtpDetailsToDB.modifiedCount
      )
        throw new Error("Error adding login otp details to database");

      const loginToken = await signLoginToken({
        id,
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

      const { id, currentSubscription, disabled, otp } = req.body;

      if (otp !== req.headers.otp) throw new Error("Unauthorized action");

      const userOtpDoc = await Otp.findOne({ ownerID: id });

      const loginOtp = userOtpDoc.loginOtp || null;
      const isLoginOtpVerified = userOtpDoc.isLoginOtpVerified || null;
      const loginOtpExpiry = userOtpDoc.loginOtpExpiry || null;

      const isOtpValid = await compare(encrypt(otp), loginOtp);

      if (!isOtpValid) throw new Error("Invalid Otp");

      if (isLoginOtpVerified && isLoginOtpVerified !== false)
        throw new Error("Invalid Otp");

      if (loginOtpExpiry && Date.now() > loginOtpExpiry)
        throw new Error("Invalid Otp");

      const loginOtpDetailsToDB = await Otp.updateOne(
        { ownerID: id },
        {
          $set: {
            loginOtp: null,
            isLoginOtpVerified: true,
            loginOtpExpiry: null,
          },
        },
        { new: true }
      );

      if (
        !loginOtpDetailsToDB.acknowledged &&
        !loginOtpDetailsToDB.modifiedCount
      )
        throw new Error("Error adding login otp details to database");

      const userData = { id, currentSubscription, disabled, user: true };

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

  //! ADDING A SUBSCRIPTION

  //! READING OWNER DETAILS
  readOwnerDetails: async (req, res) => {
    try {
      if (!req.body.id) throw new Error("Unauthorized action.");

      const { id } = req.body;

      const owner = await Owner.findOne({ _id: id });

      if (!owner) throw new Error("Owner details not found.");

      res.status(200).json({
        owner: {
          name: owner.name,
          nationalID: owner.nationalID,
          email: owner.email,
          phone: owner.phone,
        },
      });
    } catch (err) {
      if (err.message) res.status(400).json({ error: err.message });
    }
  },

  //! PROPERTY ENDPOINTS THE DEAL WITH THE CREATION AND READING OF PROPERTIES OWNED DATA FROM THE DATABASE.

  //?  below is the expected requestBody from the user when creating a property.
  //* {
  //*   propertyName: "ELKO APARTMENTS",
  //*   propertyNumber: "NGONG/NGONG/12058",
  //*   propertyLocation: "NGONG",
  //* },

  createNewProperty: async (req, res) => {
    try {
      const { id, newProperty } = req.body;

      if (!id)
        throw new Error("Unauthorized action, not a user or not logged in.");

      if (!isValid(id))
        throw new Error("ID provided is not a valid document Id.");

      if (!newProperty) throw new Error("provide a valid property.");

      const ownerPropertiesDocument = await Property.findOne({ ownerID: id });

      if (!ownerPropertiesDocument) throw new Error(ownerPropertiesDocument);

      const { propertiesOwned } = ownerPropertiesDocument;

      newProperty.propertyID = crypto.randomUUID().slice(-12);

      let checkIfPropertyNumberIsRegistered = false;

      for (const key in propertiesOwned[0]) {
        if (
          propertiesOwned[0][key].propertyNumber === newProperty.propertyNumber
        ) {
          checkIfPropertyNumberIsRegistered =
            !checkIfPropertyNumberIsRegistered;

          break;
        }
      }

      if (checkIfPropertyNumberIsRegistered)
        throw new Error(
          "Property with the given property number has already been registered."
        );

      propertiesOwned[0][newProperty.propertyID] = newProperty;

      const addNewProperty = await Property.updateOne(
        { ownerID: id },
        { $set: { propertiesOwned } }
      );

      if (!addNewProperty) throw new Error("No entry found to update...");

      const roomsDocument = await Room.findOne({ ownerID: id });

      if (!roomsDocument) throw new Error(roomsDocument);

      const { rooms } = roomsDocument;

      if (rooms === (null || undefined))
        throw new Error("no data found for rooms");

      rooms[0][newProperty.propertyID] = {
        propertyID: newProperty.propertyID,
        propertyNumber: newProperty.propertyNumber,
        rooms: {},
      };

      const updatePropertiesRooms = await Room.findOneAndUpdate(
        { ownerID: id },
        {
          $set: {
            rooms,
          },
        }
      );

      if (!updatePropertiesRooms)
        throw new Error("Property rooms document failed to be created.");

      const tenantsDocument = await Tenant.findOne({ ownerID: id });

      if (!tenantsDocument) throw new Error(tenantsDocument);

      const { tenants } = tenantsDocument;

      if (tenants === (null || undefined))
        throw new Error("no data found for tenants");

      tenants[0][newProperty.propertyID] = {
        propertyID: newProperty.propertyID,
        propertyNumber: newProperty.propertyNumber,
        tenants: {},
      };

      const updatePropertiesRoomsTenants = await Tenant.findOneAndUpdate(
        { ownerID: id },
        {
          $set: {
            tenants,
          },
        },

        { upsert: true, new: true }
      );

      if (!updatePropertiesRoomsTenants)
        throw new Error("Property tenants document failed to be created.");

      // adding rents object in the database
      const rentsDocument = await Rent.findOne({ ownerID: id });

      if (!rentsDocument) throw new Error(rentsDocument);

      const { rents } = rentsDocument;

      if (rents === (null || undefined))
        throw new Error("no data found for rents");

      rents[0][newProperty.propertyID] = {
        propertyID: newProperty.propertyID,
        propertyNumber: newProperty.propertyNumber,
        rentPayments: {},
      };

      const updatePropertiesRoomsTenantsRents = await Rent.findOneAndUpdate(
        { ownerID: id },
        {
          $set: {
            rents,
          },
        }
      );

      if (!updatePropertiesRoomsTenantsRents)
        throw new Error("Property rents document failed to be created.");

      if (
        addNewProperty &&
        updatePropertiesRooms &&
        updatePropertiesRoomsTenants &&
        updatePropertiesRoomsTenantsRents
      )
        res.status(200).json({
          message: `Property with ID: ${newProperty.propertyID} and Number: ${newProperty.propertyNumber} has been created successfully.`,
          newProperties: propertiesOwned[0],
        });
    } catch (err) {
      if (err?.message)
        res
          .status(500)
          .json({ error: err?.message, response_status: "danger" });
    }
  },

  //?  below is the expected requestBody from the user when reading all properties.
  //* {
  // ...
  //* }

  readAllPropertiesOwned: async (req, res) => {
    try {
      if (!req.body.id)
        throw new Error("Unauthorized action, not a user or not logged in.");
      const { id } = req.body;

      if (!isValid(id)) throw new Error("Invalid document ID.");

      const allProperties = await Property.findOne({ ownerID: id });

      if (!allProperties) throw new Error(allProperties);

      const { propertiesOwned } = allProperties;

      if (propertiesOwned === (null || undefined))
        throw new Error("Error when reading the properties.");

      if (!Object.keys(propertiesOwned[0]))
        throw new Error("No properties have been added.");

      res.status(200).json({ propertiesOwned: propertiesOwned[0] });
    } catch (err) {
      if (err?.message)
        res
          .status(500)
          .json({ error: err?.message, response_status: "danger" });
    }
  },

  //?  below is the expected requestBody from the user when reading a property.
  //* {
  //*   propertyNumber: "NGONG/NGONG/12058",
  //*   propertyID: "HDFBSUEHDUIFHW783YRWUHF84YF3",
  //* }

  readSinglePropertyOwned: async (req, res) => {
    try {
      const { id, propertyNo, propertyId } = req.body;

      if (!id)
        throw new Error("Unauthorized action, not a user or not logged in.");

      if (!propertyNo) throw new Error("provide a valid property number.");

      const allPropertiesDOC = await Property.findOne({ ownerID: id });

      if (!allPropertiesDOC) throw new Error(allPropertiesDOC);

      const { propertiesOwned } = allPropertiesDOC;

      const selectedProperty = propertiesOwned[0][propertyId];

      if (!selectedProperty)
        throw new Error(
          "Selected propertyId is not found/not registered in the database."
        );

      if (selectedProperty.propertyNumber !== propertyNo)
        throw new Error(
          "Selected propertyNumber does not match the property ID selected."
        );

      if (selectedProperty) res.status(200).json({ selectedProperty });
    } catch (err) {
      if (err?.message)
        res
          .status(500)
          .json({ error: err?.message, response_status: "danger" });
    }
  },

  //! ROOM ENDPOINTS THAT DEAL WITH THE ADDING AND READING OF THE ROOMS DATA IN THE DATABASE.

  //?  below is the expected requestBody from the user when creating a room  in property
  //*  {
  //*   propertyID: "HDFBSUEHDUIFHW783YRWUHF84YF3",
  //*   newRoom: {
  //*   roomNumber: "PK1",
  //*   roomRatePerMonth: "6000",
  //*   roomArea: "2500sqFT",
  //*   roomType: "SingleRoom",
  //*    }
  //*  }

  createSingleRoomOnProperty: async (req, res) => {
    try {
      if (!req.body.id) throw new Error("Unknown user...");
      if (!req.body.propertyId) throw new Error("provide a valid property Id.");
      if (!req.body.newRoom) throw new Error("provide a valid room.");

      const { id, propertyId, newRoom } = req.body;

      if (!id)
        throw new Error("Unauthorized action, not a user or not logged in.");

      if (!isValid(id))
        throw new Error("ID provided is not a valid document Id.");

      const roomsDocument = await Room.findOne({ ownerID: id });

      if (!roomsDocument) throw new Error(roomsDocument);

      const { rooms } = roomsDocument;

      if (rooms === (null || undefined))
        throw new Error("rooms property not found in the  db document.");

      const checkIfPropertyIdIsRegistered = rooms[0][propertyId];

      if (!checkIfPropertyIdIsRegistered)
        throw new Error(
          "Property with the given property Id has not been registered."
        );

      newRoom.isOccupied = false;
      newRoom.currentTenantID = null;
      newRoom.roomID = crypto.randomUUID()?.slice(-12);

      const propertyRooms = checkIfPropertyIdIsRegistered?.rooms;

      if (!Array.from(Object.keys(propertyRooms)).length) {
        rooms[0][propertyId].rooms[newRoom.roomID] = newRoom;
      } else {
        let checkIfRoomNumberIsRegisteredUnderTheSelectedProperty = false;

        for (const key in propertyRooms) {
          if (propertyRooms[key]?.roomNumber === newRoom?.roomNumber) {
            checkIfRoomNumberIsRegisteredUnderTheSelectedProperty =
              !checkIfRoomNumberIsRegisteredUnderTheSelectedProperty;

            break;
          }
        }

        if (checkIfRoomNumberIsRegisteredUnderTheSelectedProperty)
          throw new Error(
            "Room with the given room number has already been registered."
          );

        rooms[0][propertyId].rooms[newRoom.roomID] = newRoom;
      }

      const updateProperties = await Room.updateOne(
        { ownerID: id },
        {
          $set: {
            rooms,
          },
        }
      );

      if (updateProperties.acknowledged && updateProperties.modifiedCount) {
        const findTenants = await Tenant.findOne({ ownerID: id });

        const tenants = findTenants ? findTenants.tenants : null;

        if (!tenants) throw new Error("tenants doc prop not found.");

        tenants[0][propertyId].tenants[newRoom.roomID] = {};

        const updateTenants = await Tenant.updateOne(
          { ownerID: id },
          {
            $set: {
              tenants,
            },
          }
        );

        if (updateTenants.acknowledged && updateTenants.modifiedCount) {
          const findRents = await Rent.findOne({ ownerID: id });

          const rents = findRents ? findRents.rents : null;

          if (!rents) throw new Error("rents doc prop not found.");

          rents[0][propertyId].rentPayments[newRoom.roomID] = {};

          const updateRents = await Rent.updateOne(
            { ownerID: id },
            {
              $set: {
                rents,
              },
            }
          );

          if (updateRents.acknowledged && updateRents.modifiedCount)
            res.status(200).json({
              message: `New room with the Number: ${newRoom.roomNumber} and ID: ${newRoom.roomID} has been successfuly added to the property: ${propertyId}.`,
              propertyRooms,
            });
        }
      } else {
        throw new Error("Could not update the database.");
      }
    } catch (err) {
      if (err.message) res.status(400).json({ error: err.message });
    }
  },

  //?  below is the expected requestBody from the user when reading all rooms on property.
  //* {
  //*   propertyID: "HDFBSUEHDUIFHW783YRWUHF84YF3",
  //* }

  readAllRoomsOnProperty: async (req, res) => {
    try {
      if (!req.body.id) throw new Error("Unknown user...");
      if (!req.body.propertyId) throw new Error("provide a valid property ID.");

      const { id, propertyId } = req.body;

      if (!id)
        throw new Error("Unauthorized action, not a user or not logged in.");

      if (!isValid(id))
        throw new Error("ID provided is not a valid document Id.");

      const roomsDocument = await Room.findOne({ ownerID: id });

      if (!roomsDocument) throw new Error(roomsDocument);

      const { rooms } = roomsDocument;

      const selectUsingPropertyID = rooms[0][propertyId];

      if (!selectUsingPropertyID)
        throw new Error(
          "Selected propertyID is not found/not registered in the database."
        );

      const propertyRooms = selectUsingPropertyID?.rooms;

      if (!Array.from(Object.keys(propertyRooms)).length)
        res.status(200).json({
          propertyRooms: {},
          message: `"No rooms have been added to property: "${propertyId}".`,
        });
      else
        res.status(200).json({
          propertyRooms,
          message: `Rooms for property: "${propertyId}" retrieved successfully.`,
        });
    } catch (err) {
      if (err.message) res.status(400).json({ error: err.message });
    }
  },

  //?  below is the expected requestBody from the user when reading all rooms on property.
  //* {
  //*   propertyId: "HDFBSUEHDUIFHW783YRWUHF84YF3",
  //*   roomId: "HDFBSUEHDUIFHW783YRWUHF84YF3",
  //* }

  readSingleRoomOnProperty: async (req, res) => {
    try {
      if (!req.body.id)
        throw new Error("Unauthorized action, not a user or not logged in.");
      if (!req.body.propertyId) throw new Error("provide a valid property Id.");
      if (!req.body.propertyNo) throw new Error("provide a valid property Nd.");
      if (!req.body.roomId) throw new Error("provide a valid room Id.");
      if (!req.body.roomNo) throw new Error("provide a valid room Nd.");

      const { id, propertyId, propertyNo, roomId, roomNo } = req.body;

      if (!isValid(id))
        throw new Error("ID provided is not a valid document Id.");

      const roomsDocument = await Room.findOne({ ownerID: id });

      if (!roomsDocument) throw new Error(roomsDocument);

      const { rooms } = roomsDocument;

      const selectPropertyUsingPropertyID = rooms[0][propertyId];

      if (!selectPropertyUsingPropertyID)
        throw new Error(
          "Selected propertyID Rooms are not found/not registered in the database."
        );
      if (selectPropertyUsingPropertyID.propertyNumber !== propertyNo)
        throw new Error(
          "Selected propertyNumber Rooms are not found/not registered in the database."
        );

      const propertyRooms = selectPropertyUsingPropertyID?.rooms;

      const selectRoomInPropertyUsingRoomID = propertyRooms[roomId];

      if (!selectRoomInPropertyUsingRoomID)
        throw new Error(
          "Selected propertyID Room is not found/not registered in the database."
        );
      if (selectRoomInPropertyUsingRoomID.roomNumber !== roomNo)
        throw new Error(
          "Selected propertyId and propertyNumber Room do not match."
        );

      if (!Object.keys(selectRoomInPropertyUsingRoomID))
        throw new Error("No rooms have been added to this property.");

      res.status(200).json({ selectedRoom: selectRoomInPropertyUsingRoomID });
    } catch (err) {
      if (err.message) res.status(400).json({ error: err.message });
    }
  },

  //! TENANT ENDPOINTS FOR DEALING WITH THE TENANT DOCUMENT IN ADDING AND READING TENANT DATA FORM THE THE DATABASE.

  //?  below is the expected requestBody from the user when creating a tenant for a room in property
  //*  {
  //*   propertyId: "HDFBSUEHDUIFHW783YRWUHF84YF3",
  //*   roomId: "PK1",
  //*   newTenant: {
  //*    tenantName: "LIXO PESSAR",
  //*    tenantNationalID: "35501094",
  //*    tenantPhone: "254711776471",
  //*     }
  //*  }

  createTenantForRoomOnProperty: async (req, res) => {
    try {
      if (!req.body.id) throw new Error("Unknown user...");
      if (!req.body.propertyId) throw new Error("provide a valid property ID.");
      if (!req.body.roomId) throw new Error("provide a valid room ID.");
      if (!req.body.newTenant) throw new Error("provide a valid tenant.");

      const { id, propertyId, roomId, newTenant } = req?.body;

      if (!isValid(id))
        throw new Error("ID provided is not a valid document Id.");

      const tenantsDocument = await Tenant.findOne({ ownerID: id });

      if (!tenantsDocument) throw new Error(tenantsDocument);

      const { tenants } = tenantsDocument;

      const checkIfPropertyIdIsRegistered = tenants[0][propertyId];

      if (!checkIfPropertyIdIsRegistered)
        throw new Error(
          "Property with the given property Id has not been registered in the tenants database."
        );

      const propertyTenants = checkIfPropertyIdIsRegistered?.tenants;

      if (!propertyTenants)
        throw new Error("No tenants have been added to this property.");

      const checkIfRoomIdIsRegistered = propertyTenants[roomId];

      if (!checkIfRoomIdIsRegistered)
        throw new Error(
          "Room with the given ID has not been registered in the tenants database."
        );

      let checkIfTenantIsRegistered = false;

      for (const key in checkIfRoomIdIsRegistered) {
        if (
          checkIfRoomIdIsRegistered[key]?.tenantNationalID ===
          newTenant?.tenantNationalID
        ) {
          checkIfTenantIsRegistered = !checkIfTenantIsRegistered;
          break;
        }
      }

      if (checkIfTenantIsRegistered)
        throw new Error(
          "Tenant with the given National ID has already been registered in this room."
        );

      newTenant.tenantID = crypto.randomUUID().slice(-12);
      newTenant.moveInDate = new Date().toLocaleDateString();
      newTenant.moveOutDate = null;

      tenants[0][propertyId].tenants[roomId][newTenant.tenantID] = newTenant;

      const updateTenants = await Tenant.updateOne(
        { ownerID: id },
        {
          $set: {
            tenants,
          },
        }
      );

      if (!updateTenants.acknowledged && !updateTenants.modifiedCount)
        throw new Error("Could not update the tenants database.");

      const findRents = await Rent.findOne({ ownerID: id });

      const rents = findRents ? findRents.rents : null;

      if (!rents) throw new Error("rents doc prop not found.");

      rents[0][propertyId].rentPayments[roomId][newTenant.tenantID] = [];

      const updateRents = await Rent.updateOne(
        { ownerID: id },
        {
          $set: {
            rents,
          },
        }
      );

      if (!updateRents.acknowledged && !updateRents.modifiedCount)
        throw new Error("Could not update the rents database.");

      const findRooms = await Room.findOne({ ownerID: id });

      const rooms = findRooms ? findRooms.rooms : null;

      if (!rooms) throw new Error("rooms doc prop not found.");

      rooms[0][propertyId].rooms[roomId].currentTenantID =
        newTenant.tenantNationalID;

      rooms[0][propertyId].rooms[roomId].isOccupied =
        !rooms[0][propertyId].rooms[roomId].isOccupied;

      const updateRooms = await Room.updateOne(
        { ownerID: id },
        {
          $set: {
            rooms,
          },
        }
      );

      if (!updateRooms.acknowledged && !updateRooms.modifiedCount)
        throw new Error("Could not update the rooms database.");

      res.status(200).json({
        message: `New tenant with the Name: ${newTenant.tenantName} and ID: ${newTenant.tenantID} has been successfuly added to Room: ${roomId} on the property.`,
        newRoomTenants: tenants[0][propertyId].tenants[roomId],
      });
    } catch (err) {
      if (err?.message) res.status(400).json({ error: err.message });
    }
  },

  //?  below is the expected requestBody from the user when reading all tenants for all rooms in property
  //*  { propertyId: "HDFBSUEHDUIFHW783YRWUHF84YF3",
  //*   propertyNo: "NGONG/NGONG/12058",}

  readAllTenantsForAllRoomsOnProperty: async (req, res) => {
    try {
      if (!req.body.id) throw new Error("Unknown user...");
      if (!req.body.propertyId) throw new Error("provide a valid property ID.");

      const { id, propertyId } = req?.body;

      if (!isValid(id))
        throw new Error("ID provided is not a valid document Id.");

      const tenantsDocument = await Tenant.findOne({ ownerID: id });

      if (!tenantsDocument) throw new Error(tenantsDocument);

      const { tenants } = tenantsDocument;

      const checkIfPropertyIdIsRegistered = tenants[0][propertyId];

      if (!checkIfPropertyIdIsRegistered)
        throw new Error(
          "Property with the given property Id has not been registered in the tenants database."
        );

      const selectedPropertyTenants = checkIfPropertyIdIsRegistered?.tenants;

      if (!selectedPropertyTenants)
        throw new Error("No tenants have been added to this property.");

      res.status(200).json({ selectedPropertyTenants });
    } catch (err) {
      if (err?.message) res.status(400).json({ error: err.message });
    }
  },

  //?  below is the expected requestBody from the user when reading all tenants for a room in property
  //*  {
  //*   propertyId: "HDFBSUEHDUIFHW783YRWUHF84YF3",
  //*   roomId: "87g87tg78t8g7",
  //*  }
  readAllTenantsInRoomOnProperty: async (req, res) => {
    try {
      if (!req.body.id) throw new Error("Unknown user...");
      if (!req.body.propertyId) throw new Error("provide a valid property ID.");
      if (!req.body.roomId) throw new Error("provide a valid room ID.");

      const { id, propertyId, roomId } = req?.body;

      if (!isValid(id))
        throw new Error("ID provided is not a valid document Id.");

      const tenantsDocument = await Tenant.findOne({ ownerID: id });

      if (!tenantsDocument) throw new Error(tenantsDocument);

      const { tenants } = tenantsDocument;

      const checkIfPropertyIdIsRegistered = tenants[0][propertyId];

      if (!checkIfPropertyIdIsRegistered)
        throw new Error(
          "Property with the given property Id has not been registered in the tenants database."
        );

      const selectedPropertyTenants = checkIfPropertyIdIsRegistered?.tenants;

      if (!selectedPropertyTenants)
        throw new Error("No rooms have been added to this property.");

      const selectedRoomOnPropertyTenants = selectedPropertyTenants[roomId];

      if (!selectedRoomOnPropertyTenants)
        throw new Error(`No tenants found found for ${roomId}.`);

      if (!Array.from(Object.keys(selectedRoomOnPropertyTenants)).length)
        res.status(200).json({
          selectedRoomOnPropertyTenants: {},
          message: `"No tenants have been added to room: "${roomId}".`,
        });
      else
        res.status(200).json({
          selectedRoomOnPropertyTenants,
          message: `Tenants for room ${roomId} have been successfully retrieved.`,
        });
    } catch (err) {
      if (err?.message) res.status(400).json({ error: err.message });
    }
  },

  //?  below is the expected requestBody from the user when reading all tenants for a room in property
  //*  {
  //*   propertyId: "HDFBSUEHDUIFHW783YRWUHF84YF3",
  //*   propertyNo: "NGONG/NGONG/12058",
  //*   roomId: "PK1",
  //*   tenantId: "35501094",
  //*  }

  readSingleTenantInRoomOnProperty: async (req, res) => {
    try {
      if (!req.body.id) throw new Error("Unknown user...please log in");
      if (!req.body.propertyId) throw new Error("provide a valid property Id.");
      if (!req.body.propertyNo) throw new Error("provide a valid property No.");
      if (!req.body.roomId) throw new Error("provide a valid room Id.");
      if (!req.body.tenantId) throw new Error("provide a valid tenant Id.");

      const { id, propertyId, propertyNo, roomId, tenantId } = req?.body;

      if (!isValid(id))
        throw new Error("ID provided is not a valid document Id.");

      const tenantsDocument = await Tenant.findOne({ ownerID: id });

      if (!tenantsDocument) throw new Error(tenantsDocument);

      const { tenants } = tenantsDocument;

      const checkIfPropertyIdIsRegistered = tenants[0][propertyId];

      if (
        !checkIfPropertyIdIsRegistered ||
        (!checkIfPropertyIdIsRegistered &&
          checkIfPropertyIdIsRegistered?.propertyNumber !== propertyNo)
      ) {
        if (
          !checkIfPropertyIdIsRegistered &&
          checkIfPropertyIdIsRegistered?.propertyNumber !== propertyNo
        )
          throw new Error(
            "Property with the given property Id and  property number has not been registered in the tenants database."
          );

        if (!checkIfPropertyIdIsRegistered)
          throw new Error(
            "Property with the given property Id has not been registered in the tenants database."
          );
      }

      const selectedPropertyTenants = checkIfPropertyIdIsRegistered?.tenants;

      if (!selectedPropertyTenants)
        throw new Error("No tenants have been added to this property.");

      const selectedRoomOnPropertyTenants = selectedPropertyTenants[roomId];

      if (!selectedRoomOnPropertyTenants)
        throw new Error("No tenants have been added to this room.");

      const selectedTenantOnRoomOnProperty =
        selectedRoomOnPropertyTenants[tenantId];

      if (!selectedTenantOnRoomOnProperty)
        throw new Error(
          "No tenant with the given tenantId has been added to this room."
        );

      res.status(200).json({ selectedTenantOnRoomOnProperty });
    } catch (err) {
      if (err?.message) res.status(400).json({ error: err.message });
    }
  },

  //! RENT DB ENDPOINTS DEALNG WITH THE MANAGEMENT OF RENT PAYMENTS WITH RESPECT TO THE CORRESPONDING PROPERTIES AND ROOMS

  //?  below is the expected requestBody from the user when submitting a create rent payment request
  //* {
  //*   "propertyNo": "NGONG/NGONG/12058",
  //*   "propertyId": "HDFBSUEHDUIFHW783YRWUHF84YF3",
  //*   "roomId": "PK3",
  //*   "tenantId": "43261521",
  //*   "payment": {
  //*     "amount": "2000",
  //*     "month": "SEPTEMBER",
  //*     "mode": "MPESA",
  //*     "receiptNumber": "SH23EQHJS",
  //*   }
  //* }

  createRentPaymentForRoomInPropertyByTenant: async (req, res) => {
    try {
      if (!req.body.id) throw new Error("Unknown user...");
      if (!req?.body.propertyId)
        throw new Error("provide a valid property ID.");
      if (!req?.body.roomId) throw new Error("provide a valid room ID.");
      if (!req?.body.tenantId) throw new Error("provide a valid tenant ID.");
      if (!req.body.newPayment) throw new Error("provide a valid amount.");

      const { id, propertyId, roomId, tenantId, newPayment } = req?.body;

      if (!isValid(id))
        throw new Error("ID provided is not a valid document Id.");

      const rentsDocument = await Rent.findOne({ ownerID: id });

      if (!rentsDocument) throw new Error(rentsDocument);

      const { rents } = rentsDocument;

      const checkIfPropertyIdIsRegistered = rents[0][propertyId];

      if (!checkIfPropertyIdIsRegistered)
        throw new Error(
          "Property with the given property Id has not been registered in the tenants database."
        );

      const propertyRents = checkIfPropertyIdIsRegistered?.rentPayments;

      if (!propertyRents)
        throw new Error("No rents have been added to this property.");

      const checkIfRoomIdIsRegisteredUnderSelectedProperty =
        propertyRents[roomId];

      if (!checkIfRoomIdIsRegisteredUnderSelectedProperty)
        throw new Error(
          "Room with the given ID has not been registered in the tenants database."
        );

      const checkIfTenantIsRegisteredUnderSelectedRoomInSelectedProperty =
        checkIfRoomIdIsRegisteredUnderSelectedProperty[tenantId];

      if (!checkIfTenantIsRegisteredUnderSelectedRoomInSelectedProperty)
        throw new Error(
          "Tenant with the given ID has not been registered in the tenants database."
        );

      const roomsDocument = await Room.findOne({ ownerID: id });

      if (!roomsDocument) throw new Error(roomsDocument);

      const { rooms } = roomsDocument;

      const checkIfPropertyIdIsRegisteredInRoomsDocument = rooms[0][propertyId];

      if (!checkIfPropertyIdIsRegisteredInRoomsDocument)
        throw new Error(
          "Property with the given property Id has not been registered in the rooms database."
        );

      if (
        !Object.keys(checkIfPropertyIdIsRegisteredInRoomsDocument?.rooms).length
      )
        throw new Error("No rooms have been added to this property.");

      if (!checkIfPropertyIdIsRegisteredInRoomsDocument?.rooms[roomId])
        throw new Error("No room with the room Id found.");

      const roomRate = Number(
        rooms[0][propertyId]?.rooms[roomId]?.roomRatePerMonth
      );

      const previousPaymentMonth =
        checkIfTenantIsRegisteredUnderSelectedRoomInSelectedProperty?.at(-1)
          ? checkIfTenantIsRegisteredUnderSelectedRoomInSelectedProperty?.at(-1)
              ?.month
          : null;

      const isNewMonth =
        newPayment.month === previousPaymentMonth ? 0 : roomRate;

      const unpaidRentBalanceFromLastPayment =
        checkIfTenantIsRegisteredUnderSelectedRoomInSelectedProperty?.at(-1)
          ? isNewMonth
            ? checkIfTenantIsRegisteredUnderSelectedRoomInSelectedProperty?.at(
                -1
              )?.newBalance + isNewMonth
            : checkIfTenantIsRegisteredUnderSelectedRoomInSelectedProperty?.at(
                -1
              )?.newBalance
          : roomRate;

      const newRentPaymentEntry = {
        paymentID: crypto.randomUUID().slice(-12),
        date: new Date().toLocaleDateString(),
        month: newPayment?.month,
        previousPaymentBalance: unpaidRentBalanceFromLastPayment,
        amountPaid: newPayment.amount,
        newBalance: unpaidRentBalanceFromLastPayment - newPayment.amount,
        modeOfPayment: newPayment.mode,
        recieptNumber:
          newPayment.mode.toLowerCase() === "cash"
            ? "cash"
            : newPayment.recieptNumber.toUpperCase(),
      };

      rents[0][propertyId].rentPayments[roomId][tenantId].push(
        newRentPaymentEntry
      );

      const updateRents = await Rent.updateOne(
        { ownerID: id },
        {
          $set: {
            rents,
          },
        }
      );

      if (!updateRents.acknowledged && !updateRents.modifiedCount)
        throw new Error("Error while updating database.");

      res.status(200).json({
        newTenantRoomRentPayments:
          rents[0][propertyId].rentPayments[roomId][tenantId],
        message: "New payment successfully added.",
      });
    } catch (err) {
      if (err?.message) res.status(400).json({ error: err.message });
    }
  },

  //?  below is the expected requestBody from the user when reading all rent payments for all rooms
  //* {
  //*   "propertyId": "HDFBSUEHDUIFHW783YRWUHF84YF3",
  //* }

  readAllRentPaymentsForAllRoomsInProperty: async (req, res) => {
    try {
      if (!req.body.id) throw new Error("Unauthorized action");
      if (!req.body.propertyId) throw new Error("provide a valid property ID.");

      const { id, propertyId } = req.body;

      if (!isValid(id))
        throw new Error("ID provided is not a valid document Id.");

      const roomsDocument = await Room.findOne({ ownerID: id });

      if (!roomsDocument) throw new Error(roomsDocument);

      const { rooms } = roomsDocument;

      const checkIfPropertyIdIsRegisteredInRooms = rooms[0][propertyId];

      if (!checkIfPropertyIdIsRegisteredInRooms)
        throw new Error(
          "Property with the given property Id has not been registered in the rooms database."
        );

      let propertyExpectedRevenueMonthly = 0;

      for (const roomId in checkIfPropertyIdIsRegisteredInRooms.rooms) {
        if (
          checkIfPropertyIdIsRegisteredInRooms.rooms[roomId].isOccupied &&
          checkIfPropertyIdIsRegisteredInRooms.rooms[roomId].currentTenantID
        ) {
          propertyExpectedRevenueMonthly +=
            +checkIfPropertyIdIsRegisteredInRooms.rooms[roomId]
              .roomRatePerMonth;
        }
      }

      const rentsDocument = await Rent.findOne({ ownerID: id });

      if (!rentsDocument) throw new Error(rentsDocument);

      const { rents } = rentsDocument;

      const checkIfPropertyIdIsRegistered = rents[0][propertyId];

      if (!checkIfPropertyIdIsRegistered)
        throw new Error(
          "Property with the given property Id has not been registered in the rents database."
        );

      const propertyRents = checkIfPropertyIdIsRegistered?.rentPayments;

      if (!propertyRents)
        throw new Error("No tenants have been added to this property.");

      if (!Object.keys(propertyRents))
        throw new Error("No payment reports for the property room.");

      res.status(200).json({
        message: "Revenue details fetched successfully",
        propertyRents,
        propertyExpectedRevenueMonthly,
      });
    } catch (err) {
      if (err?.message) res.status(400).json({ error: err.message });
    }
  },
  //?  below is the expected requestBody from the user when reading all rent payments for a room
  //* {
  //*   "propertyNo": "NGONG/NGONG/12058",
  //*   "propertyId": "HDFBSUEHDUIFHW783YRWUHF84YF3",
  //*   "roomId": "PK3",
  //* }

  readAllRentPaymentsForRoomInProperty: async (req, res) => {
    try {
      if (!req.body.id) throw new Error("Unknown user...");
      if (!req?.body.propertyId)
        throw new Error("provide a valid property ID.");
      if (!req?.body.propertyNo)
        throw new Error("provide a valid property NO.");
      if (!req?.body.roomId) throw new Error("provide a valid room ID.");

      const { id, propertyId, propertyNo, roomId } = req?.body;

      if (!isValid(id))
        throw new Error("ID provided is not a valid document Id.");

      const rentsDocument = await Rent.findOne({ ownerID: id });

      if (!rentsDocument) throw new Error(rentsDocument);

      const { rents } = rentsDocument;

      const checkIfPropertyIdIsRegistered = rents[0][propertyId];

      if (
        !checkIfPropertyIdIsRegistered ||
        (!checkIfPropertyIdIsRegistered &&
          checkIfPropertyIdIsRegistered?.propertyNumber !== propertyNo)
      ) {
        if (
          !checkIfPropertyIdIsRegistered &&
          checkIfPropertyIdIsRegistered?.propertyNumber !== propertyNo
        )
          throw new Error(
            "Property with the given property Id and  property number has not been registered in the tenants database."
          );

        if (!checkIfPropertyIdIsRegistered)
          throw new Error(
            "Property with the given property Id has not been registered in the tenants database."
          );
      }

      const propertyRents = checkIfPropertyIdIsRegistered?.rentPayments;

      if (!propertyRents)
        throw new Error("No tenants have been added to this property.");

      const checkIfRoomIdIsRegisteredUnderSelectedProperty =
        propertyRents[roomId];

      if (!checkIfRoomIdIsRegisteredUnderSelectedProperty)
        throw new Error(
          "Room with the given ID has not been registered in the tenants database."
        );

      if (!Object.keys(checkIfRoomIdIsRegisteredUnderSelectedProperty))
        throw new Error("No payment reports for the given room were found.");

      res.status(200).json({ checkIfRoomIdIsRegisteredUnderSelectedProperty });
    } catch (err) {
      if (err?.message) res.status(400).json({ error: err.message });
    }
  },

  //?  below is the expected requestBody from the user when reading all rent payments for a room by a tenant.
  //* {
  //*   "propertyNo": "NGONG/NGONG/12058",
  //*   "propertyId": "HDFBSUEHDUIFHW783YRWUHF84YF3",
  //*   "roomId": "PK3",
  //*   "tenantId": "43261521",
  //* }

  readAllRentPaymentsForRoomInPropertyByTenant: async (req, res) => {
    try {
      if (!req.body.id) throw new Error("Unknown user...");
      if (!req?.body.propertyId)
        throw new Error("provide a valid property ID.");
      if (!req?.body.roomId) throw new Error("provide a valid room ID.");
      if (!req?.body.tenantId) throw new Error("provide a valid tenant ID.");

      const { id, propertyId, roomId, tenantId } = req?.body;

      if (!isValid(id))
        throw new Error("ID provided is not a valid document Id.");

      const rentsDocument = await Rent.findOne({ ownerID: id });

      if (!rentsDocument) throw new Error(rentsDocument);

      const { rents } = rentsDocument;

      const checkIfPropertyIdIsRegistered = rents[0][propertyId];

      if (!checkIfPropertyIdIsRegistered)
        throw new Error(
          "Property with the given property Id has not been registered in the tenants database."
        );

      const propertyRents = checkIfPropertyIdIsRegistered?.rentPayments;

      if (!propertyRents)
        throw new Error("No tenants have been added to this property.");

      const checkIfRoomIdIsRegisteredUnderSelectedProperty =
        propertyRents[roomId];

      if (!checkIfRoomIdIsRegisteredUnderSelectedProperty)
        throw new Error(
          "Room with the given ID has not been registered in the tenants database."
        );

      const checkIfTenantIsRegisteredUnderSelectedRoomInSelectedProperty =
        checkIfRoomIdIsRegisteredUnderSelectedProperty[tenantId];

      if (
        checkIfTenantIsRegisteredUnderSelectedRoomInSelectedProperty ===
        (null || undefined)
      )
        throw new Error(
          "Tenant with the given ID has not been registered in the tenants database."
        );

      if (!checkIfTenantIsRegisteredUnderSelectedRoomInSelectedProperty.length)
        res.status(200).json({
          selectedTenantPayments: [],
          message: "No payment have been made by this tenant.",
        });
      else
        res.status(200).json({
          selectedTenantPayments:
            checkIfTenantIsRegisteredUnderSelectedRoomInSelectedProperty,
          message: "Rent payments retrieved successfully.",
        });
    } catch (err) {
      if (err?.message) res.status(400).json({ error: err.message });
    }
  },

  //?  below is the expected requestBody from the user when reading all rent payments for a room by a tenant.
  //* {
  //*   "propertyNo": "NGONG/NGONG/12058",
  //*   "propertyId": "HDFBSUEHDUIFHW783YRWUHF84YF3",
  //*   "roomId": "PK3",
  //*   "tenantId": "43261521",
  //*   "paymentId": "74e168a4a95y",
  //* }

  readRentPaymentForRoomInPropertyByTenant: async (req, res) => {
    try {
      if (!req.body.id) throw new Error("Unknown user...");
      if (!req?.body.propertyId)
        throw new Error("provide a valid property Id.");
      if (!req?.body.propertyNo)
        throw new Error("provide a valid property NO.");
      if (!req?.body.roomId) throw new Error("provide a valid room Id.");
      if (!req?.body.tenantId) throw new Error("provide a valid tenant Id.");
      if (!req.body.paymentId) throw new Error("provide a valid payment Id.");

      const { id, propertyId, propertyNo, roomId, tenantId, paymentId } =
        req?.body;

      if (!isValid(id))
        throw new Error("ID provided is not a valid document Id.");

      const rentsDocument = await Rent.findOne({ ownerID: id });

      if (!rentsDocument) throw new Error(rentsDocument);

      const { rents } = rentsDocument;

      const checkIfPropertyIdIsRegistered = rents[0][propertyId];

      if (
        !checkIfPropertyIdIsRegistered ||
        (!checkIfPropertyIdIsRegistered &&
          checkIfPropertyIdIsRegistered?.propertyNumber !== propertyNo)
      ) {
        if (
          !checkIfPropertyIdIsRegistered &&
          checkIfPropertyIdIsRegistered?.propertyNumber !== propertyNo
        )
          throw new Error(
            "Property with the given property Id and  property number has not been registered in the tenants database."
          );

        if (!checkIfPropertyIdIsRegistered)
          throw new Error(
            "Property with the given property Id has not been registered in the tenants database."
          );
      }

      const propertyRents = checkIfPropertyIdIsRegistered?.rentPayments;

      if (!propertyRents)
        throw new Error("No tenants have been added to this property.");

      const checkIfRoomIdIsRegisteredUnderSelectedProperty =
        propertyRents[roomId];

      if (!checkIfRoomIdIsRegisteredUnderSelectedProperty)
        throw new Error(
          "Room with the given ID has not been registered in the tenants database."
        );

      const checkIfTenantIsRegisteredUnderSelectedRoomInSelectedProperty =
        checkIfRoomIdIsRegisteredUnderSelectedProperty[tenantId];

      if (!checkIfTenantIsRegisteredUnderSelectedRoomInSelectedProperty)
        throw new Error(
          "Tenant with the given ID has not been registered in the tenants database."
        );

      const requestedPaymentReport =
        checkIfTenantIsRegisteredUnderSelectedRoomInSelectedProperty.find(
          (payment) => payment.paymentID === paymentId
        );

      if (!requestedPaymentReport)
        throw new Error(
          "The requested payment report with the given payment ID was not found."
        );

      res.status(200).json({ requestedPaymentReport });
    } catch (err) {
      if (err?.message) res.status(400).json({ error: err.message });
    }
  },

  //? Reset password tokens

  genarateResetPasswordToken: async (req, res) => {
    try {
      if (!req.body.id) throw new Error("Unknown user...");

      const { id } = req.body;

      const passwordDoc = await Password.findOne({ ownerID: id });

      const lastResetTime = passwordDoc.lastReset || null;

      const twentyFourHours = 24 * 60 * 60 * 1000;

      if (lastResetTime && Date.now() < lastResetTime + twentyFourHours)
        throw new Error(
          "Password can only be reset 24hrs after the last reset"
        );

      const resetPasswordToken = crypto.randomUUID().slice(-12);
      const resetPasswordTokenExpiry = Date.now() + 10 * 60 * 1000;

      const hashedresetPasswordToken = await hash(
        encrypt(resetPasswordToken),
        10
      );

      if (!hashedresetPasswordToken) throw new Error(hashedresetPasswordToken);

      const addResetTokenToDB = await Password.updateOne(
        { ownerID: id },
        {
          $set: {
            resetToken: hashedresetPasswordToken,
            resetTokenExpiry: resetPasswordTokenExpiry,
            resetTokenVerified: false,
          },
        },
        { new: true }
      );

      if (!addResetTokenToDB.acknowledged && !addResetTokenToDB.modifiedCount)
        throw new Error("Error adding reset token to database");

      res.status(200).json({
        message: "Password reset token sent to your email",
        resetPasswordToken,
      });
    } catch (err) {
      if (err?.message) res.status(400).json({ error: err.message });
    }
  },

  verifyResetPasswordToken: async (req, res) => {
    try {
      if (!req.body.id) throw new Error("Unknown user.");
      if (!req.headers.resettoken) throw new Error("Unauthorized action.");

      const { id } = req.body;

      const {
        headers: { resettoken },
      } = req;

      const passwordDoc = await Password.findOne({ ownerID: id });

      const resetPasswordToken = passwordDoc.resetToken || null;

      if (!resetPasswordToken)
        throw new Error("Invalid Token, generate a new one.");

      const resetPasswordTokenMatch = await compare(
        encrypt(resettoken),
        resetPasswordToken
      );

      if (!resetPasswordTokenMatch)
        throw new Error("Invalid Token, generate a new one.");

      const resetPasswordTokenExpiry = passwordDoc.resetTokenExpiry || null;

      if (!resetPasswordTokenExpiry)
        throw new Error("Invalid Token, generate a new one.");

      const isTokenValid = Date.now() < resetPasswordTokenExpiry ? true : false;

      if (!isTokenValid) {
        const removeInvalidToken = await Password.updateOne(
          { ownerID: id },
          {
            $set: {
              resetToken: null,
              resetTokenExpiry: null,
              resetTokenVerified: null,
            },
          }
        );

        if (
          !removeInvalidToken.acknowledged &&
          !removeInvalidToken.modifiedCount
        )
          throw new Error("Error removing invalid reset token.");

        throw new Error("Invalid Token, generate a new one.");
      }

      const verifyToken = await Password.updateOne(
        { ownerID: id },
        {
          $set: {
            resetTokenVerified: true,
          },
        }
      );

      if (!verifyToken.acknowledged && !verifyToken.modifiedCount)
        throw new Error("Error verifying reset token.");

      res.status(200).json({
        message: "Verification successful",
      });
    } catch (err) {
      if (err?.message) res.status(400).json({ error: err.message });
    }
  },

  //? Delete account tokens

  genarateDeleteAccountToken: async (req, res) => {
    try {
      if (!req.body.id) throw new Error("Unauthorized action");

      const { id } = req.body;

      const deleteAccountToken = crypto.randomUUID().slice(-12);

      const deleteAccountTokenExpiry = Date.now() + 10 * 60 * 1000;

      const hashedDeleteAccountToken = await hash(
        encrypt(deleteAccountToken),
        10
      );

      if (!hashedDeleteAccountToken) throw new Error(hashedDeleteAccountToken);

      const addDeleteAccountTokenToDB = await Otp.updateMany(
        { ownerID: id },
        {
          $set: {
            deleteAccountOtp: hashedDeleteAccountToken,
            deleteAccountOtpExpiry: deleteAccountTokenExpiry,
            isDeleteAccountOtpVerified: false,
          },
        },
        { new: true }
      );

      if (
        !addDeleteAccountTokenToDB.acknowledged &&
        !addDeleteAccountTokenToDB.modifiedCount
      )
        throw new Error("Error adding reset token to database");

      res.status(200).json({
        message: "Delete account token sent to your email",
        deleteAccountToken,
      });
    } catch (err) {
      if (err?.message) res.status(400).json({ error: err.message });
    }
  },

  verifyDeleteAccountToken: async (req, res) => {
    try {
      if (!req.body.id) throw new Error("Unauthorized action.");
      if (!req.headers.deletetoken) throw new Error("Unauthorized action.");

      const { id } = req.body;

      const {
        headers: { deletetoken },
      } = req;

      const otpDoc = await Otp.findOne({ ownerID: id });

      const deleteAccountToken = otpDoc.deleteAccountOtp || null;

      if (!deleteAccountToken)
        throw new Error("Invalid Token, generate a new one.");

      const deleteAccountTokenMatch = await compare(
        encrypt(deletetoken),
        deleteAccountToken
      );

      if (!deleteAccountTokenMatch)
        throw new Error("Invalid Token, generate a new one.");

      const deleteAccountTokenExpiry = otpDoc.deleteAccountOtpExpiry || null;

      if (!deleteAccountTokenExpiry)
        throw new Error("Invalid Token, generate a new one.");

      const isTokenValid = Date.now() < deleteAccountTokenExpiry ? true : false;

      if (!isTokenValid) {
        const removeInvalidToken = await Otp.updateMany(
          { ownerID: id },
          {
            $set: {
              deleteAccountOtp: null,
              deleteAccountOtpExpiry: null,
              isDeleteAccountOtpVerified: null,
            },
          }
        );

        if (
          !removeInvalidToken.acknowledged &&
          !removeInvalidToken.modifiedCount
        )
          throw new Error("Error removing invalid reset token.");

        throw new Error("Invalid Token, generate a new one.");
      }

      const verifyToken = await Otp.updateOne(
        { ownerID: id },
        {
          $set: {
            isDeleteAccountOtpVerified: true,
          },
        }
      );

      if (!verifyToken.acknowledged && !verifyToken.modifiedCount)
        throw new Error("Error verifying reset token.");

      res.status(200).json({
        message: "Verification successful",
      });
    } catch (err) {
      if (err?.message) res.status(400).json({ error: err.message });
    }
  },

  verifyPassword: async (req, res) => {
    try {
      if (!req.body.id) throw new Error("Unauthorized action.");

      const { id, password } = req.body;

      const passwordDoc = await Password.findOne({ ownerID: id });

      const userPassword = passwordDoc.password || null;

      if (!userPassword) throw new Error("Invalid password");

      const passwordMatch = await compare(encrypt(password), userPassword);

      if (!passwordMatch) throw new Error("Invalid password");

      res.status(200).json({
        message: "Password verification successful",
      });
    } catch (err) {
      if (err?.message) res.status(400).json({ error: err.message });
    }
  },

  //? Forgot password, utilises the reset tokens methods for otp issuing and verification
  verifyUserInfo: async (req, res) => {
    try {
      if (!req.body.email) throw new Error("Unauthorized action.");
      if (!req.body.nationalId) throw new Error("Unauthorized action.");

      const { email, nationalId } = req.body;

      const ownerDoc = await Owner.findOne({ email, nationalID: nationalId });

      const id = ownerDoc?._id || null;

      const nationalID = ownerDoc?.nationalID || null;

      if (!nationalID || !id) throw new Error("Invalid credentials");

      if (nationalID !== nationalId) throw new Error("Invalid credentials");

      const token = await signForgotPasswordToken({ id });

      res
        .status(200)
        .json({ message: "User info verification successful", token });
    } catch (err) {
      if (err?.message) res.status(400).json({ error: err.message });
    }
  },
};

module.exports = post_controllers;
