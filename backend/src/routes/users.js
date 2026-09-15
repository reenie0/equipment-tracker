const express = require("express");
const bcrypt = require("bcryptjs");

const db = require("../db");

const {
  requireAuth,
  requireSuperUser,
} = require("../middleware/auth");

const router = express.Router();


/* ==================================================
   USER DEPARTMENTS

   These are the ONLY departments allowed
   for users.
   ================================================== */

const ALLOWED_DEPARTMENTS = [
  "Post Production",
  "Production",
  "Transmission",
  "IT",
  "Newsroom Creatives",
  "Admin",
  "Social Media",
  "Security",
  "Programming",
];


/* ==================================================
   DEFAULT TEMPORARY PASSWORD

   Used both when creating a new user and when a
   superuser resets an existing user's password.
   The user must change it at next login.
   ================================================== */

const DEFAULT_TEMPORARY_PASSWORD = "diamond01";


/* ==================================================
   ROUTER SECURITY

   Everything in this route requires authentication
   and superuser privileges.
   ================================================== */

router.use(requireAuth);
router.use(requireSuperUser);


/* ==================================================
   GET ALL USERS
   ================================================== */

router.get("/", (req, res) => {

  try {

    const users = db
      .prepare(`
        SELECT
          id,
          first_name,
          last_name,
          username,
          role,
          department,
          active,
          must_change_password,
          created_at
        FROM users
        ORDER BY created_at DESC
      `)
      .all();

    return res.json({
      users,
    });

  } catch (err) {

    console.error(
      "List users error:",
      err
    );

    return res.status(500).json({
      error:
        "Unable to load users.",
    });
  }
});


/* ==================================================
   GET ONE USER
   ================================================== */

router.get("/:id", (req, res) => {

  try {

    const user =
      db
        .prepare(`
          SELECT
            id,
            first_name,
            last_name,
            username,
            role,
            department,
            active,
            must_change_password,
            created_at
          FROM users
          WHERE id = ?
        `)
        .get(req.params.id);

    if (!user) {

      return res.status(404).json({
        error:
          "User not found.",
      });
    }

    return res.json({
      user,
    });

  } catch (err) {

    console.error(
      "Get user error:",
      err
    );

    return res.status(500).json({
      error:
        "Unable to load user.",
    });
  }
});


/* ==================================================
   CREATE USER

   New users receive the default temporary
   password. They must change it at first login.
   ================================================== */

router.post("/", (req, res) => {

  const {
    first_name,
    last_name,
    username,
    role = "staff",
    department,
  } = req.body;


  if (!first_name?.trim()) {

    return res.status(400).json({
      error:
        "First name is required.",
    });
  }


  if (!last_name?.trim()) {

    return res.status(400).json({
      error:
        "Last name is required.",
    });
  }


  if (!username?.trim()) {

    return res.status(400).json({
      error:
        "Username is required.",
    });
  }


  if (!department) {

    return res.status(400).json({
      error:
        "Department is required.",
    });
  }


  if (
    !ALLOWED_DEPARTMENTS.includes(
      department
    )
  ) {

    return res.status(400).json({
      error:
        "Invalid department.",
    });
  }


  const allowedRoles = [
    "staff",
    "manager",
    "superuser",
  ];


  if (
    !allowedRoles.includes(
      role
    )
  ) {

    return res.status(400).json({
      error:
        "Invalid role.",
    });
  }


  try {

    const existing =
      db
        .prepare(`
          SELECT id
          FROM users
          WHERE LOWER(username) = LOWER(?)
        `)
        .get(
          username.trim()
        );


    if (existing) {

      return res.status(409).json({
        error:
          "Username already exists.",
      });
    }


    const passwordHash =
      bcrypt.hashSync(
        DEFAULT_TEMPORARY_PASSWORD,
        10
      );


    const result =
      db
        .prepare(`
          INSERT INTO users (
            first_name,
            last_name,
            username,
            password_hash,
            role,
            department,
            active,
            must_change_password
          )
          VALUES (?, ?, ?, ?, ?, ?, 1, 1)
        `)
        .run(
          first_name.trim(),
          last_name.trim(),
          username.trim(),
          passwordHash,
          role,
          department
        );


    const user =
      db
        .prepare(`
          SELECT
            id,
            first_name,
            last_name,
            username,
            role,
            department,
            active,
            must_change_password,
            created_at
          FROM users
          WHERE id = ?
        `)
        .get(
          result.lastInsertRowid
        );


    return res.status(201).json({
      user,
      temporary_password:
        DEFAULT_TEMPORARY_PASSWORD,
    });

  } catch (err) {

    console.error(
      "Create user error:",
      err
    );

    return res.status(500).json({
      error:
        "Unable to create user.",
    });
  }
});


