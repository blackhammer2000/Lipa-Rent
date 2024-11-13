const { Property } = require("../../../middleware/models/Property");
const { Owner } = require("../../../middleware/models/Property");

// const { verifyAccessToken } = require("../../../middleware/tokens/accessToken");

const getControllers = {
  readAllPropertiesOwned: async (req, res) => {
    try {
      const { id } = req.body;

      if (!id)
        throw new Error("Unauthorized action, not a user or not logged in.");

      const ownerPropertiesDocument = await Property.findOne({
        ownerID: id,
      });

      if (!ownerPropertiesDocument) throw new Error(ownerPropertiesDocument);

      const { propertiesOwned } = ownerPropertiesDocument;

      res.status(200).json({ propertiesOwned });
    } catch (err) {
      if (err.message) res.status(400).json({ error: err.message });
    }
  },

  readOwnerDetails: async (req, res) => {
    try {
      if (!req.body.id) throw new Error("Unauthorized action.");

      const { id } = req.body;

      const owner = await Owner.findOne({ id: id });

      if (!owner) throw new Error("Owner details not found.");

      res.status(200).json({
        owner: owner.name,
      });
    } catch (err) {
      if (err.message) res.status(400).json({ error: err.message });
    }
  },
};

module.exports = getControllers;
