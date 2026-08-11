const router = require("express").Router();

const {
  verifyUserAccessToken,
} = require("../../../middleware/tokens/verifyAccessToken");
const {
  verifyForgotPasswordToken,
} = require("../../../middleware/tokens/verifyForgotPasswordToken");

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
  generateSignUpOtp,
  verifySignUpOtp,
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
  readAllRentPaymentsForAllRoomsInProperty,
  readAllRentPaymentsForRoomInProperty,
  readAllRentPaymentsForRoomInPropertyByTenant,
  readRentPaymentForRoomInPropertyByTenant,

  genarateResetPasswordToken,
  verifyResetPasswordToken,

  verifyPassword,
  genarateDeleteAccountToken,
  verifyDeleteAccountToken,

  verifyUserInfo,

  logout,
} = require("../controllers/postControllers");

const {
  verifyLoginToken,
} = require("../../../middleware/tokens/verifyLoginToken");
const {
  verifySignUpToken,
} = require("../../../middleware/tokens/verifySignUpToken");
const {
  isLoginVerified,
} = require("../../../middleware/validators/isLoginVerified");

// ////////////////////////  ROUTES   ///////////////////////////////

// SIGN UP
router.post("/api/user/owner/signup/generate/otp", isUser, generateSignUpOtp);
router.post(
  "/api/user/owner/signup/verify/otp",
  isUser,
  verifySignUpToken,
  verifySignUpOtp
);
router.post("/api/user/owner/signup", isUser, verifySignUpToken, signUp);

// LOGIN
router.post("/api/user/owner/login", isUser, loginValidator, login);
router.post(
  "/api/user/owner/get/otp",
  isUser,
  verifyLoginToken,
  generateLoginOtp
);
router.post(
  "/api/user/owner/verify/otp",
  isUser,
  verifyLoginToken,
  verifyLoginOtp
);

// OWNERS DB ROUTES
router.post(
  "/api/user/read/owner",
  isUser,
  verifyUserAccessToken,
  isLoginVerified,
  readOwnerDetails
);

// PROPERTIES DB ROUTES
router.post(
  "/api/user/owner/create/property",
  isUser,
  verifyUserAccessToken,
  isLoginVerified,
  propertyValidator,
  createNewProperty
);
router.post(
  "/api/user/owner/read/property",
  isUser,
  verifyUserAccessToken,
  isLoginVerified,
  readSinglePropertyOwned
);
router.post(
  "/api/user/owner/read/properties",
  isUser,
  verifyUserAccessToken,
  isLoginVerified,
  readAllPropertiesOwned
);

// ROOM DB ROUTES
router.post(
  "/api/user/owner/create/property/room",
  isUser,
  verifyUserAccessToken,
  isLoginVerified,
  roomValidator,
  createSingleRoomOnProperty
);
router.post(
  "/api/user/owner/read/property/rooms",
  isUser,
  verifyUserAccessToken,
  isLoginVerified,
  readAllRoomsOnProperty
);
router.post(
  "/api/user/owner/read/property/room",
  isUser,
  verifyUserAccessToken,
  isLoginVerified,
  readSingleRoomOnProperty
);

// TENANTS DB ROUTES
router.post(
  "/api/user/owner/create/property/room/tenant",
  isUser,
  verifyUserAccessToken,
  isLoginVerified,
  tenantValidator,
  createTenantForRoomOnProperty
);
router.post(
  "/api/user/owner/read/property/rooms/tenants",
  isUser,
  verifyUserAccessToken,
  isLoginVerified,
  readAllTenantsForAllRoomsOnProperty
);
router.post(
  "/api/user/owner/read/property/room/tenants",
  isUser,
  verifyUserAccessToken,
  isLoginVerified,
  readAllTenantsInRoomOnProperty
);
router.post(
  "/api/user/owner/read/property/room/tenant",
  isUser,
  verifyUserAccessToken,
  isLoginVerified,
  readSingleTenantInRoomOnProperty
);

// RENTS DB ROUTES
router.post(
  "/api/user/owner/create/property/room/tenant/payment",
  isUser,
  verifyUserAccessToken,
  isLoginVerified,
  createRentPaymentForRoomInPropertyByTenant
);
router.post(
  "/api/user/owner/read/property/rooms/tenants/payments",
  isUser,
  verifyUserAccessToken,
  isLoginVerified,
  readAllRentPaymentsForAllRoomsInProperty
);
router.post(
  "/api/user/owner/read/property/room/tenants/payments",
  isUser,
  verifyUserAccessToken,
  isLoginVerified,
  readAllRentPaymentsForRoomInProperty
);
router.post(
  "/api/user/owner/read/property/room/tenant/payments",
  isUser,
  verifyUserAccessToken,
  isLoginVerified,
  readAllRentPaymentsForRoomInPropertyByTenant
);
router.post(
  "/api/user/owner/read/property/room/tenant/payment",
  isUser,
  verifyUserAccessToken,
  isLoginVerified,
  readRentPaymentForRoomInPropertyByTenant
);

// VERIFY CREDETIALS
router.post(
  "/api/user/owner/verify/password",
  isUser,
  verifyUserAccessToken,
  isLoginVerified,
  verifyPassword
);
router.post("/api/user/owner/verify/nationalid", isUser, verifyUserInfo);

// PASSWORD RESET ROUTES
router.post(
  "/api/user/owner/generate/resetToken",
  isUser,
  verifyUserAccessToken,
  isLoginVerified,

  genarateResetPasswordToken
);
router.post(
  "/api/user/owner/verify/resetToken",
  isUser,
  verifyUserAccessToken,
  isLoginVerified,
  verifyResetPasswordToken
);

// DELETE ACCOUNT ROUTES
router.post(
  "/api/user/owner/generate/deleteToken",
  isUser,
  verifyUserAccessToken,
  isLoginVerified,
  genarateDeleteAccountToken
);
router.post(
  "/api/user/owner/verify/deleteToken",
  isUser,
  verifyUserAccessToken,
  isLoginVerified,
  verifyDeleteAccountToken
);

// FORGOT PASSWORD ROUTES
router.post(
  "/api/user/owner/generate/forgotToken",
  isUser,
  verifyForgotPasswordToken,
  genarateResetPasswordToken
);
router.post(
  "/api/user/owner/verify/forgotToken",
  isUser,
  verifyForgotPasswordToken,
  verifyResetPasswordToken
);

router.post("/api/user/owner/logout", verifyUserAccessToken, logout);

module.exports = router;
