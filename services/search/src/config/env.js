const dotenv = require("dotenv");

dotenv.config();

module.exports = {
  port: Number(process.env.SEARCH_PORT || 4000),
  nodeEnv: process.env.NODE_ENV || "development",
  elasticUrl: process.env.ELASTIC_URL || "http://localhost:9200",
  redisUrl: process.env.REDIS_URL || "redis://localhost:6379"
};
