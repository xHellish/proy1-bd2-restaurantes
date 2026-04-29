const Redis = require("ioredis");
const { cacheMiddleware } = require("../src/middlewares/cache.middleware");
const express = require("express");
const request = require("supertest");

jest.mock("ioredis", () => {
  const mockRedis = {
    get: jest.fn(),
    setex: jest.fn(),
    flushdb: jest.fn()
  };
  return jest.fn(() => mockRedis);
});

describe("search cache middleware", () => {
  let app;

  beforeEach(() => {
    jest.clearAllMocks();
    app = express();
    app.use(express.json());
  });

  it("returns MISS and caches search results on first request", async () => {
    app.use("/search", cacheMiddleware(600));
    app.get("/search/test", (req, res) => {
      res.json([
        { id: "1", name: "Pasta", categoryId: "cat-1" },
        { id: "2", name: "Pizza", categoryId: "cat-2" }
      ]);
    });

    const mockRedis = require("ioredis").mock.results[0].value;
    mockRedis.get.mockResolvedValue(null);
    mockRedis.setex.mockResolvedValue("OK");

    const response = await request(app).get("/search/test");

    expect(response.statusCode).toBe(200);
    expect(response.headers["x-cache"]).toBe("MISS");
    expect(response.body).toHaveLength(2);
  });

  it("returns HIT from cache on subsequent request", async () => {
    app.use("/search", cacheMiddleware(600));
    app.get("/search/test", (req, res) => {
      res.json([{ id: "1", name: "Pasta" }]);
    });

    const cached = JSON.stringify([
      { id: "1", name: "Pasta", categoryId: "cat-1" }
    ]);
    const mockRedis = require("ioredis").mock.results[0].value;
    mockRedis.get.mockResolvedValue(cached);

    const response = await request(app).get("/search/test");

    expect(response.statusCode).toBe(200);
    expect(response.headers["x-cache"]).toBe("HIT");
    expect(response.body[0].name).toBe("Pasta");
  });

  it("caches with correct TTL of 10 minutes", async () => {
    const mockRedis = require("ioredis").mock.results[0].value;
    mockRedis.get.mockResolvedValue(null);
    mockRedis.setex.mockResolvedValue("OK");

    app.use("/search/products", cacheMiddleware(600));
    app.get("/search/products", (req, res) => {
      res.json([{ id: "1", name: "Pizza" }]);
    });

    await request(app).get("/search/products?q=pizza");

    expect(mockRedis.setex).toHaveBeenCalledWith(
      expect.stringContaining("cache:search"),
      600,
      expect.any(String)
    );
  });

  it("does not cache non-GET requests", async () => {
    const mockRedis = require("ioredis").mock.results[0].value;
    app.use("/search", cacheMiddleware(600));
    app.post("/search/test", (req, res) => {
      res.json({ created: true });
    });

    await request(app).post("/search/test");

    expect(mockRedis.get).not.toHaveBeenCalled();
  });

  it("handles cache retrieval errors gracefully", async () => {
    const mockRedis = require("ioredis").mock.results[0].value;
    mockRedis.get.mockRejectedValue(new Error("Redis error"));

    app.use("/search", cacheMiddleware(600));
    app.get("/search/test", (req, res) => {
      res.json({ data: "fallback" });
    });

    const response = await request(app).get("/search/test");

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({ data: "fallback" });
  });

  it("handles cache storage errors gracefully", async () => {
    const mockRedis = require("ioredis").mock.results[0].value;
    mockRedis.get.mockResolvedValue(null);
    mockRedis.setex.mockRejectedValue(new Error("Cache storage failed"));

    app.use("/search", cacheMiddleware(600));
    app.get("/search/test", (req, res) => {
      res.json({ data: "test" });
    });

    const response = await request(app).get("/search/test");

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({ data: "test" });
  });
});
