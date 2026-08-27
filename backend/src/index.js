const express = require("express");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/auth");
const equipmentRoutes = require("./routes/equipment");
const bookingRoutes = require("./routes/bookings");
const userRoutes = require("./routes/users");

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => res.json({ ok: true }));

app.use("/api/auth", authRoutes);
app.use("/api/equipment", equipmentRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/users", userRoutes);

// Fallback error handler so unexpected errors return JSON, not an HTML stack trace
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Something went wrong on the server" });
});

app.listen(PORT, () => {
  console.log(`Equipment Tracker API listening on port ${PORT}`);
});
