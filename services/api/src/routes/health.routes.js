const express = require("express");
const { checkPostgres, checkMongo, checkRedis } = require("../config/db");

const router = express.Router();

/**
 * @openapi
 * /api/health:
 *   get:
 *     summary: Estado de los servicios de datos
 *     responses:
 *       200:
 *         description: Estado actual
 */
router.get("/", async (req, res) => {
  const [postgres, mongodb, redis] = await Promise.all([
    checkPostgres(),
    checkMongo(),
    checkRedis()
  ]);

  const status = [postgres, mongodb, redis].every((s) => s.status === "up")
    ? "ok"
    : "degraded";

  return res.status(200).json({
    status,
    services: { postgres, mongodb, redis }
  });
});

module.exports = router;
