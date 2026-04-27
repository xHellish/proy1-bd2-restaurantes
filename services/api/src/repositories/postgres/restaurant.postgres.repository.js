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

  async findById(id) {
    const prisma = getPrismaClient();
    if (!prisma) {
      throw new Error("Prisma Client not generated yet");
    }

    return prisma.restaurant.findUnique({ where: { id } });
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

  async update(id, payload) {
    const prisma = getPrismaClient();
    if (!prisma) {
      throw new Error("Prisma Client not generated yet");
    }

    return prisma.restaurant.update({
      where: { id },
      data: payload
    });
  }

  async delete(id) {
    const prisma = getPrismaClient();
    if (!prisma) {
      throw new Error("Prisma Client not generated yet");
    }

    return prisma.restaurant.delete({ where: { id } });
  }
}

module.exports = RestaurantPostgresRepository;
