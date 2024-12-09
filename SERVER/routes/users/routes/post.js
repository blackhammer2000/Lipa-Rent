const router = require("express").Router();

const {
  verifyUserAccessToken,
} = require("../../../middleware/tokens/verifyAccessToken");

const {
  landlordValidator,
  loginValidator,
  propertyValidator,
  tenantValidator,
  roomValidator,
} = require("../../../middleware/validators/validators");

const { isUser } = require("../helpers/isUser");
// const { hasPaid } = require("../helpers/hasPaid");

const {
  signUp,

  login,
  generateLoginOtp,
  verifyLoginOtp,

  readOwnerDetails,

  createNewProperty,
  readSinglePropertyOwned,
  readAllPropertiesOwned,

  createSingleRoomOnProperty,
  readAllRoomsOnProperty,
  readSingleRoomOnProperty,

  createTenantForRoomOnProperty,
  readAllTenantsForAllRoomsOnProperty,
  readAllTenantsInRoomOnProperty,
  readSingleTenantInRoomOnProperty,

  createRentPaymentForRoomInPropertyByTenant,
  readAllRentPaymentsForRoomInProperty,
  readAllRentPaymentsForRoomInPropertyByTenant,
  readRentPaymentForRoomInPropertyByTenant,

  verifyResetPasswordToken,
  genarateResetPasswordToken,
} = require("../controllers/postControllers");
const {
  verifyLoginToken,
} = require("../../../middleware/tokens/verifyLoginAccessToken");

// SIGN UP
router.post("/api/user/owner/signup", isUser, landlordValidator, signUp);

// LOGIN
router.post("/api/user/owner/login", isUser, loginValidator, login);
router.post(
  "/api/user/owner/generateLoginOtp",
  isUser,
  verifyLoginToken,
  generateLoginOtp
);
router.post(
  "/api/user/owner/verifyLoginOtp",
  isUser,
  verifyLoginToken,
  verifyLoginOtp
);

// OWNERS DB ROUTES
router.post(
  "/api/user/read/owner",
  isUser,
  verifyUserAccessToken,
  readOwnerDetails
);

// PROPERTIES DB ROUTES
router.post(
  "/api/user/owner/create/property",
  isUser,
  verifyUserAccessToken,
  propertyValidator,
  createNewProperty
);
router.post(
  "/api/user/owner/read/property",
  isUser,
  verifyUserAccessToken,
  readSinglePropertyOwned
);
router.post(
  "/api/user/owner/read/properties",
  isUser,
  verifyUserAccessToken,
  readAllPropertiesOwned
);

// ROOM DB ROUTES
router.post(
  "/api/user/owner/create/property/room",
  isUser,
  verifyUserAccessToken,
  roomValidator,
  createSingleRoomOnProperty
);
router.post(
  "/api/user/owner/read/property/rooms",
  isUser,
  verifyUserAccessToken,
  readAllRoomsOnProperty
);
router.post(
  "/api/user/owner/read/property/room",
  isUser,
  verifyUserAccessToken,
  readSingleRoomOnProperty
);

// TENANTS DB ROUTES
router.post(
  "/api/user/owner/create/property/room/tenant",
  isUser,
  verifyUserAccessToken,
  tenantValidator,
  createTenantForRoomOnProperty
);
router.post(
  "/api/user/owner/read/property/rooms/tenants",
  isUser,
  verifyUserAccessToken,
  readAllTenantsForAllRoomsOnProperty
);
router.post(
  "/api/user/owner/read/property/room/tenants",
  isUser,
  verifyUserAccessToken,
  readAllTenantsInRoomOnProperty
);
router.post(
  "/api/user/owner/read/property/room/tenant",
  isUser,
  verifyUserAccessToken,
  readSingleTenantInRoomOnProperty
);

// RENTS DB ROUTES
router.post(
  "/api/user/owner/create/property/room/tenant/payment",
  isUser,
  verifyUserAccessToken,
  createRentPaymentForRoomInPropertyByTenant
);
router.post(
  "/api/user/owner/read/property/room/tenants/payments",
  isUser,
  verifyUserAccessToken,
  readAllRentPaymentsForRoomInProperty
);
router.post(
  "/api/user/owner/read/property/room/tenant/payments",
  isUser,
  verifyUserAccessToken,
  readAllRentPaymentsForRoomInPropertyByTenant
);
router.post(
  "/api/user/owner/read/property/room/tenant/payment",
  isUser,
  verifyUserAccessToken,
  readRentPaymentForRoomInPropertyByTenant
);

// PASSWORD RESET ROUTES
router.post(
  "/api/user/owner/verify/resetToken",
  isUser,
  verifyUserAccessToken,
  verifyResetPasswordToken
);
router.post(
  "/api/user/owner/generate/resetToken",
  isUser,
  verifyUserAccessToken,
  genarateResetPasswordToken
);

module.exports = router;
