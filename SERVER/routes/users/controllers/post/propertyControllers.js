const {
  ObjectId: { isValid },
} = require("mongodb");

const { Property } = require("../../../../middleware/models/Property");
const { Tenant } = require("../../../../middleware/models/Tenant");
const { Room } = require("../../../../middleware/models/Room");
const { Rent } = require("../../../../middleware/models/Rent");

const { generateOTP } = require("../../helpers/generateOtp");

const propertyControllers = {
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

      newProperty.propertyID = generateOTP();

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
          "Property with the given property number has already been registered.",
        );

      propertiesOwned[0][newProperty.propertyID] = newProperty;

      const addNewProperty = await Property.updateOne(
        { ownerID: id },
        { $set: { propertiesOwned } },
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
        },
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

        { upsert: true, new: true },
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
        expectedMonthlyRevenues: { [new Date().getFullYear()]: [] },
      };

      const updatePropertiesRoomsTenantsRents = await Rent.findOneAndUpdate(
        { ownerID: id },
        {
          $set: {
            rents,
          },
        },
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
  // ....
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
          "Selected propertyId is not found/not registered in the database.",
        );

      if (selectedProperty.propertyNumber !== propertyNo)
        throw new Error(
          "Selected propertyNumber does not match the property ID selected.",
        );

      if (selectedProperty) res.status(200).json({ selectedProperty });
    } catch (err) {
      if (err?.message)
        res
          .status(500)
          .json({ error: err?.message, response_status: "danger" });
    }
  },
};

module.exports = propertyControllers;
