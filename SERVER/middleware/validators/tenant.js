const Joi = require("joi");

const tenantValidator = async (req, res, next) => {
  try {
    const tenantSchema = Joi.object({
      tenantNationalID: Joi.string().required(),
      tenantName: Joi.string().required(),
    });

    const isValidTenantData = await tenantSchema.validateAsync(
      req.body.newTenant
    );

    if (!isValidTenantData) throw new Error(isValidTenantData);

    next();
  } catch (err) {
    res.status(400).json({ error: err.message, response_status: "danger" });
  }
};

module.exports = { tenantValidator };
