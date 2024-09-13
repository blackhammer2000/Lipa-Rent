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
  readCurrentStatusOfAllRoomsOnSingleProperty,
} = require("../controllers/postControllers");

router.post("/api/user/landlord/signup", isUser, landlordValidator, signUp);
router.post("/api/user/landlord/login", isUser, loginValidator, login);

router.post(
  "/api/user/landlord/read/property/rooms",
  isUser,
  readCurrentStatusOfAllRoomsOnSingleProperty
);

module.exports = router;
