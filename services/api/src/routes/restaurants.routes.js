const express = require("express");
const RestaurantService = require("../services/restaurant.service");
const auth = require("../middlewares/auth");

const router = express.Router();
const restaurantService = new RestaurantService();

/**
 * @openapi
 * /api/restaurants:
 *   get:
 *     summary: Listar restaurantes
 *     description: Retorna una lista paginada de todos los restaurantes disponibles
 *     tags:
 *       - Restaurantes
 *     security: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Número máximo de resultados
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Salto de resultados para paginación
 *     responses:
 *       200:
 *         description: Listado de restaurantes obtenido exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Restaurant'
 *                 total:
 *                   type: integer
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
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
 *     summary: Crear restaurante
 *     description: Crea un nuevo restaurante en la base de datos. Requiere autenticación JWT.
 *     tags:
 *       - Restaurantes
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RestaurantInput'
 *     responses:
 *       201:
 *         description: Restaurante creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Restaurant'
 *       400:
 *         description: Datos inválidos o incompletos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: No autorizado — token inválido o ausente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post("/", auth, async (req, res) => {
  try {
    const created = await restaurantService.createRestaurant(req.body);
    return res.status(201).json(created);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error", error: error.message });
  }
});

/**
 * @openapi
 * /api/restaurants/{id}:
 *   get:
 *     summary: Obtener restaurante por ID
 *     description: Retorna un restaurante específico por su ID
 *     tags:
 *       - Restaurantes
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del restaurante
 *     responses:
 *       200:
 *         description: Restaurante encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Restaurant'
 *       404:
 *         description: Restaurante no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/:id", async (req, res) => {
  try {
    const data = await restaurantService.getRestaurant(req.params.id);
    if (!data) {
      return res.status(404).json({ message: "Restaurant not found" });
    }
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error", error: error.message });
  }
});

/**
 * @openapi
 * /api/restaurants/{id}:
 *   put:
 *     summary: Actualizar restaurante
 *     description: Actualiza un restaurante existente. Requiere autenticación JWT.
 *     tags:
 *       - Restaurantes
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del restaurante
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RestaurantInput'
 *     responses:
 *       200:
 *         description: Restaurante actualizado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Restaurant'
 *       401:
 *         description: No autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Restaurante no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put("/:id", auth, async (req, res) => {
  try {
    const updated = await restaurantService.updateRestaurant(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ message: "Restaurant not found" });
    }
    return res.status(200).json(updated);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error", error: error.message });
  }
});

/**
 * @openapi
 * /api/restaurants/{id}:
 *   delete:
 *     summary: Eliminar restaurante
 *     description: Elimina un restaurante por su ID. Requiere autenticación JWT.
 *     tags:
 *       - Restaurantes
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del restaurante
 *     responses:
 *       200:
 *         description: Restaurante eliminado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       401:
 *         description: No autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Restaurante no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete("/:id", auth, async (req, res) => {
  try {
    const deleted = await restaurantService.deleteRestaurant(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Restaurant not found" });
    }
    return res.status(200).json({ message: "Restaurant deleted" });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error", error: error.message });
  }
});

module.exports = router;
