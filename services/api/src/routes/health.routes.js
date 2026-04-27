const express = require("express");
const { checkPostgres, checkMongo, checkRedis } = require("../config/db");

const router = express.Router();

/**
 * @openapi
 * /api/health:
 *   get:
 *     summary: Health check de servicios
 *     description: |
 *       Verifica el estado de conexión con todos los servicios de persistencia:
 *       PostgreSQL, MongoDB y Redis.
 *       Retorna `ok` si todos están activos, `degraded` si alguno falla.
 *     tags:
 *       - Salud
 *     security: []
 *     responses:
 *       200:
 *         description: Estado actual de los servicios
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: [ok, degraded]
 *                   description: Estado general
 *                 services:
 *                   type: object
 *                   properties:
 *                     postgres:
 *                       $ref: '#/components/schemas/ServiceStatus'
 *                     mongodb:
 *                       $ref: '#/components/schemas/ServiceStatus'
 *                     redis:
 *                       $ref: '#/components/schemas/ServiceStatus'
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
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
