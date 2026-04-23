const express = require("express");
const healthRoutes = require("./health.routes");
const authRoutes = require("./auth.routes");
const restaurantRoutes = require("./restaurants.routes");
const cacheRoutes = require("./cache.routes");

const router = express.Router();

router.use("/health", healthRoutes);
router.use("/auth", authRoutes);
router.use("/restaurants", restaurantRoutes);
router.use("/cache", cacheRoutes);

module.exports = router;
