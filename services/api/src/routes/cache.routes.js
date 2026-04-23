const express = require("express");
const { redis } = require("../config/db");

const router = express.Router();

/**
 * @openapi
 * /api/cache/stats:
 *   get:
 *     summary: Estadisticas basicas de cache
 *     responses:
 *       200:
 *         description: Estado de Redis
 */
router.get("/stats", async (req, res) => {
  try {
    if (redis.status !== "ready") {
      await redis.connect();
    }

    const info = await redis.info("stats");
    return res.status(200).json({ status: "ok", info });
  } catch (error) {
    return res.status(503).json({ status: "down", error: error.message });
  }
});

module.exports = router;
