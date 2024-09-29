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
  signUp,
  login,

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
} = require("../controllers/postControllers");

// USER SIGN UP AND LOGIN

router.post("/api/user/owner/signup", isUser, landlordValidator, signUp);
router.post("/api/user/owner/login", isUser, loginValidator, login);

// PROPERTIES DB ROUTES
router.post(
  "/api/user/owner/create/property",
  isUser,
  verifyAccessToken,
  createNewProperty
);
router.post(
  "/api/user/owner/read/property",
  isUser,
  verifyAccessToken,
  readSinglePropertyOwned
);
router.post(
  "/api/user/owner/read/properties",
  isUser,
  verifyAccessToken,
  readAllPropertiesOwned
);

// ROOM DB ROUTES
router.post(
  "/api/user/owner/create/property/room",
  isUser,
  verifyAccessToken,
  createSingleRoomOnProperty
);
router.post(
  "/api/user/owner/read/property/rooms",
  isUser,
  verifyAccessToken,
  readAllRoomsOnProperty
);
router.post(
  "/api/user/owner/read/property/room",
  isUser,
  verifyAccessToken,
  readSingleRoomOnProperty
);

// TENANTS DB ROUTES
router.post(
  "/api/user/owner/create/property/room/tenant",
  isUser,
  verifyAccessToken,
  createTenantForRoomOnProperty
);
router.post(
  "/api/user/owner/read/property/rooms/tenants",
  isUser,
  verifyAccessToken,
  readAllTenantsForAllRoomsOnProperty
);
router.post(
  "/api/user/owner/read/property/room/tenants",
  isUser,
  verifyAccessToken,
  readAllTenantsInRoomOnProperty
);
router.post(
  "/api/user/owner/read/property/room/tenant",
  isUser,
  verifyAccessToken,
  readSingleTenantInRoomOnProperty
);

// RENTS DB ROUTES
router.post(
  "/api/user/owner/create/property/room/tenant/rent/payment",
  isUser,
  verifyAccessToken,
  createRentPaymentForRoomInPropertyByTenant
);
router.post(
  "/api/user/owner/read/property/room/tenants/rents/payments",
  isUser,
  verifyAccessToken,
  readAllRentPaymentsForRoomInProperty
);
router.post(
  "/api/user/owner/read/property/room/tenant/rents/payments",
  isUser,
  verifyAccessToken,
  readAllRentPaymentsForRoomInPropertyByTenant
);
router.post(
  "/api/user/owner/read/property/room/tenant/rent/payment",
  isUser,
  verifyAccessToken,
  readRentPaymentForRoomInPropertyByTenant
);

module.exports = router;
