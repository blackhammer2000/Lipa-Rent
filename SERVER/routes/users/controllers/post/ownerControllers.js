const { Owner } = require("../../../../middleware/models/Owner");

const ownerControllers = {
  //! READING OWNER DETAILS
  readOwnerDetails: async (req, res) => {
    try {
      if (!req.body.id) throw new Error("Unauthorized action.");

      const { id } = req.body;

      const owner = await Owner.findOne({ _id: id });

      if (!owner) throw new Error("Owner details not found.");

      res.status(200).json({
        owner: {
          name: owner.name,
          nationalID: owner.nationalID,
          email: owner.email,
          phone: owner.phone,
        },
      });
    } catch (err) {
      if (err.message) res.status(400).json({ error: err.message });
    }
  },
};

module.exports = ownerControllers;
