const { landlordValidator } = require("./landlord");
const { loginValidator } = require("./login");
const { propertyValidator } = require("./property");
const { tenantValidator } = require("./tenant");
const { roomValidator } = require("./room");
const { passwordValidator } = require("./password");

module.exports = {
  landlordValidator,
  loginValidator,
  propertyValidator,
  tenantValidator,
  roomValidator,
  passwordValidator,
};
