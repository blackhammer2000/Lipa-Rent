const Joi = require("joi");

const loginValidator = async (req, res, next) => {
  try {
    const loginSchema = Joi.object({
      email: Joi.string().email().lowercase().required(),
      nationalID: Joi.string().lowercase().required(),
      password: Joi.string().min(6).required(),
    });

    const isValidLoginData = await loginSchema.validateAsync(req.body);

    if (!isValidLoginData) throw new Error(isValidLoginData);

    next();
  } catch (err) {
    res.status(400).json({ error: err.message, response_status: "danger" });
  }
};

module.exports = { loginValidator };
