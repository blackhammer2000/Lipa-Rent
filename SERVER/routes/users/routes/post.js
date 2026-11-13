require("dotenv").config();

const router = require("express").Router();
const rateLimit = require("express-rate-limit");

const apiVersion = process.env.API_VERSION;

////////////////   TOKEN VALIDATION MIDDLWARE IMPORTS    //////////////////////
const {
  verifySignUpToken,
} = require("../../../middleware/tokens/verifySignUpToken");

const {
  verifyLoginToken,
} = require("../../../middleware/tokens/verifyLoginToken");

const {
  verifyUserAccessToken,
} = require("../../../middleware/tokens/verifyAccessToken");

const {
  isLoginVerified,
} = require("../../../middleware/validators/isLoginVerified");

const {
  verifyForgotPasswordToken,
} = require("../../../middleware/tokens/verifyForgotPasswordToken");

//////////          JOI VALIDATORS IMPORTS  ////////////////////////

const {
  landlordValidator,
  loginValidator,
  propertyValidator,
  tenantValidator,
  roomValidator,
} = require("../../../middleware/validators/validators");

///////////    IS USER VVALIDATOR IMPORT     ////////////////////////
const { isUser } = require("../helpers/isUser");
// const { hasPaid } = require("../helpers/hasPaid");

const {
  loginAttemptMiddleware,
} = require("../../../middleware/validators/loginAttempt");

/////////////////  POST CONTROLLERS IMPORTS      ////////////////////////////////

const {
  generateSignUpOtp,
  verifySignUpOtp,
  signUp,
} = require("../controllers/post/signUpControllers");

const {
  login,
  generateLoginOtp,
  verifyLoginOtp,
} = require("../controllers/post/loginControllers");

const {
  createNewProperty,
  readSinglePropertyOwned,
  readAllPropertiesOwned,
} = require("../controllers/post/propertyControllers");
const {
  createSingleRoomOnProperty,
  readAllRoomsOnProperty,
  readSingleRoomOnProperty,
} = require("../controllers/post/roomControllers");
const {
  createTenantForRoomOnProperty,
  readAllTenantsForAllRoomsOnProperty,
  readAllTenantsInRoomOnProperty,
  readSingleTenantInRoomOnProperty,
} = require("../controllers/post/tenantControllers");

const {
  createRentPaymentForRoomInPropertyByTenant,
  readAllRentPaymentsForAllRoomsInProperty,
  readAllRentPaymentsForRoomInProperty,
  readAllRentPaymentsForRoomInPropertyByTenant,
  readRentPaymentForRoomInPropertyByTenant,
} = require("../controllers/post/rentControllers");

const {
  verifyPassword,
  genarateDeleteAccountOTP,
  verifyDeleteAccountOTP,
} = require("../controllers/post/deleteAccountControllers");

const {
  genarateResetPasswordOTP,
  verifyResetPasswordOTP,
} = require("../controllers/post/resetPasswordControllers");

const {
  verifyUserInfo,
} = require("../controllers/post/forgotPasswordControllers");

const { logout } = require("../controllers/post/logoutControllers");
const { refresh } = require("../controllers/post/refreshTokenControllers");

const { readOwnerDetails } = require("../controllers/post/ownerControllers");

// --- Stricter rate limiter for auth endpoints ---
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 auth requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many authentication attempts, please try again later.",
  },
});

// ////////////////////////  ROUTES   ///////////////////////////////

// SIGN UP
router.post(
  "/api/user/owner/signup/generate/otp",
  authLimiter,
  isUser,
  generateSignUpOtp,
);
router.post(
  "/api/user/owner/signup/verify/otp",
  authLimiter,
  isUser,
  verifySignUpToken,
  verifySignUpOtp,
);
router.post(
  "/api/user/owner/signup",
  authLimiter,
  isUser,
  verifySignUpToken,
  signUp,
);

// LOGIN
router.post(
  "/api/user/owner/login",
  authLimiter,
  isUser,
  loginAttemptMiddleware,
  loginValidator,
  login,
);

// TOKEN REFRESH (refresh access token using refresh token cookie)
router.post("/api/user/owner/refresh", refresh);

router.post(
  "/api/user/owner/get/otp",
  authLimiter,
  isUser,
  verifyLoginToken,
  generateLoginOtp,
);
router.post(
  "/api/user/owner/verify/otp",
  authLimiter,
  isUser,
  verifyLoginToken,
  verifyLoginOtp,
);

// OWNERS DB ROUTES
router.post(
  "/api/user/read/owner",
  isUser,
  verifyUserAccessToken,
  isLoginVerified,
  readOwnerDetails,
);

