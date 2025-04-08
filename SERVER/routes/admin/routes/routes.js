const router = require("express").Router();

const getRoutes = require("./get");
const postRoutes = require("./post");
const patchRoutes = require("./patch");
const deleteRoutes = require("./delete");

// router.use(getRoutes);
// router.use(postRoutes);
// router.use(patchRoutes);
// router.use(deleteRoutes);

module.exports = router;
