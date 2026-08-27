const express = require("express");
const { v4: uuidv4 } = require("uuid");

const db = require("../db");

const {
  requireAuth,
  requireManager
} = require("../middleware/auth");

const router = express.Router();

router.use(requireAuth);

/*
====================================================
RELEASE EXPIRED BOOKINGS
====================================================
*/

function releaseExpiredBookings() {
  const now = new Date().toISOString();

  const expired = db
    .prepare(`
      SELECT *
      FROM bookings
      WHERE status = 'accepted'
      AND expires_at IS NOT NULL
      AND expires_at <= ?
    `)
    .all(now);

  const markCompleted = db.prepare(`
    UPDATE bookings
    SET status = 'completed'
    WHERE id = ?
  `);

  const freeEquipment = db.prepare(`
    UPDATE equipment
    SET status = 'available'
    WHERE id = ?
    AND status = 'booked'
  `);

  for (const booking of expired) {
    markCompleted.run(booking.id);
    freeEquipment.run(booking.equipment_id);
  }
}

/*
====================================================
FULL BOOKING
====================================================
*/

function fullBooking(id) {
  return db
    .prepare(`
      SELECT
        b.*,
        e.code AS equipment_code,
        e.name AS equipment_name,
        e.category AS equipment_category
      FROM bookings b
      JOIN equipment e
        ON e.id = b.equipment_id
      WHERE b.id = ?
    `)
    .get(id);
}

/*
====================================================
CHECK EXPIRED BOOKINGS BEFORE REQUESTS
====================================================
*/

router.use((req, res, next) => {
  releaseExpiredBookings();
  next();
});

/*
====================================================
CREATE BOOKING REQUEST
====================================================

Staff, Manager and Super User can request
equipment.
*/

router.post("/", (req, res) => {
  const {
    equipment_id,
    purpose,
    duration_hours
  } = req.body || {};

  const durationNum = Number(duration_hours);

  if (
    !equipment_id ||
    !purpose ||
    !durationNum ||
    durationNum <= 0
  ) {
    return res.status(400).json({
      error:
        "Equipment, purpose, and a positive duration are required"
    });
  }

  const equipment = db
    .prepare(
      "SELECT * FROM equipment WHERE id = ?"
    )
    .get(equipment_id);

  if (!equipment) {
    return res.status(404).json({
      error: "Equipment not found"
    });
  }

  if (equipment.status !== "available") {
    return res.status(409).json({
      error:
        "This equipment is not currently available"
    });
  }

  const gatePassCode =
    `GP-${uuidv4().slice(0, 8).toUpperCase()}`;

  const info = db
    .prepare(`
      INSERT INTO bookings (
        equipment_id,
        requester_id,
        requester_name,
        purpose,
        duration_hours,
        status,
        gate_pass_code
      )
      VALUES (?, ?, ?, ?, ?, 'pending', ?)
    `)
    .run(
      equipment_id,
      req.user.id,
      req.user.name,
      purpose,
      durationNum,
      gatePassCode
    );

  res.status(201).json({
    booking: fullBooking(
      info.lastInsertRowid
    )
  });
});

/*
====================================================
GET BOOKINGS
====================================================

STAFF:
    Can see their own bookings.

MANAGER:
    Can see all bookings.

SUPER USER:
    Can see all bookings.
====================================================
*/

router.get("/", (req, res) => {

  const isManagement =
    req.user.role === "manager" ||
    req.user.role === "superuser";

  const rows = isManagement
    ? db
        .prepare(`
          SELECT
            b.*,
            e.code AS equipment_code,
            e.name AS equipment_name,
            e.category AS equipment_category
          FROM bookings b
          JOIN equipment e
            ON e.id = b.equipment_id
          ORDER BY b.requested_at DESC
        `)
        .all()

    : db
        .prepare(`
          SELECT
            b.*,
            e.code AS equipment_code,
            e.name AS equipment_name,
            e.category AS equipment_category
          FROM bookings b
          JOIN equipment e
            ON e.id = b.equipment_id
          WHERE b.requester_id = ?
          ORDER BY b.requested_at DESC
        `)
        .all(req.user.id);

  res.json({
    bookings: rows
  });
});

