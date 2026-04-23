const express = require("express");
const jwt = require("jsonwebtoken");
const env = require("../config/env");

const router = express.Router();

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     summary: Login basico para pruebas
 *     responses:
 *       200:
 *         description: Token emitido
 */
router.post("/login", (req, res) => {
  const { email = "demo@local", role = "customer" } = req.body || {};
  const token = jwt.sign({ sub: email, role }, env.jwtSecret, { expiresIn: "1h" });

  return res.status(200).json({ token });
});

module.exports = router;
