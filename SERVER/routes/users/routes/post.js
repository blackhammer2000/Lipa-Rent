const router = require("express").Router();

const {
  verifyAccessToken,
} = require("../../../middleware/tokens/verifyAccessToken");

const {
  loginValidator,
  institutionValidator,
  bookValidator,
  studentValidator,
} = require("../../../middlewares/validator/joi_validators");

const { isUser } = require("../helpers/isUser");

const {
  signUp,
  login,
  readStudent,
  registerStudent,
  assignBookToStudent,
  registerBookToTheInventory,
  readSelectedSubjectBooks,
} = require("../controllers/postControllers");

router.post("/api/user/landlord/signup", isUser, signUp);

module.exports = router;
