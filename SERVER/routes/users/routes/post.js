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
  readAllRoomsOnProperty,
  readSingleRoomOnProperty,
} = require("../controllers/postControllers");

router.post("/api/user/owner/signup", isUser, landlordValidator, signUp);
router.post("/api/user/owner/login", isUser, loginValidator, login);

router.post("/api/user/owner/create/property", isUser, createNewProperty);
router.post("/api/user/owner/read/property", isUser, readSinglePropertyOwned);
router.post("/api/user/owner/read/properties", isUser, readAllPropertiesOwned);

router.post(
  "/api/user/landlord/property/read/rooms",
  isUser,
  readAllRoomsOnProperty
);

router.post(
  "/api/user/landlord/property/read/room",
  isUser,
  readSingleRoomOnProperty
);

module.exports = router;
