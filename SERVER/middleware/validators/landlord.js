const Joi = require("joi");

const landlordValidator = async (req, res, next) => {
  try {
    const landlordSchema = Joi.object({
      name: Joi.string().required().uppercase(),
      nationalID: Joi.string().required(),
      email: Joi.string().email().required().lowercase(),
      phone: Joi.string().min(12).required(),
      password: Joi.string().required().min(8).max(100),
      confirmPassword: Joi.string().required().min(8).max(100),
    });

    const isValidSignUpData = await landlordSchema.validateAsync(req.body);

    if (!isValidSignUpData) throw new Error(isValidSignUpData);
    next();
  } catch (err) {
    res.status(400).json({ error: err.message, response_status: "danger" });
  }
};

module.exports = { landlordValidator };
