const Joi = require("joi");

// Reusable password complexity schema:
// - Minimum 8 characters
// - At least one uppercase letter (A-Z)
// - At least one lowercase letter (a-z)
// - At least one digit (0-9)
// - At least one special character (!@#$%^&*(),.?":{}|<>)
const passwordSchema = Joi.string()
  .min(8)
  .max(128)
  .pattern(
    new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*(),.?\":{}|<>])"),
    {
      name: "password complexity",
    }
  )
  .required()
  .messages({
    "string.pattern.name":
      "Password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number, and one special character.",
    "string.min": "Password must be at least 8 characters long.",
    "string.max": "Password must not exceed 128 characters.",
    "any.required": "Password is required.",
  });

const passwordValidator = async (req, res, next) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        error: "Password is required.",
        response_status: "danger",
      });
    }

    await passwordSchema.validateAsync(password);
    next();
  } catch (err) {
    res.status(400).json({
      error: err.message,
      response_status: "danger",
    });
  }
};

module.exports = { passwordValidator, passwordSchema };