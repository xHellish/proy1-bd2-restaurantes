const bcrypt = require("bcryptjs");
const { getPrismaClient, getPrismaInitError } = require("../config/db");

class AuthService {
  async registerUser(payload) {
    const email = payload.email?.trim().toLowerCase();
    const password = payload.password;
    const role = payload.role || "customer";

    if (!email || !password) {
      throw new Error("Email and password are required");
    }

    if (!['admin', 'customer'].includes(role)) {
      throw new Error("Role must be admin or customer");
    }

    const prisma = getPrismaClient();

    if (!prisma) {
      const prismaError = getPrismaInitError();
      throw new Error(prismaError?.message || "Prisma client is unavailable");
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const name = payload.name?.trim() || email.split("@")[0];

    return prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role
      }
    });
  }

  async login({ email, password }) {
    const e = email?.trim().toLowerCase();
    if (!e || !password) {
      throw new Error("Email and password are required");
    }

    const prisma = getPrismaClient();

    if (!prisma) {
      const prismaError = getPrismaInitError();
      throw new Error(prismaError?.message || "Prisma client is unavailable");
    }

    const user = await prisma.user.findUnique({ where: { email: e } });

    if (!user) {
      throw new Error("Invalid credentials");
    }

    const match = await bcrypt.compare(password, user.passwordHash);

    if (!match) {
      throw new Error("Invalid credentials");
    }

    return user;
  }
}

module.exports = AuthService;