const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const morgan = require("morgan");
const healthRoutes = require("./routes/health.routes");
const searchRoutes = require("./routes/search.routes");
const env = require("./config/env");

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan(env.nodeEnv === "production" ? "combined" : "dev"));

app.use("/health", healthRoutes);
app.use("/search", searchRoutes);

app.get("/", (req, res) => {
  res.status(200).json({ service: "search", status: "ok" });
});

// Handler global de errores — debe ir al final, despues de todas las rutas
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || "Internal server error"
  });
});

module.exports = app;
