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
  try {
    const data = await restaurantService.listRestaurants();
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error", error: error.message });
  }
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
  try {
    const created = await restaurantService.createRestaurant(req.body);
    return res.status(201).json(created);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error", error: error.message });
  }
});

module.exports = router;
