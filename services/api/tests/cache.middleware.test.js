const Redis = require("ioredis");
const { cacheMiddleware, invalidateCacheMiddleware } = require("../src/middlewares/cache.middleware");
const express = require("express");
const request = require("supertest");

// Mock Redis for tests
jest.mock("ioredis", () => {
  const mockRedis = {
    get: jest.fn(),
    setex: jest.fn(),
    eval: jest.fn(),
    flushdb: jest.fn()
  };
  return jest.fn(() => mockRedis);
});

describe("cache middleware", () => {
  let app;
  let mockRedis;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRedis = require("ioredis").__redis || {};
    app = express();
    app.use(express.json());
  });

  describe("cacheMiddleware", () => {
    it("returns MISS and caches response on first GET", async () => {
      app.use("/api/test", cacheMiddleware(300));
      app.get("/api/test", (req, res) => {
        res.json({ data: "test" });
      });

      const mockRedis = require("ioredis").mock.results[0].value;
      mockRedis.get.mockResolvedValue(null);
      mockRedis.setex.mockResolvedValue("OK");

      const response = await request(app).get("/api/test");

      expect(response.statusCode).toBe(200);
      expect(response.headers["x-cache"]).toBe("MISS");
      expect(response.body).toEqual({ data: "test" });
    });

    it("returns HIT and cached response on second GET", async () => {
      app.use("/api/test", cacheMiddleware(300));
      app.get("/api/test", (req, res) => {
        res.json({ data: "test" });
      });

      const mockRedis = require("ioredis").mock.results[0].value;
      mockRedis.get.mockResolvedValue(JSON.stringify({ data: "cached" }));

      const response = await request(app).get("/api/test");

      expect(response.statusCode).toBe(200);
      expect(response.headers["x-cache"]).toBe("HIT");
      expect(response.body).toEqual({ data: "cached" });
    });

    it("does not cache non-GET requests", async () => {
      app.use(cacheMiddleware(300));
      app.post("/api/test", (req, res) => {
        res.json({ created: true });
      });

      const mockRedis = require("ioredis").mock.results[0].value;
      const response = await request(app).post("/api/test");

      expect(response.statusCode).toBe(200);
      expect(mockRedis.get).not.toHaveBeenCalled();
    });

    it("handles cache errors gracefully", async () => {
      app.use(cacheMiddleware(300));
      app.get("/api/test", (req, res) => {
        res.json({ data: "test" });
      });

      const mockRedis = require("ioredis").mock.results[0].value;
      mockRedis.get.mockRejectedValue(new Error("Redis error"));

      const response = await request(app).get("/api/test");

      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({ data: "test" });
    });
  });

  describe("invalidateCacheMiddleware", () => {
    it("invalidates cache on POST", async () => {
      app.use(invalidateCacheMiddleware());
      app.post("/api/test", (req, res) => {
        res.json({ created: true });
      });

      const mockRedis = require("ioredis").mock.results[0].value;
      mockRedis.eval.mockResolvedValue(0);

      const response = await request(app).post("/api/test");

      expect(response.statusCode).toBe(200);
      expect(mockRedis.eval).toHaveBeenCalled();
    });

    it("invalidates cache on PUT", async () => {
      app.use(invalidateCacheMiddleware());
      app.put("/api/test", (req, res) => {
        res.json({ updated: true });
      });

      const mockRedis = require("ioredis").mock.results[0].value;
      mockRedis.eval.mockResolvedValue(1);

      const response = await request(app).put("/api/test");

      expect(response.statusCode).toBe(200);
      expect(mockRedis.eval).toHaveBeenCalled();
    });

    it("invalidates cache on DELETE", async () => {
      app.use(invalidateCacheMiddleware());
      app.delete("/api/test", (req, res) => {
        res.json({ deleted: true });
      });

      const mockRedis = require("ioredis").mock.results[0].value;
      mockRedis.eval.mockResolvedValue(2);

      const response = await request(app).delete("/api/test");

      expect(response.statusCode).toBe(200);
      expect(mockRedis.eval).toHaveBeenCalled();
    });

    it("does not invalidate cache on error responses", async () => {
      app.use(invalidateCacheMiddleware());
      app.post("/api/test", (req, res) => {
        res.status(400).json({ error: "bad request" });
      });

      const mockRedis = require("ioredis").mock.results[0].value;
      const response = await request(app).post("/api/test");

      expect(response.statusCode).toBe(400);
      // For error responses, invalidation shouldn't happen
    });

    it("handles cache invalidation errors gracefully", async () => {
      app.use(invalidateCacheMiddleware());
      app.post("/api/test", (req, res) => {
        res.json({ created: true });
      });

      const mockRedis = require("ioredis").mock.results[0].value;
      mockRedis.eval.mockRejectedValue(new Error("Invalidation error"));

      const response = await request(app).post("/api/test");

      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({ created: true });
    });
  });
});
