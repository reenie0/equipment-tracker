const express = require("express");
const bcrypt = require("bcryptjs");

const db = require("../db");

const {
  requireAuth,
  requireSuperUser
} = require("../middleware/auth");

const router = express.Router();

/*
====================================================
ALL USER MANAGEMENT ROUTES REQUIRE:
1. LOGIN
2. SUPER USER ROLE
====================================================
*/

router.use(requireAuth);
router.use(requireSuperUser);

/*
====================================================
GET ALL USERS
====================================================
*/

router.get("/", (req, res) => {
  const users = db
    .prepare(`
      SELECT
        id,
        name,
        username,
        role,
        active,
        created_at
      FROM users
      ORDER BY created_at DESC
    `)
    .all();

  res.json({
    users
  });
});

/*
====================================================
GET ONE USER
====================================================
*/

router.get("/:id", (req, res) => {
  const user = db
    .prepare(`
      SELECT
        id,
        name,
        username,
        role,
        active,
        created_at
      FROM users
      WHERE id = ?
    `)
    .get(req.params.id);

  if (!user) {
    return res.status(404).json({
      error: "User not found"
    });
  }

  res.json({
    user
  });
});

/*
====================================================
CREATE USER
====================================================

Only Super Users can create accounts.

Every newly created account receives the
temporary password:

diamond01

The user must change this password when
they first log in.
====================================================
*/

router.post("/", (req, res) => {
  const {
    name,
    username,
    role
  } = req.body || {};

  /*
  ====================================================
  VALIDATION
  ====================================================
  */

  if (!name || !username) {
    return res.status(400).json({
      error: "Name and username are required"
    });
  }

  /*
  ====================================================
  ALLOWED ROLES
  ====================================================
  */

  const allowedRoles = [
    "staff",
    "manager",
    "superuser"
  ];

  const selectedRole = role || "staff";

  if (!allowedRoles.includes(selectedRole)) {
    return res.status(400).json({
      error: "Role must be staff, manager, or superuser"
    });
  }

  /*
  ====================================================
  CHECK USERNAME
  ====================================================
  */

  const existing = db
    .prepare(`
      SELECT id
      FROM users
      WHERE username = ?
    `)
    .get(username.trim());

  if (existing) {
    return res.status(409).json({
      error: "That username is already taken"
    });
  }

  /*
  ====================================================
  DEFAULT PASSWORD
  ====================================================

  Every account created by the Super User
  starts with this temporary password.

  The user MUST change it after first login.
  ====================================================
  */

  const DEFAULT_PASSWORD = "diamond01";

  const passwordHash = bcrypt.hashSync(
    DEFAULT_PASSWORD,
    10
  );

  /*
  ====================================================
  CREATE USER
  ====================================================
  */

  const info = db
    .prepare(`
      INSERT INTO users (
        name,
        username,
        password_hash,
        role,
        active,
        must_change_password
      )
      VALUES (?, ?, ?, ?, 1, 1)
    `)
    .run(
      name.trim(),
      username.trim(),
      passwordHash,
      selectedRole
    );

  /*
  ====================================================
  GET CREATED USER
  ====================================================
  */

  const user = db
    .prepare(`
      SELECT
        id,
        name,
        username,
        role,
        active,
        must_change_password,
        created_at
      FROM users
      WHERE id = ?
    `)
    .get(info.lastInsertRowid);

  /*
  ====================================================
  RESPONSE
  ====================================================
  */

  res.status(201).json({
    user,
    temporary_password: DEFAULT_PASSWORD,
    message:
      "User created successfully. The user must change the temporary password when they first log in."
  });
});

/*
====================================================
UPDATE USER DETAILS
====================================================
*/

