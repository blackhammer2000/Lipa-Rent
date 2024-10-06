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

      if (!req.body.editedProperty)
        throw new Error("provide a valid property.");

      const { id, editedProperty } = req.body;

      if (!isValid(id))
        throw new Error("ID provided is not a valid document Id.");

      const ownerPropertiesDocument = await Property.findOne({ ownerID: id });

      if (!ownerPropertiesDocument) throw new Error(ownerPropertiesDocument);

      const { propertiesOwned } = ownerPropertiesDocument;
    } catch (err) {}
  },
  editPropertyDetails: async (req, res) => {},
  editRoomDetails: async (req, res) => {},
  editTenantDetails: async (req, res) => {},
  editRentDetails: async (req, res) => {},
};

module.exports = patchControllers;
