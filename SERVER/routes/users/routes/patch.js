const router = require("express").Router();

const {
  verifyAccessToken,
} = require("../../../middleware/tokens/verifyAccessToken");

const {
  landlordValidator,
  loginValidator,
  propertyValidator,
  tenantValidator,
} = require("../../../middleware/validators/validators");

const { isUser } = require("../helpers/isUser");
// const { hasPaid } = require("../helpers/hasPaid");

const {
  editOwnerDetails,
  editPropertyDetails,
} = require("../controllers/patchControllers");

router.patch(
  "/api/user/owner/edit/owner",
  isUser,
  verifyAccessToken,
  editOwnerDetails
);
router.patch(
  "/api/user/owner/edit/property",
  isUser,
  verifyAccessToken,
  editPropertyDetails
);

module.exports = router;
