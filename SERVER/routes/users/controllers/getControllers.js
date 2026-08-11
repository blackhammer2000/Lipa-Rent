const { Property } = require("../../../middleware/models/Property");
const { Owner } = require("../../../middleware/models/Owner");
const { Subscription } = require("../../../middleware/models/Subscription");

// const { verifyAccessToken } = require("../../../middleware/tokens/accessToken");

const getControllers = {
  readAllPropertiesOwned: async (req, res) => {
    try {
      if (!req.body.id) throw new Error("Unauthorized action.");

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

  readSubscriptionsReports: async (req, res) => {
    try {
      if (!req.body.id) throw new Error("Unauthorized action.");

      const { id } = req.body;

      if (!id)
        throw new Error("Unauthorized action, not a user or not logged in.");

      const subscriptionDocument = await Subscription.findOne({
        ownerID: id,
      });

      if (!subscriptionDocument) throw new Error(subscriptionDocument);

      const { subscription_reports } = subscriptionDocument;

      res.status(200).json({
        message: "Subscriptions retrieved successfully",
        subscriptions: subscription_reports,
      });
    } catch (err) {
      if (err.message) res.status(400).json({ error: err.message });
    }
  },
};

module.exports = getControllers;
