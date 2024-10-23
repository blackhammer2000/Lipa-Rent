const Joi = require("joi");

const roomValidator = async (req, res, next) => {
  try {
    const roomSchema = Joi.object({
      roomNumber: Joi.string().uppercase().required(),
      roomRatePerMonth: Joi.string().required(),
      roomType: Joi.string().required(),
      roomArea: Joi.string().required(),
    });

    const isValidRoomData = await roomSchema.validateAsync(req.body.newRoom);

    if (!isValidRoomData) throw new Error(isValidRoomData);

    next();
  } catch (err) {
    res.status(400).json({ error: err.message, response_status: "danger" });
  }
};

module.exports = { roomValidator };
