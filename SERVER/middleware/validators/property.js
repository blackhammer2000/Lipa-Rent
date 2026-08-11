const Joi = require("joi");

const propertyValidator = async (req, res, next) => {
  try {
    const propertySchema = Joi.object({
      propertyName: Joi.string().required().uppercase(),
      propertyNumber: Joi.string().required().uppercase(),
      propertyLocation: Joi.string().required().uppercase(),
    });

    const isValidSignUpData = await propertySchema.validateAsync(
      req.body.newProperty
    );

    if (!isValidSignUpData) throw new Error(isValidSignUpData);

    next();
  } catch (err) {
    res.status(400).json({ error: err.message, response_status: "danger" });
  }
};

module.exports = { propertyValidator };
