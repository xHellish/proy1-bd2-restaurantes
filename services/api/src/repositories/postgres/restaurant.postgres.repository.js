const RestaurantRepository = require("../interfaces/restaurant.repository");
const { getPrismaClient } = require("../../config/db");

class RestaurantPostgresRepository extends RestaurantRepository {
  async list() {
    const prisma = getPrismaClient();
    if (!prisma) {
      throw new Error("Prisma Client not generated yet");
    }

    return prisma.restaurant.findMany({
      orderBy: { createdAt: "desc" }
    });
  }

  async create(payload) {
    const prisma = getPrismaClient();
    if (!prisma) {
      throw new Error("Prisma Client not generated yet");
    }

    return prisma.restaurant.create({
      data: payload
    });
  }
}

module.exports = RestaurantPostgresRepository;