/*
====================================================
APPROVE BOOKING
====================================================

Manager OR Super User.
====================================================
*/

router.post(
  "/:id/approve",
  requireManager,
  (req, res) => {

    const booking = db
      .prepare(
        "SELECT * FROM bookings WHERE id = ?"
      )
      .get(req.params.id);

    if (!booking) {
      return res.status(404).json({
        error: "Request not found"
      });
    }

    if (booking.status !== "pending") {
      return res.status(409).json({
        error:
          "This request has already been decided"
      });
    }

    const equipment = db
      .prepare(
        "SELECT * FROM equipment WHERE id = ?"
      )
      .get(booking.equipment_id);

    if (
      !equipment ||
      equipment.status !== "available"
    ) {
      return res.status(409).json({
        error:
          "Equipment is no longer available"
      });
    }

    const expiresAt = new Date(
      Date.now() +
      booking.duration_hours *
      60 *
      60 *
      1000
    ).toISOString();

    const now =
      new Date().toISOString();

    db.prepare(`
      UPDATE bookings
      SET
        status = 'accepted',
        decided_at = ?,
        expires_at = ?
      WHERE id = ?
    `).run(
      now,
      expiresAt,
      booking.id
    );

    db.prepare(`
      UPDATE equipment
      SET status = 'booked'
      WHERE id = ?
    `).run(
      booking.equipment_id
    );

    res.json({
      booking: fullBooking(
        booking.id
      )
    });
  }
);

/*
====================================================
REJECT BOOKING
====================================================

Manager OR Super User.
====================================================
*/

router.post(
  "/:id/reject",
  requireManager,
  (req, res) => {

    const {
      manager_note
    } = req.body || {};

    const booking = db
      .prepare(
        "SELECT * FROM bookings WHERE id = ?"
      )
      .get(req.params.id);

    if (!booking) {
      return res.status(404).json({
        error: "Request not found"
      });
    }

    if (booking.status !== "pending") {
      return res.status(409).json({
        error:
          "This request has already been decided"
      });
    }

    db.prepare(`
      UPDATE bookings
      SET
        status = 'rejected',
        decided_at = ?,
        manager_note = ?
      WHERE id = ?
    `).run(
      new Date().toISOString(),
      manager_note || null,
      booking.id
    );

    res.json({
      booking: fullBooking(
        booking.id
      )
    });
  }
);

/*
====================================================
RETURN EQUIPMENT
====================================================

Staff:
    Can return their own equipment.

Manager:
    Can return any active booking.

Super User:
    Can return any active booking.
====================================================
*/

router.post(
  "/:id/return",
  (req, res) => {

    const booking = db
      .prepare(
        "SELECT * FROM bookings WHERE id = ?"
      )
      .get(req.params.id);

    if (!booking) {
      return res.status(404).json({
        error: "Request not found"
      });
    }

    const canReturnAny =
      req.user.role === "manager" ||
      req.user.role === "superuser";

    if (
      booking.requester_id !== req.user.id &&
      !canReturnAny
    ) {
      return res.status(403).json({
        error:
          "You can only return your own equipment"
      });
    }

    if (booking.status !== "accepted") {
      return res.status(409).json({
        error:
          "This booking is not currently active"
      });
    }

    db.prepare(`
      UPDATE bookings
      SET status = 'completed'
      WHERE id = ?
    `).run(booking.id);

    db.prepare(`
      UPDATE equipment
      SET status = 'available'
      WHERE id = ?
    `).run(booking.equipment_id);

    res.json({
      booking: fullBooking(
        booking.id
      )
    });
  }
);

module.exports = router;