// PROPERTIES DB ROUTES
router.post(
  "/api/user/owner/create/property",
  isUser,
  verifyUserAccessToken,
  isLoginVerified,
  propertyValidator,
  createNewProperty,
);
router.post(
  "/api/user/owner/read/property",
  isUser,
  verifyUserAccessToken,
  isLoginVerified,
  readSinglePropertyOwned,
);
router.post(
  "/api/user/owner/read/properties",
  isUser,
  verifyUserAccessToken,
  isLoginVerified,
  readAllPropertiesOwned,
);

// ROOM DB ROUTES
router.post(
  "/api/user/owner/create/property/room",
  isUser,
  verifyUserAccessToken,
  isLoginVerified,
  roomValidator,
  createSingleRoomOnProperty,
);
router.post(
  "/api/user/owner/read/property/rooms",
  isUser,
  verifyUserAccessToken,
  isLoginVerified,
  readAllRoomsOnProperty,
);
router.post(
  "/api/user/owner/read/property/room",
  isUser,
  verifyUserAccessToken,
  isLoginVerified,
  readSingleRoomOnProperty,
);

// TENANTS DB ROUTES
router.post(
  "/api/user/owner/create/property/room/tenant",
  isUser,
  verifyUserAccessToken,
  isLoginVerified,
  tenantValidator,
  createTenantForRoomOnProperty,
);
router.post(
  "/api/user/owner/read/property/rooms/tenants",
  isUser,
  verifyUserAccessToken,
  isLoginVerified,
  readAllTenantsForAllRoomsOnProperty,
);
router.post(
  "/api/user/owner/read/property/room/tenants",
  isUser,
  verifyUserAccessToken,
  isLoginVerified,
  readAllTenantsInRoomOnProperty,
);
router.post(
  "/api/user/owner/read/property/room/tenant",
  isUser,
  verifyUserAccessToken,
  isLoginVerified,
  readSingleTenantInRoomOnProperty,
);

// RENTS DB ROUTES
router.post(
  "/api/user/owner/create/property/room/tenant/payment",
  isUser,
  verifyUserAccessToken,
  isLoginVerified,
  createRentPaymentForRoomInPropertyByTenant,
);
router.post(
  "/api/user/owner/read/property/rooms/tenants/payments",
  isUser,
  verifyUserAccessToken,
  isLoginVerified,
  readAllRentPaymentsForAllRoomsInProperty,
);
router.post(
  "/api/user/owner/read/property/room/tenants/payments",
  isUser,
  verifyUserAccessToken,
  isLoginVerified,
  readAllRentPaymentsForRoomInProperty,
);
router.post(
  "/api/user/owner/read/property/room/tenant/payments",
  isUser,
  verifyUserAccessToken,
  isLoginVerified,
  readAllRentPaymentsForRoomInPropertyByTenant,
);
router.post(
  "/api/user/owner/read/property/room/tenant/payment",
  isUser,
  verifyUserAccessToken,
  isLoginVerified,
  readRentPaymentForRoomInPropertyByTenant,
);

// VERIFY CREDETIALS
router.post(
  "/api/user/owner/verify/password",
  isUser,
  verifyUserAccessToken,
  isLoginVerified,
  verifyPassword,
);

router.post(
  "/api/user/owner/verify/nationalid",
  authLimiter,
  isUser,
  verifyUserInfo,
);

// PASSWORD RESET ROUTES
router.post(
  "/api/user/owner/generate/resetToken",
  authLimiter,
  isUser,
  verifyUserAccessToken,
  isLoginVerified,
  genarateResetPasswordOTP,
);
router.post(
  "/api/user/owner/verify/resetToken",
  authLimiter,
  isUser,
  verifyUserAccessToken,
  isLoginVerified,
  verifyResetPasswordOTP,
);

// DELETE ACCOUNT ROUTES
router.post(
  "/api/user/owner/generate/deleteToken",
  authLimiter,
  isUser,
  verifyUserAccessToken,
  isLoginVerified,
  genarateDeleteAccountOTP,
);
router.post(
  "/api/user/owner/verify/deleteToken",
  authLimiter,
  isUser,
  verifyUserAccessToken,
  isLoginVerified,
  verifyDeleteAccountOTP,
);

// FORGOT PASSWORD ROUTES
router.post(
  "/api/user/owner/generate/forgotToken",
  authLimiter,
  isUser,
  verifyForgotPasswordToken,
  genarateResetPasswordOTP,
);
router.post(
  "/api/user/owner/verify/forgotToken",
  authLimiter,
  isUser,
  verifyForgotPasswordToken,
  verifyResetPasswordOTP,
);

router.post(
  "/api/user/owner/logout",
  authLimiter,
  verifyUserAccessToken,
  logout,
);

module.exports = router;
