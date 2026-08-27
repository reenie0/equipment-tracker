const express = require("express");
const db = require("../db");
const { requireAuth, requireManager } = require("../middleware/auth");

const router = express.Router();

router.use(requireAuth);

// List all equipment, newest first
router.get("/", (req, res) => {
  const items = db.prepare("SELECT * FROM equipment ORDER BY created_at DESC").all();
  res.json({ items });
});

// Manager only: add new equipment
router.post("/", requireManager, (req, res) => {
  const { code, name, category, notes } = req.body || {};
  if (!code || !name || !category) {
    return res.status(400).json({ error: "Code, name, and category are required" });
  }

  const exists = db.prepare("SELECT id FROM equipment WHERE code = ?").get(code);
  if (exists) return res.status(409).json({ error: "An item with that ID/code already exists" });

  const info = db
    .prepare("INSERT INTO equipment (code, name, category, status, notes) VALUES (?, ?, ?, 'available', ?)")
    .run(code, name, category, notes || null);

  const item = db.prepare("SELECT * FROM equipment WHERE id = ?").get(info.lastInsertRowid);
  res.status(201).json({ item });
});

// Manager only: manually change status (e.g. send to repair, bring back online)
router.patch("/:id/status", requireManager, (req, res) => {
  const { status } = req.body || {};
  if (!["available", "booked", "repair"].includes(status)) {
    return res.status(400).json({ error: "Status must be available, booked, or repair" });
  }

  const item = db.prepare("SELECT * FROM equipment WHERE id = ?").get(req.params.id);
  if (!item) return res.status(404).json({ error: "Equipment not found" });

  db.prepare("UPDATE equipment SET status = ? WHERE id = ?").run(status, req.params.id);
  res.json({ item: db.prepare("SELECT * FROM equipment WHERE id = ?").get(req.params.id) });
});

// Manager only: delete equipment
router.delete("/:id", requireManager, (req, res) => {
  const item = db.prepare("SELECT * FROM equipment WHERE id = ?").get(req.params.id);
  if (!item) return res.status(404).json({ error: "Equipment not found" });

  const activeBooking = db
    .prepare("SELECT id FROM bookings WHERE equipment_id = ? AND status IN ('pending', 'accepted')")
    .get(req.params.id);
  if (activeBooking) {
    return res.status(409).json({ error: "Can't delete equipment with a pending or active booking" });
  }

  db.prepare("DELETE FROM equipment WHERE id = ?").run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
