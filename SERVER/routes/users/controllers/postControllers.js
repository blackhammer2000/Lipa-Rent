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

const { propertiesDB, RoomsDB, RentsDB, TenantsDB } = require("../database");

///////*************************POST CONTROLLERS************************////////////////

const post_controllers = {
  //! SIGN UP NEW USER.

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

  //! LOGIN USER.

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

  //! PROPERTY ENDPOINTS THE DEAL WITH THE CREATION AND READING OF PROPERTIES OWNED DATA FROM THE DATABASE.

  //?  below is the expected requestBody from the user when creating a property.
  //* {
  //*   propertyNumber: "NGONG/NGONG/12058",
  //*   propertyTitleDetails: {
  //*     name: "PETER KARANJA",
  //*     nationalID: "37725864",
  //*     asWho: "SELF",
  //*   },
  //*   propertyLocation: "NGONG",
  //*   propertyValue: "12.3M",
  //*   propertyPurpose: {
  //*     purposedUse: "commercial",
  //*     purposeType: "lease",
  //*   },
  //*   isIdle: false,
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

      newProperty.propertyID = crypto.randomUUID();

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

      const newPropertiesObject = {
        ...propertiesOwned[0],
        [newProperty.propertyID]: newProperty,
      };

      const addNewProperty = await Property.updateOne(
        { ownerID: id },
        { $set: { propertiesOwned: [{ ...newPropertiesObject }] } },
        { new: true, upsert: true }
      );

      if (!addNewProperty) throw new Error("No entry found to update...");

      const roomsDocument = await Room.findOne({ ownerID: id });

      if (!roomsDocument) throw new Error(roomsDocument);

      const { rooms } = roomsDocument;

      if (rooms === (null || undefined))
        throw new Error("no data found for rooms");

      const updatePropertiesRooms = await Room.findOneAndUpdate(
        { ownerID: id },
        {
          $set: {
            rooms: [
              {
                ...rooms[0],
                [newProperty.propertyID]: {
                  propertyID: newProperty.propertyID,
                  propertyNumber: newProperty.propertyNumber,
                  rooms: {},
                },
              },
            ],
          },
        },

        { upsert: true, new: true }
      );

      if (!updatePropertiesRooms)
        throw new Error("Property rooms document failed to be created.");

      const tenantsDocument = await Tenant.findOne({ ownerID: id });

      if (!tenantsDocument) throw new Error(tenantsDocument);

      const { tenants } = tenantsDocument;

      if (tenants === (null || undefined))
        throw new Error("no data found for tenants");

      const updatePropertiesRoomsTenants = await Tenant.findOneAndUpdate(
        { ownerID: id },
        {
          $set: {
            tenants: [
              {
                ...tenants[0],
                [newProperty.propertyID]: {
                  propertyID: newProperty.propertyID,
                  propertyNumber: newProperty.propertyNumber,
                  tenants: {},
                },
              },
            ],
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

      const updatePropertiesRoomsTenantsRents = await Rent.findOneAndUpdate(
        { ownerID: id },
        {
          $set: {
            rents: [
              {
                ...rents[0],
                [newProperty.propertyID]: {
                  propertyID: newProperty.propertyID,
                  propertyNumber: newProperty.propertyNumber,
                  rentPayments: {},
                },
              },
            ],
          },
        },

        { upsert: true, new: true }
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
          newProperty,
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
  //*  ownerId: "HDFBSUEHDUIFHW783YRWUHF84YF3",
  //* }

  readAllPropertiesOwned: async (req, res) => {
    try {
      const { id, propertyNumber } = req.body;

      if (!id)
        throw new Error("Unauthorized action, not a user or not logged in.");

      const allProperties = await Property.findOne({ ownerID: id });

      if (!allProperties) throw new Error(allProperties);

      const { propertiesOwned } = allProperties;

      if (propertiesOwned === (null || undefined))
        throw new Error("No properties found/registered in the database.");

      if (propertiesOwned) res.status(200).json({ propertiesOwned });
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
  //* {
  //*   roomNumber: "PK1",
  //*   roomRatePerMonth: "6000",
  //*   roomType: "SingleRoom",}

  createSingleRoomOnProperty: async (req, res) => {
    try {
      if (!req.body.id) throw new Error("Unknown user...");
      if (!req.body.propertyId) throw new Error("provide a valid property Id.");
      if (!req.body.propertyNo) throw new Error("provide a valid property NO.");
      if (!req.body.newRoom) throw new Error("provide a valid room.");

      const { id, propertyId, propertyNo, newRoom } = req.body;

      if (!id)
        throw new Error("Unauthorized action, not a user or not logged in.");

      if (!isValid(id))
        throw new Error("ID provided is not a valid document Id.");

      if (!newRoom) throw new Error("provide a valid property.");

      const roomsDocument = await Room.findOne({ ownerID: id });

      if (!roomsDocument) throw new Error(roomsDocument);

      const { rooms } = roomsDocument;

      if (rooms === (null || undefined))
        throw new Error("rooms property not found in the  db document.");

      const checkIfPropertyIdIsRegistered = rooms[0][propertyId];

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

      newRoom.isOccupied = false;
      newRoom.roomID = crypto.randomUUID()?.slice(-8);

      const propertyRooms = checkIfPropertyIdIsRegistered?.rooms;

      if (propertyRooms === (null || undefined))
        throw new Error("No rooms have been added to this property.");

      let checkIfRoomNumberIsRegisteredUnderTheSelctedProperty = false;

      for (const key in propertyRooms) {
        if (propertyRooms[key]?.roomNumber === newRoom?.roomNumber) {
          checkIfRoomNumberIsRegisteredUnderTheSelctedProperty =
            !checkIfRoomNumberIsRegisteredUnderTheSelctedProperty;

          break;
        }
      }

      if (checkIfRoomNumberIsRegisteredUnderTheSelctedProperty)
        throw new Error(
          "Room with the given room number has already been registered."
        );

      const newPropertyRooms = {
        ...propertyRooms,
        [newRoom.roomID]: newRoom,
      };

      const updateProperties = await Room.updateOne(
        { ownerID: id },
        {
          $set: {
            rooms: [
              {
                ...rooms[0],
                [propertyId]: {
                  ...checkIfPropertyIdIsRegistered,
                  rooms: newPropertyRooms,
                },
              },
            ],
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
              message: `New room with the Number: ${newRoom.roomNumber} and ID: ${newRoom.roomID} has been successfuly added to the property.`,
              updateProperties,
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
  //*   propertyNumber: "NGONG/NGONG/12058",
  //*   propertyID: "HDFBSUEHDUIFHW783YRWUHF84YF3",
  //* }

  readAllRoomsOnProperty: async (req, res) => {
    try {
      if (!req.body.id) throw new Error("Unknown user...");
      if (!req.body.propertyId) throw new Error("provide a valid property ID.");
      if (!req.body.propertyNo) throw new Error("provide a valid property NO.");

      const { id, propertyNo, propertyId } = req.body;

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

  //?  below is the expected requestBody from the user when reading all rooms on property.
  //* {
  //*   propertyNo: "NGONG/NGONG/12058",
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
  //*  { tenantID: "35501094",
  //*   tenantName: "LIXO PESSAR",}

  createTenantForRoomOnProperty: async (req, res) => {
    try {
      if (!req.body.id) throw new Error("Unknown user...");
      if (!req.body.propertyId) throw new Error("provide a valid property ID.");
      if (!req.body.propertyNo) throw new Error("provide a valid property NO.");
      if (!req.body.roomId) throw new Error("provide a valid room ID.");
      if (!req.body.newTenant) throw new Error("provide a valid tenant.");

      const { id, propertyId, propertyNo, roomId, newTenant } = req?.body;

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

      newTenant.moveOutDate = null;
      newTenant.dateRegistered = Date.now();

      tenants[0][propertyId].tenants[roomId][newTenant.tenantID] = newTenant;

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

        rents[0][propertyId].rentPayments[roomId][newTenant.tenantID] = [];

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
            message: `New tenant with the Name: ${newTenant.tenantName} and ID: ${newTenant.tenantID} has been successfuly added to Room: ${roomId} on the property.`,
            updateTenants,
          });
      } else {
        throw new Error("Could not update the database.");
      }
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
      if (!req.body.propertyNo) throw new Error("provide a valid property NO.");

      const { id, propertyId, propertyNo } = req?.body;

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

      res.status(200).json({ selectedPropertyTenants });
    } catch (err) {
      if (err?.message) res.status(400).json({ error: err.message });
    }
  },

  //?  below is the expected requestBody from the user when reading all tenants for a room in property
  //*  {
  //*   propertyId: "HDFBSUEHDUIFHW783YRWUHF84YF3",
  //*   propertyNo: "NGONG/NGONG/12058",
  //*   roomId: "PK1",
  //*  }
  readAllTenantsInRoomOnProperty: async (req, res) => {
    try {
      if (!req.body.id) throw new Error("Unknown user...");
      if (!req.body.propertyId) throw new Error("provide a valid property ID.");
      if (!req.body.propertyNo) throw new Error("provide a valid property NO.");
      if (!req.body.roomId) throw new Error("provide a valid room ID.");

      const { id, propertyId, propertyNo, roomId } = req?.body;

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
        throw new Error(
          `No room with the roomID: ${roomId} been added to this property.`
        );

      res.status(200).json({ selectedRoomOnPropertyTenants });
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
  //*  "roomId": "PK3",
  //*   "tenantId": "43261521",
  //*   "payment": {
  //*     "amountTenantIsPaying": "2000",
  //*     "month": "SEP, 2024",
  //*     "mode": "6000",
  //*   }
  //* }

  createRentPaymentForRoomInPropertyByTenant: async (req, res) => {
    try {
      // if (!req.body.id) throw new Error("Unknown user...");
      if (!req?.body.propertyId)
        throw new Error("provide a valid property ID.");
      if (!req?.body.propertyNo)
        throw new Error("provide a valid property NO.");
      if (!req?.body.roomId) throw new Error("provide a valid room ID.");
      if (!req?.body.tenantId) throw new Error("provide a valid tenant ID.");
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

      const roomRate = 6000;

      const thisMonthRentBalance =
        payment.amountTenantIsPaying === roomRate
          ? 0
          : roomRate - Number(payment?.amountTenantIsPaying);

      const unpaidRentBalanceFromLastMonth =
        checkIfTenantIsRegisteredUnderSelectedRoomInSelectedProperty?.at(-1)
          ? checkIfTenantIsRegisteredUnderSelectedRoomInSelectedProperty?.at(-1)
              ?.totalRentBalance
          : 0;

      const newUnpaidRentBalance =
        unpaidRentBalanceFromLastMonth !== (null || undefined) &&
        thisMonthRentBalance !== (null || undefined)
          ? unpaidRentBalanceFromLastMonth + thisMonthRentBalance
          : 0;

      const newRentPaymentEntry = {
        paymentID: crypto.randomUUID(),
        date: new Date().toLocaleDateString(),
        monthDue: payment?.month,
        monthlyPayment: roomRate,
        balanceFromLastMonth: unpaidRentBalanceFromLastMonth,
        totalAmountDue: unpaidRentBalanceFromLastMonth + roomRate,
        amountPaid: payment.amountTenantIsPaying,
        unpaidBalanceThisMonth: thisMonthRentBalance,
        totalRentBalance: newUnpaidRentBalance,
        modeOfPayment: payment.mode,
        recieptNumber: "SH45BXDE",
      };

      const newRoomTenantRentPayments = [
        ...checkIfTenantIsRegisteredUnderSelectedRoomInSelectedProperty,
        newRentPaymentEntry,
      ];

      // const updateProperties = await Rent.updateOne(
      //   { ownerID: id },
      //   {
      //     $set: {
      //       propertiesRents: [
      //         {
      //           ...allPropertiesAndRoomsAndTenantsAndRentsDB[0],
      //           [propertyId]: {
      //             ...checkIfPropertyIdIsRegistered,
      //             rentPayments: {
      //               ...propertyRents,
      //               [roomId]: {
      //                 ...checkIfRoomIdIsRegisteredUnderSelectedProperty,
      //                 [tenantId]: newRoomTenantRentPayments,
      //               },
      //             },
      //           },
      //         },
      //       ],
      //     },
      //   }
      // );

      // if (!updateProperties) throw new Error("No entry found to update...");

      res.status(200).json({ newRoomTenantRentPayments });
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
      // if (!req.body.id) throw new Error("Unknown user...");
      if (!req?.body.propertyId)
        throw new Error("provide a valid property ID.");
      if (!req?.body.propertyNo)
        throw new Error("provide a valid property NO.");
      if (!req?.body.roomId) throw new Error("provide a valid room ID.");

      const { id, propertyId, propertyNo, roomId } = req?.body;

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
      // if (!req.body.id) throw new Error("Unknown user...");
      if (!req?.body.propertyId)
        throw new Error("provide a valid property ID.");
      if (!req?.body.propertyNo)
        throw new Error("provide a valid property NO.");
      if (!req?.body.roomId) throw new Error("provide a valid room ID.");
      if (!req?.body.tenantId) throw new Error("provide a valid tenant ID.");

      const { id, propertyId, propertyNo, roomId, tenantId } = req?.body;

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

      if (!checkIfTenantIsRegisteredUnderSelectedRoomInSelectedProperty.length)
        throw new Error(
          "The requested payment reports for the tenant ID were not found."
        );

      res
        .status(200)
        .json({ checkIfTenantIsRegisteredUnderSelectedRoomInSelectedProperty });
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
  //*   "paymentId": "ae1eb7d1-a490-4607-bd73-74e168a4a95y",
  //* }

  readRentPaymentForRoomInPropertyByTenant: async (req, res) => {
    try {
      // if (!req.body.id) throw new Error("Unknown user...");
      if (!req?.body.propertyId)
        throw new Error("provide a valid property Id.");
      if (!req?.body.propertyNo)
        throw new Error("provide a valid property NO.");
      if (!req?.body.roomId) throw new Error("provide a valid room Id.");
      if (!req?.body.tenantId) throw new Error("provide a valid tenant Id.");
      if (!req.body.paymentId) throw new Error("provide a valid payment Id.");

      const { id, propertyId, propertyNo, roomId, tenantId, paymentId } =
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

      if (!Object.keys(requestedPaymentReport))
        throw new Error(
          "The requested payment report with the given payment ID was not found."
        );

      res.status(200).json({ requestedPaymentReport });
    } catch (err) {
      if (err?.message) res.status(400).json({ error: err.message });
    }
  },
};

module.exports = post_controllers;
