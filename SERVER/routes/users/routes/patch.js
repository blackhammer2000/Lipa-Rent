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
  verifyForgotPasswordToken,
} = require("../../../middleware/tokens/verifyForgotPasswordToken");

const {
  editOwnerDetails,
  editPropertyDetails,
  editRoomDetails,
  editTenantDetails,
  editPassword,
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

router.patch(
  "/api/user/owner/edit/password",
  isUser,
  verifyUserAccessToken,
  editPassword
);

router.patch(
  "/api/user/owner/edit/forgotPassword",
  isUser,
  verifyForgotPasswordToken,
  editPassword
);

module.exports = router;
