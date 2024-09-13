const { Property } = require("../../../middleware/models/Property");

// const { verifyAccessToken } = require("../../../middleware/tokens/accessToken");

const getControllers = {
  readAllPropertiesOwned: async (req, res) => {
    try {
      const { id } = req.body;

      if (!id)
        throw new Error("Unauthorized action, not a user or not logged in.");

      const allProperties = await Property.findOne({ landlordID: id });

      if (!allProperties) throw new Error(allProperties);

      const { propertiesOwned } = allProperties;

      res.status(200).json({ propertiesOwned });
    } catch (err) {
      if (err.message) res.status(400).json({ error: err.message });
    }
  },
};

module.exports = getControllers;
