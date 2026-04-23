const dotenv = require("dotenv");

dotenv.config();

module.exports = {
  port: Number(process.env.SEARCH_PORT || 4000),
  elasticUrl: process.env.ELASTIC_URL || "http://localhost:9200"
};
