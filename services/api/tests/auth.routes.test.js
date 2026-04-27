const express = require("express");
const request = require("supertest");

jest.mock("../src/config/env", () => ({
  jwtSecret: "test-secret"
}));

const mockSign = jest.fn(() => "signed-token");

jest.mock("jsonwebtoken", () => ({
  sign: (...args) => mockSign(...args)
}));

const authRoutes = require("../src/routes/auth.routes");

describe("auth routes", () => {
  const app = express();

  app.use(express.json());
  app.use("/api/auth", authRoutes);

  beforeEach(() => {
    mockSign.mockClear();
  });

  it("creates a token with default payload", async () => {
    const response = await request(app).post("/api/auth/login").send({});

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({ token: "signed-token" });
    expect(mockSign).toHaveBeenCalledWith(
      { sub: "demo@local", role: "customer" },
      "test-secret",
      { expiresIn: "1h" }
    );
  });

  it("creates a token with custom payload", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({ email: "juan@example.com", role: "admin" });

    expect(response.statusCode).toBe(200);
    expect(response.body.token).toBe("signed-token");
    expect(mockSign).toHaveBeenCalledWith(
      { sub: "juan@example.com", role: "admin" },
      "test-secret",
      { expiresIn: "1h" }
    );
  });
});