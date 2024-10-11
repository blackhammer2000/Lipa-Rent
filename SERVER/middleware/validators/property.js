const Joi = require("joi");

const propertyValidator = async (req, res, next) => {
  try {
    const propertySchema = Joi.object({
      propertyNumber: Joi.string().required().uppercase(),
      propertyTitleDetails: {
        name: Joi.string().required(),
        nationalID: Joi.string().required(),
        asWho: Joi.string().required(),
      },
      propertyLocation: Joi.string().required().uppercase(),
      propertyValue: Joi.string().required(),
      propertyPurpose: {
        purposedUse: Joi.string().required(),
        purposeType: Joi.string().required(),
      },
      isIdle: Joi.boolean().required(),
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
