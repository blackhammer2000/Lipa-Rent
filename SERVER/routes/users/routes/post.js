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
router.post("/api/user/owner/create/property", isUser, createNewProperty);
router.post("/api/user/owner/read/property", isUser, readSinglePropertyOwned);
router.post("/api/user/owner/read/properties", isUser, readAllPropertiesOwned);

// ROOM DB ROUTES
router.post(
  "/api/user/owner/create/property/room",
  isUser,
  createSingleRoomOnProperty
);
router.post(
  "/api/user/owner/read/property/rooms",
  isUser,
  readAllRoomsOnProperty
);
router.post(
  "/api/user/owner/read/property/room",
  isUser,
  readSingleRoomOnProperty
);

// TENANTS DB ROUTES
router.post(
  "/api/user/owner/create/property/room/tenant",
  isUser,
  createTenantForRoomOnProperty
);
router.post(
  "/api/user/owner/read/property/rooms/tenants",
  isUser,
  readAllTenantsForAllRoomsOnProperty
);
router.post(
  "/api/user/owner/read/property/room/tenants",
  isUser,
  readAllTenantsInRoomOnProperty
);
router.post(
  "/api/user/owner/read/property/room/tenant",
  isUser,
  readSingleTenantInRoomOnProperty
);

// RENTS DB ROUTES
router.post(
  "/api/user/owner/create/property/room/tenant/rent/payment",
  isUser,
  createRentPaymentForRoomInPropertyByTenant
);
router.post(
  "/api/user/owner/read/property/room/tenants/rents/payments",
  isUser,
  readAllRentPaymentsForRoomInProperty
);
router.post(
  "/api/user/owner/read/property/room/tenant/rents/payments",
  isUser,
  readAllRentPaymentsForRoomInPropertyByTenant
);
router.post(
  "/api/user/owner/read/property/room/tenant/rents/payments",
  isUser,
  readRentPaymentForRoomInPropertyByTenant
);

module.exports = router;