router.patch("/:id", (req, res) => {
  const {
    name,
    username
  } = req.body || {};

  const user = db
    .prepare(`
      SELECT *
      FROM users
      WHERE id = ?
    `)
    .get(req.params.id);

  if (!user) {
    return res.status(404).json({
      error: "User not found"
    });
  }

  if (!name && !username) {
    return res.status(400).json({
      error:
        "Name or username is required"
    });
  }

  if (username && username !== user.username) {
    const existing = db
      .prepare(`
        SELECT id
        FROM users
        WHERE username = ?
        AND id != ?
      `)
      .get(
        username,
        user.id
      );

    if (existing) {
      return res.status(409).json({
        error:
          "That username is already taken"
      });
    }
  }

  db.prepare(`
    UPDATE users
    SET
      name = ?,
      username = ?
    WHERE id = ?
  `).run(
    name || user.name,
    username || user.username,
    user.id
  );

  const updatedUser = db
    .prepare(`
      SELECT
        id,
        name,
        username,
        role,
        active,
        created_at
      FROM users
      WHERE id = ?
    `)
    .get(user.id);

  res.json({
    user: updatedUser
  });
});

/*
====================================================
CHANGE USER ROLE
====================================================
*/

router.patch("/:id/role", (req, res) => {
  const {
    role
  } = req.body || {};

  const allowedRoles = [
    "staff",
    "manager",
    "superuser"
  ];

  if (!allowedRoles.includes(role)) {
    return res.status(400).json({
      error:
        "Role must be staff, manager, or superuser"
    });
  }

  const user = db
    .prepare(`
      SELECT *
      FROM users
      WHERE id = ?
    `)
    .get(req.params.id);

  if (!user) {
    return res.status(404).json({
      error: "User not found"
    });
  }

  /*
  Prevent the Super User from accidentally
  removing their own Super User permissions.
  */

  if (
    user.id === req.user.id &&
    role !== "superuser"
  ) {
    return res.status(400).json({
      error:
        "You cannot remove your own Super User role"
    });
  }

  db.prepare(`
    UPDATE users
    SET role = ?
    WHERE id = ?
  `).run(
    role,
    user.id
  );

  const updatedUser = db
    .prepare(`
      SELECT
        id,
        name,
        username,
        role,
        active,
        created_at
      FROM users
      WHERE id = ?
    `)
    .get(user.id);

  res.json({
    user: updatedUser
  });
});

/*
====================================================
ACTIVATE / DEACTIVATE USER
====================================================
*/

router.patch("/:id/status", (req, res) => {
  const {
    active
  } = req.body || {};

  if (
    active !== true &&
    active !== false &&
    active !== 1 &&
    active !== 0
  ) {
    return res.status(400).json({
      error:
        "Active must be true or false"
    });
  }

  const user = db
    .prepare(`
      SELECT *
      FROM users
      WHERE id = ?
    `)
    .get(req.params.id);

  if (!user) {
    return res.status(404).json({
      error: "User not found"
    });
  }

  /*
  Prevent a Super User from deactivating
  their own account.
  */

  if (
    user.id === req.user.id &&
    !Boolean(active)
  ) {
    return res.status(400).json({
      error:
        "You cannot deactivate your own account"
    });
  }

  const activeValue =
    Boolean(active) ? 1 : 0;

  db.prepare(`
    UPDATE users
    SET active = ?
    WHERE id = ?
  `).run(
    activeValue,
    user.id
  );

  const updatedUser = db
    .prepare(`
      SELECT
        id,
        name,
        username,
        role,
        active,
        created_at
      FROM users
      WHERE id = ?
    `)
    .get(user.id);

  res.json({
    user: updatedUser
  });
});

/*
====================================================
RESET USER PASSWORD
====================================================
*/

router.patch("/:id/password", (req, res) => {
  const {
    password
  } = req.body || {};

  if (!password) {
    return res.status(400).json({
      error:
        "New password is required"
    });
  }

  if (password.length < 6) {
    return res.status(400).json({
      error:
        "Password must be at least 6 characters"
    });
  }

  const user = db
    .prepare(`
      SELECT id
      FROM users
      WHERE id = ?
    `)
    .get(req.params.id);

  if (!user) {
    return res.status(404).json({
      error: "User not found"
    });
  }

  const passwordHash =
    bcrypt.hashSync(password, 10);

  db.prepare(`
    UPDATE users
    SET password_hash = ?
    WHERE id = ?
  `).run(
    passwordHash,
    user.id
  );

  res.json({
    success: true,
    message:
      "Password updated successfully"
  });
});

module.exports = router;