const router = require("express").Router();

const {
  verifyUserAccessToken,
} = require("../../../middleware/tokens/verifyAccessToken");

// const {
//   landlordValidator,
//   loginValidator,
//   propertyValidator,
//   tenantValidator,
// } = require("../../../middleware/validators/validators");

const { isUser } = require("../helpers/isUser");
// const { hasPaid } = require("../helpers/hasPaid");

const {
  readAllPropertiesOwned,
  readOwnerDetails,
} = require("../controllers/getControllers");

router.get(
  "/api/user/landlord/read/allproperties",
  isUser,
  verifyUserAccessToken,
  readAllPropertiesOwned
);

module.exports = router;
