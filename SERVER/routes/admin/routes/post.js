const router = require("express").Router();

const { login } = require("../controllers/postControllers");

router.post("/api/admin/login", isAdmin, login);
router.post();

module.exports = router;
