const express = require("express");

const db = require("../db");

const {
  requireAuth,
  requireManager
} = require("../middleware/auth");

const router = express.Router();

router.use(requireAuth);

/*
====================================================
ALLOWED EQUIPMENT DEPARTMENTS
====================================================
*/

const ALLOWED_DEPARTMENTS = [
  "Post Production",
  "IT",
  "Social Media"
];

/*
====================================================
SERIAL NUMBER REQUIRED FOR
====================================================

IT
Social Media

Post Production equipment can currently
have no serial number.
====================================================
*/

const SERIAL_REQUIRED_DEPARTMENTS = [
  "IT",
  "Social Media"
];

/*
====================================================
LIST ALL EQUIPMENT
====================================================

Newest first.
====================================================
*/

router.get("/", (req, res) => {

  const items = db
    .prepare(`
      SELECT *
      FROM equipment
      ORDER BY created_at DESC
    `)
    .all();

  res.json({
    items
  });
});

/*
====================================================
GET ONE EQUIPMENT ITEM
====================================================
*/

router.get("/:id", (req, res) => {

  const item = db
    .prepare(`
      SELECT *
      FROM equipment
      WHERE id = ?
    `)
    .get(req.params.id);

  if (!item) {
    return res.status(404).json({
      error: "Equipment not found"
    });
  }

  res.json({
    item
  });
});

/*
====================================================
MANAGER ONLY
ADD EQUIPMENT
====================================================
*/

router.post("/", requireManager, (req, res) => {

  const {
    code,
    name,
    category,
    department,
    serial_number,
    notes
  } = req.body || {};

  /*
  ==================================================
  REQUIRED FIELDS
  ==================================================
  */

  if (
    !code ||
    !name ||
    !category ||
    !department
  ) {
    return res.status(400).json({
      error:
        "Code, name, category, and department are required"
    });
  }

  /*
  ==================================================
  VALIDATE DEPARTMENT
  ==================================================
  */

  if (
    !ALLOWED_DEPARTMENTS.includes(
      department
    )
  ) {
    return res.status(400).json({
      error:
        "Department must be IT, post production, or social media"
    });
  }

  /*
  ==================================================
  SERIAL NUMBER VALIDATION
  ==================================================
  */

  if (
    SERIAL_REQUIRED_DEPARTMENTS.includes(
      department
    ) &&
    !serial_number
  ) {
    return res.status(400).json({
      error:
        "A serial number is required for IT and Social Media equipment"
    });
  }

  /*
  ==================================================
  CHECK EQUIPMENT CODE
  ==================================================
  */

  const exists = db
    .prepare(`
      SELECT id
      FROM equipment
      WHERE code = ?
    `)
    .get(code.trim());

  if (exists) {
    return res.status(409).json({
      error:
        "An item with that ID/code already exists"
    });
  }

  /*
  ==================================================
  CHECK SERIAL NUMBER
  ==================================================
  */

  if (serial_number) {

    const existingSerial = db
      .prepare(`
        SELECT id
        FROM equipment
        WHERE serial_number = ?
      `)
      .get(
        serial_number.trim()
      );

    if (existingSerial) {
      return res.status(409).json({
        error:
          "An equipment item with that serial number already exists"
      });
    }
  }

  /*
  ==================================================
  CREATE EQUIPMENT
  ==================================================
  */

  const info = db
    .prepare(`
      INSERT INTO equipment (
        code,
        name,
        category,
        department,
        serial_number,
        status,
        notes
      )
      VALUES (
        ?,
        ?,
        ?,
        ?,
        ?,
        'available',
        ?
      )
    `)
    .run(
      code.trim(),
      name.trim(),
      category.trim(),
      department,
      serial_number
        ? serial_number.trim()
        : null,
      notes
        ? notes.trim()
        : null
    );

  /*
  ==================================================
  GET CREATED ITEM
  ==================================================
  */

  const item = db
    .prepare(`
      SELECT *
      FROM equipment
      WHERE id = ?
    `)
    .get(
      info.lastInsertRowid
    );

  res.status(201).json({
    item
  });
});

/*
====================================================
UPDATE EQUIPMENT DETAILS
====================================================
*/

