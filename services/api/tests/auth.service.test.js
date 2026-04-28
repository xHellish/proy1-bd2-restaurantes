jest.mock("../src/config/db", () => ({
  getPrismaClient: jest.fn(),
  getPrismaInitError: jest.fn()
}));

jest.mock("bcryptjs", () => ({
  hash: jest.fn()
}));

const bcrypt = require("bcryptjs");
const { getPrismaClient, getPrismaInitError } = require("../src/config/db");
const AuthService = require("../src/services/auth.service");

describe("AuthService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("creates an admin user in Prisma", async () => {
    const prisma = {
      user: {
        create: jest.fn().mockResolvedValue({
          id: "user-1",
          name: "Admin",
          email: "admin@example.com",
          role: "admin"
        })
      }
    };

    getPrismaClient.mockReturnValue(prisma);
    getPrismaInitError.mockReturnValue(null);
    bcrypt.hash.mockResolvedValue("hashed-password");

    const service = new AuthService();
    const result = await service.registerUser({
      name: "Admin",
      email: "admin@example.com",
      password: "secret123",
      role: "admin"
    });

    expect(result).toEqual({
      id: "user-1",
      name: "Admin",
      email: "admin@example.com",
      role: "admin"
    });
    expect(bcrypt.hash).toHaveBeenCalledWith("secret123", 10);
    expect(prisma.user.create).toHaveBeenCalledWith({
      data: {
        name: "Admin",
        email: "admin@example.com",
        passwordHash: "hashed-password",
        role: "admin"
      }
    });
  });

  it("creates a customer user and derives the name from email when omitted", async () => {
    const prisma = {
      user: {
        create: jest.fn().mockResolvedValue({
          id: "user-2",
          name: "cliente",
          email: "cliente@example.com",
          role: "customer"
        })
      }
    };

    getPrismaClient.mockReturnValue(prisma);
    getPrismaInitError.mockReturnValue(null);
    bcrypt.hash.mockResolvedValue("hashed-password");

    const service = new AuthService();
    const result = await service.registerUser({
      email: "cliente@example.com",
      password: "secret123",
      role: "customer"
    });

    expect(result.name).toBe("cliente");
    expect(prisma.user.create).toHaveBeenCalledWith({
      data: {
        name: "cliente",
        email: "cliente@example.com",
        passwordHash: "hashed-password",
        role: "customer"
      }
    });
  });

  it("rejects invalid roles", async () => {
    const service = new AuthService();

    await expect(
      service.registerUser({
        name: "X",
        email: "x@example.com",
        password: "secret123",
        role: "staff"
      })
    ).rejects.toThrow("Role must be admin or customer");

    expect(getPrismaClient).not.toHaveBeenCalled();
  });
});