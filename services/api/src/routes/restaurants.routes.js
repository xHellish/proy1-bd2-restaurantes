const express = require("express");
const RestaurantService = require("../services/restaurant.service");
const auth = require("../middlewares/auth");

const router = express.Router();
const restaurantService = new RestaurantService();

/**
 * @openapi
 * /api/restaurants:
 *   get:
 *     summary: Lista restaurantes
 *     responses:
 *       200:
 *         description: OK
 */
router.get("/", async (req, res) => {
  const data = await restaurantService.listRestaurants();
  return res.status(200).json(data);
});

/**
 * @openapi
 * /api/restaurants:
 *   post:
 *     summary: Crea restaurante
 *     responses:
 *       201:
 *         description: Creado
 */
router.post("/", auth, async (req, res) => {
  const created = await restaurantService.createRestaurant(req.body);
  return res.status(201).json(created);
});

module.exports = router;
