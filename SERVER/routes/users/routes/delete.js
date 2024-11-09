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
  //   deleteOwnerDetails,
  deletePropertyDetails,
  deleteRoomDetails,
  deleteTenantDetails,
  deleteRentPaymentDetails,
} = require("../controllers/deleteControllers");

// router.patch(
//   "/api/user/owner/edit/owner",
//   isUser,
//   verifyAccessToken,
//   deleteOwnerDetails
// );
router.delete(
  "/api/user/owner/delete/property",
  isUser,
  verifyAccessToken,
  deletePropertyDetails
);
router.delete(
  "/api/user/owner/delete/property/room",
  isUser,
  verifyAccessToken,
  deleteRoomDetails
);
router.delete(
  "/api/user/owner/delete/property/room/tenant",
  isUser,
  verifyAccessToken,
  deleteTenantDetails
);
router.delete(
  "/api/user/owner/delete/property/room/tenant/payment",
  isUser,
  verifyAccessToken,
  deleteRentPaymentDetails
);

module.exports = router;
