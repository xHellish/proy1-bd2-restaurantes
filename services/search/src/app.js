const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const morgan = require("morgan");
const healthRoutes = require("./routes/health.routes");
const searchRoutes = require("./routes/search.routes");

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.use("/health", healthRoutes);
app.use("/search", searchRoutes);

app.get("/", (req, res) => {
  res.status(200).json({ service: "search", status: "ok" });
});

module.exports = app;
