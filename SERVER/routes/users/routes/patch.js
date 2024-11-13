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
  editOwnerDetails,
  editPropertyDetails,
  editRoomDetails,
  editTenantDetails,
  // editRentDetails,
} = require("../controllers/patchControllers");

router.patch(
  "/api/user/owner/edit/owner",
  isUser,
  verifyUserAccessToken,
  editOwnerDetails
);
router.patch(
  "/api/user/owner/edit/property",
  isUser,
  verifyUserAccessToken,
  editPropertyDetails
);
router.patch(
  "/api/user/owner/edit/property/room",
  isUser,
  verifyUserAccessToken,
  editRoomDetails
);
router.patch(
  "/api/user/owner/edit/property/room/tenant",
  isUser,
  verifyUserAccessToken,
  editTenantDetails
);
// router.patch(
//   "/api/user/owner/edit/property/room/tenant/rent/payment",
//   isUser,
//   verifyAccessToken,
//   editRentDetails
// );

module.exports = router;
