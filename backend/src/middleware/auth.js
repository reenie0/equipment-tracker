const jwt = require("jsonwebtoken");

const JWT_SECRET =
  process.env.JWT_SECRET || "change-this-secret-in-production";

/*
====================================================
AUTHENTICATION
====================================================
*/

function requireAuth(req, res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({
      error: "Authentication required"
    });
  }

  const token = header.substring(7);

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    req.user = decoded;

    next();
  } catch (err) {
    return res.status(401).json({
      error: "Invalid or expired token"
    });
  }
}

/*
====================================================
MANAGER ACCESS
====================================================

Managers AND Super Users can access manager
functions.
*/

function requireManager(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      error: "Authentication required"
    });
  }

  const allowedRoles = [
    "manager",
    "superuser"
  ];

  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({
      error: "Manager access required"
    });
  }

  next();
}

/*
====================================================
SUPER USER ACCESS
====================================================

Only Super Users can manage users.
*/

function requireSuperUser(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      error: "Authentication required"
    });
  }

  if (req.user.role !== "superuser") {
    return res.status(403).json({
      error: "Super User access required"
    });
  }

  next();
}

/*
====================================================
EXPORT
====================================================
*/

module.exports = {
  JWT_SECRET,
  requireAuth,
  requireManager,
  requireSuperUser
};