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
  deleteOwnerDetails,
  deletePropertyDetails,
  deleteRoomDetails,
  deleteTenantDetails,
  deleteRentPaymentDetails,
} = require("../controllers/deleteControllers");

router.delete(
  "/api/user/owner/delete",
  isUser,
  verifyUserAccessToken,
  deleteOwnerDetails
);
router.delete(
  "/api/user/owner/delete/property",
  isUser,
  verifyUserAccessToken,
  deletePropertyDetails
);
router.delete(
  "/api/user/owner/delete/property/room",
  isUser,
  verifyUserAccessToken,
  deleteRoomDetails
);
router.delete(
  "/api/user/owner/delete/property/room/tenant",
  isUser,
  verifyUserAccessToken,
  deleteTenantDetails
);
router.delete(
  "/api/user/owner/delete/property/room/tenant/payment",
  isUser,
  verifyUserAccessToken,
  deleteRentPaymentDetails
);

module.exports = router;
