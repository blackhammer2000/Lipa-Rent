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
  editPropertyDetails: async (req, res) => {},
};

module.exports = patchControllers;