router.patch("/:id", requireManager, (req, res) => {

  const {
    code,
    name,
    category,
    department,
    serial_number,
    notes
  } = req.body || {};

  const item = db
    .prepare(`
      SELECT *
      FROM equipment
      WHERE id = ?
    `)
    .get(req.params.id);

  if (!item) {
    return res.status(404).json({
      error:
        "Equipment not found"
    });
  }

  /*
  ==================================================
  DETERMINE NEW VALUES
  ==================================================
  */

  const newDepartment =
    department || item.department;

  const newSerialNumber =
    serial_number !== undefined
      ? (
          serial_number
            ? serial_number.trim()
            : null
        )
      : item.serial_number;

  /*
  ==================================================
  VALIDATE DEPARTMENT
  ==================================================
  */

  if (
    !ALLOWED_DEPARTMENTS.includes(
      newDepartment
    )
  ) {
    return res.status(400).json({
      error:
        "Department must be IT, post production, or social media"
    });
  }

  /*
  ==================================================
  SERIAL REQUIRED
  ==================================================
  */

  if (
    SERIAL_REQUIRED_DEPARTMENTS.includes(
      newDepartment
    ) &&
    !newSerialNumber
  ) {
    return res.status(400).json({
      error:
        "A serial number is required for IT and Social Media equipment"
    });
  }

  /*
  ==================================================
  CHECK CODE
  ==================================================
  */

  const newCode =
    code
      ? code.trim()
      : item.code;

  if (newCode !== item.code) {

    const existingCode = db
      .prepare(`
        SELECT id
        FROM equipment
        WHERE code = ?
        AND id != ?
      `)
      .get(
        newCode,
        item.id
      );

    if (existingCode) {
      return res.status(409).json({
        error:
          "An item with that ID/code already exists"
      });
    }
  }

  /*
  ==================================================
  CHECK SERIAL
  ==================================================
  */

  if (newSerialNumber) {

    const existingSerial = db
      .prepare(`
        SELECT id
        FROM equipment
        WHERE serial_number = ?
        AND id != ?
      `)
      .get(
        newSerialNumber,
        item.id
      );

    if (existingSerial) {
      return res.status(409).json({
        error:
          "An equipment item with that serial number already exists"
      });
    }
  }

  /*
  ==================================================
  UPDATE
  ==================================================
  */

  db.prepare(`
    UPDATE equipment
    SET
      code = ?,
      name = ?,
      category = ?,
      department = ?,
      serial_number = ?,
      notes = ?
    WHERE id = ?
  `).run(

    newCode,

    name
      ? name.trim()
      : item.name,

    category
      ? category.trim()
      : item.category,

    newDepartment,

    newSerialNumber,

    notes !== undefined
      ? (
          notes
            ? notes.trim()
            : null
        )
      : item.notes,

    item.id
  );

  /*
  ==================================================
  RETURN UPDATED ITEM
  ==================================================
  */

  const updatedItem = db
    .prepare(`
      SELECT *
      FROM equipment
      WHERE id = ?
    `)
    .get(item.id);

  res.json({
    item: updatedItem
  });
});

/*
====================================================
MANAGER ONLY
CHANGE EQUIPMENT STATUS
====================================================
*/

router.patch(
  "/:id/status",
  requireManager,
  (req, res) => {

    const {
      status
    } = req.body || {};

    if (
      ![
        "available",
        "booked",
        "repair"
      ].includes(status)
    ) {
      return res.status(400).json({
        error:
          "Status must be available, booked, or repair"
      });
    }

    const item = db
      .prepare(`
        SELECT *
        FROM equipment
        WHERE id = ?
      `)
      .get(req.params.id);

    if (!item) {
      return res.status(404).json({
        error:
          "Equipment not found"
      });
    }

    db.prepare(`
      UPDATE equipment
      SET status = ?
      WHERE id = ?
    `).run(
      status,
      req.params.id
    );

    res.json({
      item:
        db
          .prepare(`
            SELECT *
            FROM equipment
            WHERE id = ?
          `)
          .get(req.params.id)
    });
  }
);

/*
====================================================
MANAGER ONLY
DELETE EQUIPMENT
====================================================
*/

router.delete(
  "/:id",
  requireManager,
  (req, res) => {

    const item = db
      .prepare(`
        SELECT *
        FROM equipment
        WHERE id = ?
      `)
      .get(req.params.id);

    if (!item) {
      return res.status(404).json({
        error:
          "Equipment not found"
      });
    }

    /*
    --------------------------------------------------
    CHECK ACTIVE BOOKINGS
    --------------------------------------------------
    */

    const activeBooking = db
      .prepare(`
        SELECT id
        FROM bookings
        WHERE equipment_id = ?
        AND status IN (
          'pending',
          'accepted'
        )
      `)
      .get(req.params.id);

    if (activeBooking) {
      return res.status(409).json({
        error:
          "Can't delete equipment with a pending or active booking"
      });
    }

    /*
    --------------------------------------------------
    DELETE
    --------------------------------------------------
    */

    db.prepare(`
      DELETE FROM equipment
      WHERE id = ?
    `).run(req.params.id);

    res.json({
      ok: true
    });
  }
);

module.exports = router;