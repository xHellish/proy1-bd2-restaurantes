const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "PY01 Restaurantes API",
      version: "1.0.0",
      description: "API REST inicial del proyecto"
    }
  },
  apis: ["./src/routes/*.js"]
};

module.exports = swaggerJsdoc(options);
