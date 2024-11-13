const router = require("express").Router();

const {
  verifyAccessToken,
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
  verifyAccessToken,
  readAllPropertiesOwned
);

router.get("/api/user/read/owner", isUser, verifyAccessToken, readOwnerDetails);

module.exports = router;
