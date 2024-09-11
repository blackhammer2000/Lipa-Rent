const Joi = require("joi");

const institutionValidator = async (req, res, next) => {
  try {
    const institutionSchema = Joi.object({
      name: Joi.string().required().uppercase(),
      nationalID: Joi.string().required(),
      email: Joi.string().email().required().lowercase(),
      phone: Joi.string().min(12).required(),
      password: Joi.string().required().min(6),
      confirm_password: Joi.string().required().min(6),
    });

    const isValidSignUpData = await institutionSchema.validateAsync(req.body);

    if (!isValidSignUpData) throw new Error(isValidSignUpData);
    next();
  } catch (err) {
    res.status(400).json({ error: err.message, response_status: "danger" });
  }
};

module.exports = { institutionValidator };
