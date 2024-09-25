const { compare } = require("bcrypt");

const crypto = require("node:crypto");

const { signAccessToken } = require("../../../middleware/tokens/accessToken");

const {
  ObjectId: { isValid },
  MongoClient,
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
const { propertiesDB, RoomsDB, RentsDB, TenantsDB } = require("../database");

///////*************************POST CONTROLLERS************************////////////////

const post_controllers = {
  // SIGN UP NEW USER.

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

      const newOwnerPropertyBody = {
        ownerID: newOwner?._id?.toString(),
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
        ownerID: newOwner?._id?.toString(),
        tenants: [{}],
      };

      const newOwnerTenantCollection = await Tenant?.create(newOwnerTenantBody);

      if (!newOwnerTenantCollection)
        throw new Error(
          "Failed to create a new instance of the tenant document in the database."
        );

      const newOwnerRoomsBody = {
        ownerID: newOwner?._id?.toString(),
        rooms: [{}],
      };

      const newOwnerRoomsCollection = await Room?.create(newOwnerRoomsBody);

      if (!newOwnerRoomsCollection)
        throw new Error(
          "Failed to create a new instance of the room document in the database."
        );

      const newOwnerRentBody = {
        ownerID: newOwner?._id?.toString(),
        rents: [{}],
      };

      const newOwnerRentCollection = await Rent?.create(newOwnerRentBody);

      if (!newOwnerRentCollection)
        throw new Error(
          "Failed to create a new instance of the property document in the database."
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

  // LOGIN USER.

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

  // PROPERTY ENDPOINTS THE DEAL WITH THE CREATION AND READING OF PROPERTIES OWNED DATA FROM THE DATABASE.

  createNewProperty: async (req, res) => {
    try {
      const { id, newProperty } = req.body;

      //   if (!id)
      //     throw new Error("Unauthorized action, not a user or not logged in.");

      if (!newProperty) throw new Error("provide a valid property.");

      //   const ownerPropertiesDocument = await Property.findOne({ ownerID: id });
      const allPropertiesDB = [...propertiesDB.properties];

      //   if (!ownerPropertiesDocument[0]) throw new Error(ownerPropertiesDocument);

      //   const { propertiesOwned } = ownerPropertiesDocument;

      const checkIfPropertyIdIsRegistered =
        allPropertiesDB[0][newProperty.propertyID];

      if (
        checkIfPropertyIdIsRegistered ||
        (checkIfPropertyIdIsRegistered &&
          checkIfPropertyIdIsRegistered.propertyNumber ===
            newProperty.propertyNumber)
      ) {
        if (
          checkIfPropertyIdIsRegistered &&
          checkIfPropertyIdIsRegistered.propertyNumber ===
            newProperty.propertyNumber
        )
          throw new Error(
            "Property with the given property Id and  property number has already been registered."
          );

        if (checkIfPropertyIdIsRegistered)
          throw new Error(
            "Property with the given property Id has already been registered."
          );
      }

      //   const isNewPropertyIdAndNumberRegistered = false;
      //   const isNewPropertyIdRegistered = false;
      //   const isNewPropertyNumberRegistered = false;

      //   for (const key in allPropertiesDB) {
      //     console.log(key);

      //     if (
      //       key === newProperty.propertyID &&
      //       allPropertiesDB[key].propertyNumber === newProperty.propertyNumber
      //     )
      //       isNewPropertyIdAndNumberRegistered =
      //         !isNewPropertyIdAndNumberRegistered;

      //     if (key === newProperty.propertyID)
      //       isNewPropertyIdRegistered = !isNewPropertyIdRegistered;

      //     if (allPropertiesDB[key].propertyNumber === newProperty.propertyNumber)
      //       isNewPropertyNumberRegistered = !isNewPropertyNumberRegistered;
      //   }

      //   if (isNewPropertyIdAndNumberRegistered)
      //     throw new Error(
      //       "Property with the given property Id and Number has already been registered."
      //     );
      //   if (isNewPropertyNumberRegistered)
      //     throw new Error(
      //       "Property with the given property Number has already been registered."
      //     );

      const newPropertiesObject = {
        ...allPropertiesDB[0],
        [newProperty.propertyID]: newProperty,
      };

      const newProperties = [newPropertiesObject];

      //   const updateProperties = await Property.updateOne(
      //     { ownerID: id },
      //     { $set: { propertiesOwned: newProperties } }
      //   );

      //   if (!updateProperties) throw new Error("No entry found to update...");

      if (newProperties) res.status(200).json({ newProperties });
    } catch (err) {
      if (err?.message)
        res
          .status(500)
          .json({ error: err?.message, response_status: "danger" });
    }
  },

  readAllPropertiesOwned: async (req, res) => {
    try {
      const { id, propertyNumber } = req.body;

      //   if (!id)
      //     throw new Error("Unauthorized action, not a user or not logged in.");

      //   if (!propertyNumber) throw new Error("provide a valid property number.");

      //   const allProperties = await Property.findOne({ ownerID: id });
      const allProperties = [...propertiesDB.properties];

      //   if (Object.keys(allProperties[0])) throw new Error(allProperties);

      const propertiesOwned = allProperties[0];

      if (!propertiesOwned)
        throw new Error("No properties found/registered in the database.");

      if (propertiesOwned) res.status(200).json({ propertiesOwned });
    } catch (err) {
      if (err?.message)
        res
          .status(500)
          .json({ error: err?.message, response_status: "danger" });
    }
  },

  readSinglePropertyOwned: async (req, res) => {
    try {
      const { id, propertyNo, propertyId } = req.body;

      //   if (!id)
      //     throw new Error("Unauthorized action, not a user or not logged in.");

      if (!propertyNo) throw new Error("provide a valid property number.");

      //   const allProperties = await Property.findOne({ ownerID: id });
      const allProperties = [...propertiesDB.properties];

      if (!allProperties[0]) throw new Error(allProperties);

      const propertiesOwned = allProperties[0];

      const selectedProperty = propertiesOwned[propertyId];

      if (!selectedProperty)
        throw new Error(
          "Selected propertyId is not found/not registered in the database."
        );

      if (selectedProperty.propertyNumber !== propertyNo)
        throw new Error(
          "Selected propertyNumber is not found/not registered in the database."
        );

      if (selectedProperty) res.status(200).json({ selectedProperty });
    } catch (err) {
      if (err?.message)
        res
          .status(500)
          .json({ error: err?.message, response_status: "danger" });
    }
  },

  // ROOM ENDPOINTS THAT DEAL WITH THE ADDING AND READING OF THE ROOMS DATA IN THE DATABASE.

  createSingleRoomOnProperty: async (req, res) => {
    try {
      //   if (!req.body.id) throw new Error("Unknown user...");
      if (!req.body.propertyId) throw new Error("provide a valid property ID.");
      if (!req.body.propertyNo) throw new Error("provide a valid property NO.");

      const { id, propertyId, propertyNo, newRoom } = req.body;

      const allPropertiesAndRoomsDB = [...RoomsDB.propertiesRooms];

      if (!allPropertiesAndRoomsDB) throw new Error("no data found");

      const checkIfPropertyIdIsRegistered =
        allPropertiesAndRoomsDB[0][propertyId];

      if (
        !checkIfPropertyIdIsRegistered ||
        (!checkIfPropertyIdIsRegistered &&
          checkIfPropertyIdIsRegistered.propertyNumber !== propertyNo)
      ) {
        if (
          !checkIfPropertyIdIsRegistered &&
          checkIfPropertyIdIsRegistered.propertyNumber !== propertyNo
        )
          throw new Error(
            "Property with the given property Id and  property number has not been registered."
          );

        if (checkIfPropertyIdIsRegistered)
          throw new Error(
            "Property with the given property Id has not been registered."
          );
      }

      const propertyRooms = checkIfPropertyIdIsRegistered?.rooms;

      if (!propertyRooms)
        throw new Error("No rooms have been added to this property.");

      const checkIfRoomIdIsRegistered = propertyRooms[newRoom.roomID];

      if (
        checkIfRoomIdIsRegistered ||
        (checkIfRoomIdIsRegistered &&
          checkIfRoomIdIsRegistered.roomNumber == newRoom.roomNumber)
      ) {
        if (
          checkIfRoomIdIsRegistered &&
          checkIfRoomIdIsRegistered.roomNumber == newRoom.roomNumber
        )
          throw new Error(
            "Room with the given ID and number has already been registered."
          );

        if (checkIfRoomIdIsRegistered)
          throw new Error(
            "Room with the given ID has already been registered."
          );
      }

      const newPropertyRooms = {
        ...propertyRooms,
        [newRoom.roomID]: newRoom,
      };

      //   const updateProperties = await Room.updateOne(
      //     { ownerID: id },
      //     {
      //       $set: {
      //         propertiesRooms: [
      //           {
      //             ...allPropertiesAndRoomsDB[0],
      //             [propertyId]: {
      //               ...checkIfPropertyIdIsRegistered,
      //               rooms: newPropertyRooms,
      //             },
      //           },
      //         ],
      //       },
      //     }
      //   );

      //   if (!updateProperties) throw new Error("No entry found to update...");

      res.status(200).json({ newPropertyRooms });
    } catch (err) {
      if (err.message) res.status(400).json({ error: err.message });
    }
  },

  readAllRoomsOnProperty: async (req, res) => {
    try {
      //   if (!req.body.id) throw new Error("Unknown user...");
      if (!req.body.propertyId) throw new Error("provide a valid property ID.");
      if (!req.body.propertyNo) throw new Error("provide a valid property NO.");

      const { id, propertyId, propertyNo } = req.body;

      const allPropertiesAndRoomsDB = [...RoomsDB.propertiesRooms];

      if (!Object.keys(allPropertiesAndRoomsDB[0]))
        throw new Error("no data found");

      const allRooms = allPropertiesAndRoomsDB[0];

      const selectUsingPropertyID = allRooms[propertyId];

      if (!selectUsingPropertyID)
        throw new Error(
          "Selected propertyID Rooms are not found/not registered in the database."
        );
      if (selectUsingPropertyID.propertyNumber !== propertyNo)
        throw new Error(
          "Selected propertyNumber Rooms are not found/not registered in the database."
        );

      const propertyRooms = selectUsingPropertyID?.rooms;

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

      const { id, propertyId, propertyNo, roomId, roomNo } = req.body;

      const allPropertiesAndRoomsDB = [...RoomsDB.propertiesRooms];

      if (!Object.keys(allPropertiesAndRoomsDB[0]))
        throw new Error("no data found");

      const allRooms = allPropertiesAndRoomsDB[0];

      const selectPropertyUsingPropertyID = allRooms[propertyId];

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

  // TENANT ENDPOINTS FOR DEALING WITH THE TENANT DOCUMENT IN ADDING AND READING TENANT DATA FORM THE THE DATABASE.

  createTenantForRoomOnProperty: async (req, res) => {
    try {
      // if (!req.body.id) throw new Error("Unknown user...");
      if (!req.body.propertyId) throw new Error("provide a valid property ID.");
      if (!req.body.propertyNo) throw new Error("provide a valid property NO.");
      if (!req.body.roomId) throw new Error("provide a valid room ID.");
      if (!req.body.newTenant) throw new Error("provide a valid tenant.");

      const { id, propertyId, propertyNo, roomId, newTenant } = req?.body;

      const allPropertiesAndRoomsAndTenantsDB = [
        ...TenantsDB.propertiesTenants,
      ];

      if (!allPropertiesAndRoomsAndTenantsDB) throw new Error("no data found");

      const checkIfPropertyIdIsRegistered =
        allPropertiesAndRoomsAndTenantsDB[0][propertyId];

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

      const propertyTenants = checkIfPropertyIdIsRegistered?.tenants;

      if (!propertyTenants)
        throw new Error("No tenants have been added to this property.");

      const checkIfRoomIdIsRegistered = propertyTenants[roomId];

      if (!checkIfRoomIdIsRegistered)
        throw new Error(
          "Room with the given ID has not been registered in the tenants database."
        );

      const checkIfTenantIsRegistered =
        checkIfRoomIdIsRegistered[newTenant?.tenantID];

      if (checkIfTenantIsRegistered)
        throw new Error(
          "Tenant with the given ID has already been registered in the tenants database."
        );

      const newRoomTenants = {
        ...checkIfRoomIdIsRegistered,
        [newTenant?.tenantID]: newTenant,
      };

      res.status(200).json({ newRoomTenants });
    } catch (err) {
      if (err?.message) res.status(400).json({ error: err.message });
    }
  },

  readAllTenantsForAllRoomsOnProperty: async (req, res) => {
    try {
      // if (!req.body.id) throw new Error("Unknown user...");
      if (!req.body.propertyId) throw new Error("provide a valid property ID.");
      if (!req.body.propertyNo) throw new Error("provide a valid property NO.");
      if (!req.body.roomId) throw new Error("provide a valid room ID.");

      const { id, propertyId, propertyNo } = req?.body;

      const allPropertiesAndRoomsAndTenantsDB = [
        ...TenantsDB.propertiesTenants,
      ];

      if (!allPropertiesAndRoomsAndTenantsDB) throw new Error("no data found");

      const checkIfPropertyIdIsRegistered =
        allPropertiesAndRoomsAndTenantsDB[0][propertyId];

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

      res.status(200).json({ selectedPropertyTenants });
    } catch (err) {
      if (err?.message) res.status(400).json({ error: err.message });
    }
  },

  readAllTenantsInRoomOnProperty: async (req, res) => {
    try {
      // if (!req.body.id) throw new Error("Unknown user...");
      if (!req.body.propertyId) throw new Error("provide a valid property ID.");
      if (!req.body.propertyNo) throw new Error("provide a valid property NO.");
      if (!req.body.roomId) throw new Error("provide a valid room ID.");

      const { id, propertyId, propertyNo, roomId } = req?.body;

      const allPropertiesAndRoomsAndTenantsDB = [
        ...TenantsDB.propertiesTenants,
      ];

      if (!allPropertiesAndRoomsAndTenantsDB) throw new Error("no data found");

      const checkIfPropertyIdIsRegistered =
        allPropertiesAndRoomsAndTenantsDB[0][propertyId];

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

      res.status(200).json({ selectedRoomOnPropertyTenants });
    } catch (err) {
      if (err?.message) res.status(400).json({ error: err.message });
    }
  },

  readSingleTenantInRoomOnProperty: async (req, res) => {
    try {
      // if (!req.body.id) throw new Error("Unknown user...");
      if (!req.body.propertyId) throw new Error("provide a valid property ID.");
      if (!req.body.propertyNo) throw new Error("provide a valid property NO.");
      if (!req.body.roomId) throw new Error("provide a valid room ID.");
      if (!req.body.tenantId) throw new Error("provide a valid room ID.");

      const { id, propertyId, propertyNo, roomId, tenantId } = req?.body;

      const allPropertiesAndRoomsAndTenantsDB = [
        ...TenantsDB.propertiesTenants,
      ];

      if (!allPropertiesAndRoomsAndTenantsDB) throw new Error("no data found");

      const checkIfPropertyIdIsRegistered =
        allPropertiesAndRoomsAndTenantsDB[0][propertyId];

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

  // RENT DOCUMENT ENDPOINTS DEALNG WITH THE MANAGEMENT OF RENT PAYMENTS WITH RESPECT TO THE CORRESPONDING PROPERTY AND ROOMS

  //  below is the expected requestBody from the user
  // {
  //   "propertyNo": "NGONG/NGONG/12058",
  //   "propertyId": "HDFBSUEHDUIFHW783YRWUHF84YF3",
  //   "roomId": "PK3",
  //   "tenantId": "43261521",
  //   "payment": {
  //     "amountTenantIsPaying": "12345678",
  //     "month": "1",
  //     "mode": "6000",
  //   }
  // }

  createRentPaymentForRoomInPropertyByTenant: async (req, res) => {
    try {
      // if (!req.body.id) throw new Error("Unknown user...");
      if (!req.body.propertyId) throw new Error("provide a valid property ID.");
      if (!req.body.propertyNo) throw new Error("provide a valid property NO.");
      if (!req.body.roomId) throw new Error("provide a valid room ID.");
      if (!req.body.tenantId) throw new Error("provide a valid tenant ID.");
      if (!req.body.payment) throw new Error("provide a valid amount.");

      const { id, propertyId, propertyNo, roomId, tenantId, payment } =
        req?.body;

      const allPropertiesAndRoomsAndTenantsAndRentsDB = [
        ...RentsDB.propertiesRents,
      ];

      if (!allPropertiesAndRoomsAndTenantsAndRentsDB)
        throw new Error("no data found");

      const checkIfPropertyIdIsRegistered =
        allPropertiesAndRoomsAndTenantsAndRentsDB[0][propertyId];

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

      const checkIfRoomIdIsRegistered = propertyRents[roomId];

      if (!checkIfRoomIdIsRegistered)
        throw new Error(
          "Room with the given ID has not been registered in the tenants database."
        );

      const checkIfTenantIsRegistered = checkIfRoomIdIsRegistered[tenantId];

      if (!checkIfTenantIsRegistered)
        throw new Error(
          "Tenant with the given ID has not been registered in the tenants database."
        );

      const roomRate = 6000;

      const thisMonthRentBalance =
        payment.amountTenantIsPaying === roomRate
          ? 0
          : Number(roomRate) - Number(payment.amountTenantIsPaying);

      const unpaidRentBalanceFromLastMonth = checkIfTenantIsRegistered.at(-1)
        ? Number(checkIfTenantIsRegistered.at(-1).totalRentBalance)
        : 0;

      const newUnpaidRentBalance =
        unpaidRentBalanceFromLastMonth !== (null || undefined) &&
        thisMonthRentBalance !== (null || undefined)
          ? unpaidRentBalanceFromLastMonth + thisMonthRentBalance
          : 0;

      const newRentPaymentEntry = {
        paymentID: crypto.randomUUID(),
        date: new Date().toLocaleDateString(),
        monthDue: payment.month,
        monthlyPayment: roomRate,
        balanceFromLastMonth: unpaidRentBalanceFromLastMonth,
        totalAmountDue: unpaidRentBalanceFromLastMonth + roomRate,
        amountPaid: payment.amountTenantIsPaying,
        unpaidBalanceThisMonth: thisMonthRentBalance,
        totalRentBalance: newUnpaidRentBalance,
        modeOfPayment: payment.mode,
        recieptNumber: "SH45BXDE",
      };

      const newRoomTenants = [...checkIfTenantIsRegistered];

      res.status(200).json({ newRentPaymentEntry });
    } catch (err) {
      if (err?.message) res.status(400).json({ error: err.message });
    }
  },
  readAllRentPaymentForRoomInProperty: async (req, res) => {},
  readAllRentPaymentForRoomInPropertyByTenant: async (req, res) => {},
  readRentPaymentForRoomInPropertyByTenant: async (req, res) => {},
};

module.exports = post_controllers;
