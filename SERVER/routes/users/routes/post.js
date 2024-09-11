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
  readStudent,
  registerStudent,
  assignBookToStudent,
  registerBookToTheInventory,
  readSelectedSubjectBooks,
} = require("../controllers/postControllers");

router.post("/api/user/landlord/signup", isUser, landlordValidator, signUp);

module.exports = router;
