const {
  ObjectId: { isValid },
} = require("mongodb");

const { Owner } = require("../../../middleware/models/Owner");
const { Password } = require("../../../middleware/models/Password");
const { Property } = require("../../../middleware/models/Property");
const { Room } = require("../../../middleware/models/Room");
const { Tenant } = require("../../../middleware/models/Tenant");
const { Rent } = require("../../../middleware/models/Rent");

///////*************************PATCHCONTROLLERS************************////////////////
const patchControllers = {
  editOwnerDetails: async (req, res) => {
    try {
      if (!req.body.id)
        throw new Error("Unauthorized action, not a user or not logged in.");
      if (!req.body.propertyNo)
        throw new Error("Provide a valid property number.");
      if (!req.body.propertyId) throw new Error("provide a valid property Id.");
      if (!req.body.editedProperty)
        throw new Error("provide a valid property.");

      const { id, propertyNo, propertyId, editedProperty } = req.body;

      if (!isValid(id))
        throw new Error("ID provided is not a valid document Id.");

      const ownerPropertiesDocument = await Property.findOne({ ownerID: id });

      if (!ownerPropertiesDocument) throw new Error(ownerPropertiesDocument);

      const { propertiesOwned } = ownerPropertiesDocument;

      const checkIfPropertyIdIsRegistered = propertiesOwned[propertyId];

      if (!checkIfPropertyIdIsRegistered)
        throw new Error("Property with the given property ID was not found.");

      if (checkIfPropertyIdIsRegistered.propertyNumber !== propertyNo)
        throw new Error(
          "The property number given does not match the number of the property saved in the database with the given ID."
        );

      propertiesOwned[0][checkIfPropertyIdIsRegistered.propertyId] = {
        ...editedProperty,
        propertyID: checkIfPropertyIdIsRegistered.propertyId,
      };

      const updateEditedProperty = await Property.updateOne(
        { ownerID: id },
        { $set: { propertiesOwned } }
      );

      if (!updateEditedProperty.acknowledged)
        throw new Error("Error when updating the property in the database.");

      res.status(200).json({
        editedProperty: {
          ...editedProperty,
          propertyID: checkIfPropertyIdIsRegistered.propertyId,
        },
      });
    } catch (err) {
      if (err?.message)
        res
          .status(500)
          .json({ error: err?.message, response_status: "danger" });
    }
  },

  editPropertyDetails: async (req, res) => {},
  editRoomDetails: async (req, res) => {},
  editTenantDetails: async (req, res) => {},
  editRentDetails: async (req, res) => {},
};

module.exports = patchControllers;