/* ==================================================
   EDIT USER

   Editable fields:
   - first_name
   - last_name
   - username
   - department

   Password is handled separately.
   Role is handled separately.
   Status is handled separately.
   ================================================== */

router.patch("/:id", (req, res) => {

  const {
    first_name,
    last_name,
    username,
    department,
  } = req.body;


  try {

    const existing =
      db
        .prepare(`
          SELECT *
          FROM users
          WHERE id = ?
        `)
        .get(
          req.params.id
        );


    if (!existing) {

      return res.status(404).json({
        error:
          "User not found.",
      });
    }


    const newFirstName =
      first_name !== undefined
        ? first_name.trim()
        : existing.first_name;


    const newLastName =
      last_name !== undefined
        ? last_name.trim()
        : existing.last_name;


    const newUsername =
      username !== undefined
        ? username.trim()
        : existing.username;


    const newDepartment =
      department !== undefined
        ? department
        : existing.department;


    if (!newFirstName) {

      return res.status(400).json({
        error:
          "First name is required.",
      });
    }


    if (!newLastName) {

      return res.status(400).json({
        error:
          "Last name is required.",
      });
    }


    if (!newUsername) {

      return res.status(400).json({
        error:
          "Username is required.",
      });
    }


    if (
      !newDepartment
    ) {

      return res.status(400).json({
        error:
          "Department is required.",
      });
    }


    if (
      !ALLOWED_DEPARTMENTS.includes(
        newDepartment
      )
    ) {

      return res.status(400).json({
        error:
          "Invalid department.",
      });
    }


    /*
    Make sure another user isn't
    already using this username.
    */

    const duplicate =
      db
        .prepare(`
          SELECT id
          FROM users
          WHERE LOWER(username) = LOWER(?)
          AND id != ?
        `)
        .get(
          newUsername,
          req.params.id
        );


    if (duplicate) {

      return res.status(409).json({
        error:
          "Username already exists.",
      });
    }


    db
      .prepare(`
        UPDATE users
        SET
          first_name = ?,
          last_name = ?,
          username = ?,
          department = ?
        WHERE id = ?
      `)
      .run(
        newFirstName,
        newLastName,
        newUsername,
        newDepartment,
        req.params.id
      );


    const user =
      db
        .prepare(`
          SELECT
            id,
            first_name,
            last_name,
            username,
            role,
            department,
            active,
            must_change_password,
            created_at
          FROM users
          WHERE id = ?
        `)
        .get(
          req.params.id
        );


    return res.json({
      user,
    });

  } catch (err) {

    console.error(
      "Update user error:",
      err
    );

    return res.status(500).json({
      error:
        "Unable to update user.",
    });
  }
});


/* ==================================================
   CHANGE USER ROLE
   ================================================== */

