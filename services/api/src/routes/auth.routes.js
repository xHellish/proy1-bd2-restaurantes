const express = require("express");
const jwt = require("jsonwebtoken");
const env = require("../config/env");

const router = express.Router();

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     summary: Obtener token JWT
 *     description: |
 *       Emite un token JWT para autenticación en endpoints protegidos.
 *       Esta es una implementación simplificada para desarrollo/demo.
 *       Puedes enviar un body vacío para obtener un token con valores por defecto.
 *     tags:
 *       - Autenticación
 *     security: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Token JWT generado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post("/login", (req, res) => {
  const { email = "demo@local", role = "customer" } = req.body || {};
  const token = jwt.sign({ sub: email, role }, env.jwtSecret, { expiresIn: "1h" });

  return res.status(200).json({ token });
});

module.exports = router;
