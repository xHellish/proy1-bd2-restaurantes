const { elastic } = require("../config/elasticsearch");
const { indexRestaurant } = require("./restaurant.indexer");
const { indexBulkProducts } = require("./product.indexer");

// Configuración de Prisma - misma que en la API
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function reindexAll() {
  try {
    console.log("Starting reindex...");

    // Limpiar índices
    console.log("Clearing indices...");
    try {
      await elastic.indices.delete({ index: "restaurants" });
      await elastic.indices.delete({ index: "products" });
    } catch (e) {
      // Ignorar si los índices no existen
      console.log("Indices may not exist yet, creating new ones");
    }

    // Obtener restaurantes
    console.log("Fetching restaurants...");
    const restaurants = await prisma.restaurant.findMany();
    console.log(`Found ${restaurants.length} restaurants`);

    // Obtener productos
    console.log("Fetching products...");
    const products = await prisma.product.findMany({
      include: { category: true }
    });
    console.log(`Found ${products.length} products`);

    // Indexar restaurantes
    if (restaurants.length > 0) {
      console.log("Indexing restaurants...");
      for (const restaurant of restaurants) {
        await indexRestaurant(restaurant);
      }
    }

    // Indexar productos
    if (products.length > 0) {
      console.log("Indexing products...");
      await indexBulkProducts(products);
    }

    console.log("Reindex completed successfully");
    return {
      success: true,
      restaurantsIndexed: restaurants.length,
      productsIndexed: products.length
    };
  } catch (error) {
    console.error("Reindex failed:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

module.exports = {
  reindexAll
};
