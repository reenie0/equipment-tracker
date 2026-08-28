
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const db = require("../db");

const {
  JWT_SECRET,
  requireAuth
} = require("../middleware/auth");

const router = express.Router();

/*
====================================================
VALIDATION LIMITS
====================================================
*/

const MIN_PASSWORD_LENGTH = 6;
const MAX_PASSWORD_LENGTH = 72;
const MAX_NAME_LENGTH = 100;
const MAX_USERNAME_LENGTH = 30;

/*
====================================================
CREATE JWT
====================================================
*/

function signToken(user) {
  return jwt.sign(
    {
      id: user.id,
      name: user.name,
      username: user.username,
      role: user.role,
      must_change_password: Boolean(
        user.must_change_password
      )
    },
    JWT_SECRET,
    {
      expiresIn: "12h"
    }
  );
}

/*
====================================================
FORMAT USER
====================================================
*/

function formatUser(user) {
  return {
    id: user.id,
    name: user.name,
    username: user.username,
    role: user.role,
    active: Boolean(user.active),
    must_change_password: Boolean(
      user.must_change_password
    )
  };
}

/*
====================================================
REGISTER STAFF
====================================================

This route is for normal staff registration.

Accounts created here use the password supplied
during registration and DO NOT require a forced
password change.

Super Users should use /api/users to create
managed accounts.
====================================================
*/

router.post("/register", (req, res) => {
  const {
    name,
    username,
    password
  } = req.body || {};

  /*
  --------------------------------------------------
  REQUIRED FIELDS
  --------------------------------------------------
  */

  if (!name || !username || !password) {
    return res.status(400).json({
      error:
        "Name, username, and password are required"
    });
  }

  /*
  --------------------------------------------------
  TRIM NAME AND USERNAME
  --------------------------------------------------
  */

  const cleanName = name.trim();
  const cleanUsername = username.trim();

  if (!cleanName) {
    return res.status(400).json({
      error: "Name cannot be empty"
    });
  }

  if (!cleanUsername) {
    return res.status(400).json({
      error: "Username cannot be empty"
    });
  }

  /*
  --------------------------------------------------
  NAME LENGTH
  --------------------------------------------------
  */

  if (cleanName.length > MAX_NAME_LENGTH) {
    return res.status(400).json({
      error:
        `Name must not exceed ${MAX_NAME_LENGTH} characters`
    });
  }

  /*
  --------------------------------------------------
  USERNAME LENGTH
  --------------------------------------------------
  */

  if (
    cleanUsername.length >
    MAX_USERNAME_LENGTH
  ) {
    return res.status(400).json({
      error:
        `Username must not exceed ${MAX_USERNAME_LENGTH} characters`
    });
  }

  /*
  --------------------------------------------------
  PASSWORD LENGTH
  --------------------------------------------------
  */

  if (
    password.length <
    MIN_PASSWORD_LENGTH
  ) {
    return res.status(400).json({
      error:
        `Password must be at least ${MIN_PASSWORD_LENGTH} characters`
    });
  }

  if (
    password.length >
    MAX_PASSWORD_LENGTH
  ) {
    return res.status(400).json({
      error:
        `Password must not exceed ${MAX_PASSWORD_LENGTH} characters`
    });
  }

  /*
  --------------------------------------------------
  CHECK USERNAME
  --------------------------------------------------
  */

  const existing = db
    .prepare(`
      SELECT id
      FROM users
      WHERE username = ?
    `)
    .get(cleanUsername);

  if (existing) {
    return res.status(409).json({
      error:
        "That username is already taken"
    });
  }

  /*
  --------------------------------------------------
  HASH PASSWORD
  --------------------------------------------------
  */

  const hash =
    bcrypt.hashSync(password, 10);

  /*
  --------------------------------------------------
  CREATE STAFF USER
  --------------------------------------------------
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
      VALUES (?, ?, ?, 'staff', 1, 0)
    `)
    .run(
      cleanName,
      cleanUsername,
      hash
    );

  /*
  --------------------------------------------------
  GET CREATED USER
  --------------------------------------------------
  */

  const user = db
    .prepare(`
      SELECT *
      FROM users
      WHERE id = ?
    `)
    .get(info.lastInsertRowid);

  /*
  --------------------------------------------------
  CREATE TOKEN
  --------------------------------------------------
  */

  const token = signToken(user);

  /*
  --------------------------------------------------
  RESPONSE
  --------------------------------------------------
  */

  res.status(201).json({
    token,
    user: formatUser(user)
  });
});

/*
====================================================
LOGIN
====================================================
*/