router.patch(
  "/:id/role",
  (req, res) => {

    const {
      role,
    } = req.body;


    const allowedRoles = [
      "staff",
      "manager",
      "superuser",
    ];


    if (
      !allowedRoles.includes(
        role
      )
    ) {

      return res.status(400).json({
        error:
          "Invalid role.",
      });
    }


    /*
    Prevent a superuser from
    removing their own superuser
    privileges.
    */

    if (
      String(req.user.id) ===
        String(req.params.id) &&
      role !== "superuser"
    ) {

      return res.status(400).json({
        error:
          "You cannot remove your own superuser role.",
      });
    }


    try {

      const existing =
        db
          .prepare(`
            SELECT id
            FROM users
            WHERE id = ?
          `)
          .get(
            req.params.id
          );


      if (!existing) {

        return res.status(404).json({
          error:
            "User not found.",
        });
      }


      db
        .prepare(`
          UPDATE users
          SET role = ?
          WHERE id = ?
        `)
        .run(
          role,
          req.params.id
        );


      const user =
        db
          .prepare(`
            SELECT
              id,
              first_name,
              last_name,
              username,
              role,
              department,
              active,
              must_change_password,
              created_at
            FROM users
            WHERE id = ?
          `)
          .get(
            req.params.id
          );


      return res.json({
        user,
      });

    } catch (err) {

      console.error(
        "Change role error:",
        err
      );

      return res.status(500).json({
        error:
          "Unable to update user role.",
      });
    }
  }
);


/* ==================================================
   ACTIVATE / DEACTIVATE USER
   ================================================== */

router.patch(
  "/:id/status",
  (req, res) => {

    const {
      active,
    } = req.body;


    if (
      typeof active !==
      "boolean"
    ) {

      return res.status(400).json({
        error:
          "Active status must be true or false.",
      });
    }


    /*
    Prevent a superuser from
    deactivating themselves.
    */

    if (
      String(req.user.id) ===
        String(req.params.id) &&
      active === false
    ) {

      return res.status(400).json({
        error:
          "You cannot deactivate your own account.",
      });
    }


    try {

      const existing =
        db
          .prepare(`
            SELECT id
            FROM users
            WHERE id = ?
          `)
          .get(
            req.params.id
          );


      if (!existing) {

        return res.status(404).json({
          error:
            "User not found.",
        });
      }


      db
        .prepare(`
          UPDATE users
          SET active = ?
          WHERE id = ?
        `)
        .run(
          active ? 1 : 0,
          req.params.id
        );


      const user =
        db
          .prepare(`
            SELECT
              id,
              first_name,
              last_name,
              username,
              role,
              department,
              active,
              must_change_password,
              created_at
            FROM users
            WHERE id = ?
          `)
          .get(
            req.params.id
          );


      return res.json({
        user,
      });

    } catch (err) {

      console.error(
        "Change status error:",
        err
      );

      return res.status(500).json({
        error:
          "Unable to update user status.",
      });
    }
  }
);


/* ==================================================
   RESET USER PASSWORD
   ==================================================

   Always resets to the fixed default temporary
   password (DEFAULT_TEMPORARY_PASSWORD) — the
   admin no longer types a password here. The user
   must change it at next login.
   ================================================== */

router.patch(
  "/:id/password",
  (req, res) => {

    try {

      const existing =
        db
          .prepare(`
            SELECT id
            FROM users
            WHERE id = ?
          `)
          .get(
            req.params.id
          );


      if (!existing) {

        return res.status(404).json({
          error:
            "User not found.",
        });
      }


      const passwordHash =
        bcrypt.hashSync(
          DEFAULT_TEMPORARY_PASSWORD,
          10
        );


      db
        .prepare(`
          UPDATE users
          SET
            password_hash = ?,
            must_change_password = 1
          WHERE id = ?
        `)
        .run(
          passwordHash,
          req.params.id
        );


      return res.json({
        success: true,
        message:
          "Password reset to the default password.",
        temporary_password:
          DEFAULT_TEMPORARY_PASSWORD,
      });

    } catch (err) {

      console.error(
        "Reset password error:",
        err
      );

      return res.status(500).json({
        error:
          "Unable to reset password.",
      });
    }
  }
);


module.exports = router;