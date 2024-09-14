const { compare } = require("bcrypt");

const crypto = require("node:crypto");

const { signAccessToken } = require("../../../middleware/tokens/accessToken");

const {
  ObjectId: { isValid },
} = require("mongodb");

const { Owner } = require("../../../middleware/models/Owner");
const { Password } = require("../../../middleware/models/Password");
const { Subscription } = require("../../../middleware/models/Subscription");
const { Property } = require("../../../middleware/models/Property");
const { Room } = require("../../../middleware/models/Room");
const { Tenant } = require("../../../middleware/models/Tenant");
const { Rent } = require("../../../middleware/models/Rent");

const { checkSubscriptionExpiry } = require("../helpers/checkSubscription");
const { createModel } = require("../helpers/createModels");
const { encrypt } = require("../../helpers/cipher");

// const { searchForSelectedBooks } = require("../helpers/findBooks");
const propertiesDB = properties();

///////*************************POST CONTROLLERS************************////////////////

const post_controllers = {
  signUp: async (req, res) => {
    try {
      const { name, nationalID, email, phone, password, confirmPassword } =
        req.body;

      if (encrypt(password) !== encrypt(confirmPassword))
        throw new Error("passwords do not match.");

      const owner = {
        name,
        nationalID,
        email,
        phone,
        dateRegistered: new Date().toLocaleDateString(),
      };

      const accountExists = await Owner?.findOne({
        email: email,
        nationalID: nationalID,
      });

      if (accountExists)
        throw new Error(
          "an account with the given credentials already exists."
        );

      owner.disabled = false;
      owner.paid = true;

      const newOwner = await Owner?.create(owner);

      if (!newOwner)
        throw new Error(
          "Failed to create a new instance of the owner document."
        );

      const newOwnerPasswordDB = await Password?.create({
        ownerID: newOwner?._id?.toString(),
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
        ownerID: newOwner?._id?.toString(),
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

      //   const newOwnerPropertyBody = {
      //     ownerID: newOwner?._id?.toString(),
      //     propertiesOwned: [],
      //   };

      const newOwnerPropertyCollection = await createModel(
        Property,
        "propertiesOwned",
        {},
        newOwner?._id?.toString()
      );

      if (!newOwnerPropertyCollection)
        throw new Error(
          "Failed to create a new instance of the property document in the database."
        );

      const newOwnerTenantBody = {
        ownerID: newOwner?._id?.toString(),
        tenants: {},
      };

      const newOwnerTenantCollection = await Tenant?.create(newOwnerTenantBody);

      if (!newOwnerTenantCollection)
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

      const user = await Owner?.findOne({
        nationalID,
        email,
      });

      if (!user) throw new Error("Incorrect Email or Password.");

      const { _id, paid, disabled } = user;

      if (paid === false)
        throw new Error("Renew subscription to regain access.");

      if (disabled === true) throw new Error("Account has been disabled.");

      const dbPassword = await Password?.findOne({
        ownerID: _id,
      });

      if (!dbPassword) throw new Error("Incorrect Email or Password.");

      const passwordMatch = await compare(
        encryptedPassword,
        dbPassword?.password
      );

      if (!passwordMatch) throw new Error("Incorrect Email or Password.");

      const { currentSubscription } = await Subscription?.findOne({
        ownerID: _id,
      });

      if (!currentSubscription) throw new Error("Subscribe to proceed.");

      const isSubscriptionExpired =
        checkSubscriptionExpiry(currentSubscription);

      if (isSubscriptionExpired && isSubscriptionExpired.error) {
        const updatePaidStatus = await Owner.findOneAndUpdate(
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

      const allProperties = await Property.findOne({ ownerID: id });

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

  readCurrentStatusOfAllRoomsOnProperty: async (req, res) => {
    try {
      //   if (!req.body.id) throw new Error("Unknown user...");
      if (!req.body.propertyId) throw new Error("provide a valid property ID.");
      if (!req.body.propertyNo) throw new Error("provide a valid property NO.");

      const { id, propertyId, propertyNo } = req.body;

      const allPropertiesAndRoomsDB = [...propertiesDB];

      if (!allPropertiesAndRoomsDB) throw new Error("no data found");

      const selectedProperty = allPropertiesAndRoomsDB.find(
        (property) =>
          property.propertyNumber === propertyNo &&
          property.propertyID === propertyId
      );

      if (!selectedProperty)
        throw new Error(
          "Selected property is not found/not registered in the database."
        );

      const propertyRooms = selectedProperty?.rooms;

      if (!Object.keys(propertyRooms))
        throw new Error("No rooms have been added to this property.");

      res.status(200).json({ propertyRooms });
    } catch (err) {
      if (err.message) res.status(400).json({ error: err.message });
    }
  },

  readSingleRoomOnProperty: async (req, res) => {
    try {
      //   if (!req.body.id) throw new Error("Unknown user...");
      if (!req.body.propertyId) throw new Error("provide a valid property ID.");
      if (!req.body.propertyNo) throw new Error("provide a valid property NO.");
      if (!req.body.roomId) throw new Error("provide a valid property NO.");

      const { id, propertyId, propertyNo, roomId } = req.body;

      const allPropertiesAndRoomsDB = [...propertiesDB];

      if (!allPropertiesAndRoomsDB) throw new Error("no data found");

      const selectedProperty = allPropertiesAndRoomsDB.find(
        (property) =>
          property.propertyNumber === propertyNo &&
          property.propertyID === propertyId
      );

      if (!selectedProperty)
        throw new Error(
          "Selected property is not found/not registered in the database."
        );

      const { rooms } = selectedProperty;

      if (!Object.keys(rooms))
        throw new Error("No rooms have been added to this property.");

      const selectedRoomOnProperty = rooms[roomId];

      if (!selectedRoomOnProperty)
        throw new Error(
          "No room with the selected roomID was found on this property."
        );

      res.status(200).json({ selectedRoomOnProperty });
    } catch (err) {
      if (err.message) res.status(400).json({ error: err.message });
    }
  },

  readAllTenantsInRoomOnProperty: async (req, res) => {},
  readSingleTenantInRoomOnProperty: async (req, res) => {},
};

module.exports = post_controllers;

function properties() {
  const propertiesDB = [
    {
      propertyNumber: "NGONG/NGONG/12058",
      propertyID: "HDFBSUEHDUIFHW783YRWUHF84YF3",
      modeOfRentPayment: "BANK",
      rooms: {
        ["PK1"]: {
          roomNumber: "1",
          roomRatePerMonth: "6000",
          roomType: "SingleRoom",
          occupationStatus: true,
          tenants: [
            {
              tenantID: "35501094",
              tenantName: "LIXO PESSAR",
              moveInDate: "13/9/24",
              moveOutDate: null,
            },
          ],
          previousOccupant: {
            tenantID: "37725864",
            tenantName: "SIMON SHASAVA",
          },
          currentOccupant: {
            tenantID: "35501094",
            tenantName: "LIXO PESSAR",
          },

          roomRentReports: {
            ["37725864"]: [
              {
                paymentID: "HDUFGIS983HF38",
                date: "13/9/24",
                monthDue: "FEB",
                amountDue: "6000",
                unpaidBalance: "1200",
                totalAmountDue: "7200",
                amountPaid: "7000",
                modeOfPayment: "MPESA",
                recieptNumber: "SH45BXDE",
              },
              {
                paymentID: "UTIHUTTBGIRU8R",
                date: "13/9/24",
                monthDue: "MAR",
                amountDue: "6000",
                unpaidBalance: "200",
                totalAmountDue: "6200",
                amountPaid: "5000",
                modeOfPayment: "MPESA",
                recieptNumber: "SWQ34TRR",
              },
            ],
            ["35501094"]: [],
          },
        },
      },
    },

    {},
  ];

  return propertiesDB;
}
