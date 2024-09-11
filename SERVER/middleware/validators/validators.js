const { landlordValidator } = require("./landlord");
const { loginValidator } = require("./login");
const { propertyValidator } = require("./property");
const { tenantValidator } = require("./tenant");

module.exports = {
  landlordValidator,
  loginValidator,
  propertyValidator,
  tenantValidator,
};
