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
      must_change_password: Boolean(user.must_change_password)
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
    must_change_password: Boolean(user.must_change_password)
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

  if (!name || !username || !password) {
    return res.status(400).json({
      error: "Name, username, and password are required"
    });
  }

  if (password.length < 6) {
    return res.status(400).json({
      error: "Password must be at least 6 characters"
    });
  }

  const existing = db
    .prepare(`
      SELECT id
      FROM users
      WHERE username = ?
    `)
    .get(username);

  if (existing) {
    return res.status(409).json({
      error: "That username is already taken"
    });
  }

  const hash = bcrypt.hashSync(password, 10);

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
      name,
      username,
      hash
    );

  const user = db
    .prepare(`
      SELECT *
      FROM users
      WHERE id = ?
    `)
    .get(info.lastInsertRowid);

  const token = signToken(user);

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

  if (!username || !password) {
    return res.status(400).json({
      error: "Username and password are required"
    });
  }

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
    .get(username);

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
      error: "Incorrect username or password"
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

  The frontend can use must_change_password
  to redirect the user to the password-change page.
  --------------------------------------------------
  */

  res.json({
    token,
    user: formatUser(user),
    must_change_password: Boolean(
      user.must_change_password
    )
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
        error: "Account is inactive"
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
    VALIDATION
    ------------------------------------------------
    */

    if (!current_password || !new_password) {
      return res.status(400).json({
        error:
          "Current password and new password are required"
      });
    }

    if (new_password.length < 6) {
      return res.status(400).json({
        error:
          "New password must be at least 6 characters"
      });
    }

    if (current_password === new_password) {
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
        error: "Your account is inactive"
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
        error: "Current password is incorrect"
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

    Important: the old JWT may contain
    must_change_password = true.

    We issue a fresh token containing false.
    ------------------------------------------------
    */

    const newToken =
      signToken(updatedUser);

    res.json({
      success: true,
      message:
        "Password changed successfully",

      token: newToken,

      user: formatUser(updatedUser),

      must_change_password: false
    });
  }
);

/*
====================================================
LOGOUT

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