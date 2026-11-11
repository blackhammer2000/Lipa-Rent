const Joi = require("joi");

const { passwordSchema } = require("./password");

const landlordValidator = async (req, res, next) => {
  try {
    const landlordSchema = Joi.object({
      name: Joi.string().required().uppercase(),
      nationalID: Joi.string().required(),
      email: Joi.string().email().required().lowercase(),
      phone: Joi.string().min(12).required(),
      password: passwordSchema,
      confirmPassword: Joi.string().valid(Joi.ref("password")).required().messages({
        "any.only": "Confirm password does not match password.",
      }),
    });

    const isValidSignUpData = await landlordSchema.validateAsync(req.body);

    if (!isValidSignUpData) throw new Error(isValidSignUpData);
    next();
  } catch (err) {
    res.status(400).json({ error: err.message, response_status: "danger" });
  }
};

module.exports = { landlordValidator };