router.post("/login", (req, res) => {
  const {
    username,
    password
  } = req.body || {};

  /*
  --------------------------------------------------
  REQUIRED FIELDS
  --------------------------------------------------
  */

  if (!username || !password) {
    return res.status(400).json({
      error:
        "Username and password are required"
    });
  }

  /*
  --------------------------------------------------
  USERNAME LENGTH
  --------------------------------------------------
  */

  if (
    username.trim().length >
    MAX_USERNAME_LENGTH
  ) {
    return res.status(400).json({
      error:
        `Username must not exceed ${MAX_USERNAME_LENGTH} characters`
    });
  }

  /*
  --------------------------------------------------
  PASSWORD LENGTH
  --------------------------------------------------
  */

  if (
    password.length >
    MAX_PASSWORD_LENGTH
  ) {
    return res.status(400).json({
      error:
        `Password must not exceed ${MAX_PASSWORD_LENGTH} characters`
    });
  }

  const cleanUsername =
    username.trim();

  /*
  --------------------------------------------------
  FIND USER
  --------------------------------------------------
  */

  const user = db
    .prepare(`
      SELECT *
      FROM users
      WHERE username = ?
    `)
    .get(cleanUsername);

  /*
  --------------------------------------------------
  CHECK PASSWORD
  --------------------------------------------------
  */

  if (
    !user ||
    !bcrypt.compareSync(
      password,
      user.password_hash
    )
  ) {
    return res.status(401).json({
      error:
        "Incorrect username or password"
    });
  }

  /*
  --------------------------------------------------
  CHECK ACCOUNT STATUS
  --------------------------------------------------
  */

  if (!user.active) {
    return res.status(403).json({
      error:
        "Your account is inactive. Please contact an administrator."
    });
  }

  /*
  --------------------------------------------------
  CREATE TOKEN
  --------------------------------------------------
  */

  const token = signToken(user);

  /*
  --------------------------------------------------
  LOGIN RESPONSE
  --------------------------------------------------
  */

  res.json({
    token,
    user: formatUser(user),
    must_change_password:
      Boolean(user.must_change_password)
  });
});

/*
====================================================
CURRENT USER
====================================================
*/

router.get(
  "/me",
  requireAuth,
  (req, res) => {

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
      .get(req.user.id);

    if (!user) {
      return res.status(404).json({
        error: "User not found"
      });
    }

    /*
    ----------------------------------------------
    CHECK ACCOUNT STATUS
    ----------------------------------------------
    */

    if (!user.active) {
      return res.status(403).json({
        error:
          "Account is inactive"
      });
    }

    res.json({
      user: formatUser(user)
    });
  }
);

/*
====================================================
CHANGE PASSWORD
====================================================

Any logged-in user can change their password.

This is required when:
must_change_password = 1
====================================================
*/

router.post(
  "/change-password",
  requireAuth,
  (req, res) => {

    const {
      current_password,
      new_password
    } = req.body || {};

    /*
    ------------------------------------------------
    REQUIRED FIELDS
    ------------------------------------------------
    */

    if (
      !current_password ||
      !new_password
    ) {
      return res.status(400).json({
        error:
          "Current password and new password are required"
      });
    }

    /*
    ------------------------------------------------
    NEW PASSWORD LENGTH
    ------------------------------------------------
    */

    if (
      new_password.length <
      MIN_PASSWORD_LENGTH
    ) {
      return res.status(400).json({
        error:
          `New password must be at least ${MIN_PASSWORD_LENGTH} characters`
      });
    }

    if (
      new_password.length >
      MAX_PASSWORD_LENGTH
    ) {
      return res.status(400).json({
        error:
          `New password must not exceed ${MAX_PASSWORD_LENGTH} characters`
      });
    }

    /*
    ------------------------------------------------
    CURRENT / NEW PASSWORD
    ------------------------------------------------
    */

    if (
      current_password ===
      new_password
    ) {
      return res.status(400).json({
        error:
          "New password must be different from your current password"
      });
    }

    /*
    ------------------------------------------------
    GET USER
    ------------------------------------------------
    */

    const user = db
      .prepare(`
        SELECT *
        FROM users
        WHERE id = ?
      `)
      .get(req.user.id);

    if (!user) {
      return res.status(404).json({
        error: "User not found"
      });
    }

    /*
    ------------------------------------------------
    CHECK ACCOUNT
    ------------------------------------------------
    */

    if (!user.active) {
      return res.status(403).json({
        error:
          "Your account is inactive"
      });
    }

    /*
    ------------------------------------------------
    VERIFY CURRENT PASSWORD
    ------------------------------------------------
    */

    const passwordCorrect =
      bcrypt.compareSync(
        current_password,
        user.password_hash
      );

    if (!passwordCorrect) {
      return res.status(401).json({
        error:
          "Current password is incorrect"
      });
    }

    /*
    ------------------------------------------------
    HASH NEW PASSWORD
    ------------------------------------------------
    */

    const newPasswordHash =
      bcrypt.hashSync(
        new_password,
        10
      );

    /*
    ------------------------------------------------
    UPDATE PASSWORD
    ------------------------------------------------

    Setting must_change_password to 0 means
    the temporary-password requirement is complete.
    ------------------------------------------------
    */

    db.prepare(`
      UPDATE users
      SET
        password_hash = ?,
        must_change_password = 0
      WHERE id = ?
    `).run(
      newPasswordHash,
      user.id
    );

    /*
    ------------------------------------------------
    GET UPDATED USER
    ------------------------------------------------
    */

    const updatedUser = db
      .prepare(`
        SELECT *
        FROM users
        WHERE id = ?
      `)
      .get(user.id);

    /*
    ------------------------------------------------
    ISSUE NEW TOKEN
    ------------------------------------------------

    The old JWT may contain
    must_change_password = true.

    We issue a fresh token containing false.
    ------------------------------------------------
    */

    const newToken =
      signToken(updatedUser);

    /*
    ------------------------------------------------
    RESPONSE
    ------------------------------------------------
    */

    res.json({
      success: true,

      message:
        "Password changed successfully",

      token: newToken,

      user:
        formatUser(updatedUser),

      must_change_password:
        false
    });
  }
);

/*
====================================================
LOGOUT
====================================================

JWT authentication is stateless, so logout is
handled by the frontend by removing the token.
====================================================
*/

/*
====================================================
EXPORT
====================================================
*/

module.exports = router;

