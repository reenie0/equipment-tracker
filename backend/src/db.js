const Database = require("better-sqlite3");
const bcrypt = require("bcryptjs");
const path = require("path");
const fs = require("fs");

const DATA_DIR = path.join(__dirname, "..", "data");

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const db = new Database(
  path.join(DATA_DIR, "equipment.db")
);

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

/*
====================================================
CREATE EQUIPMENT TABLE
====================================================
*/

db.exec(`
  CREATE TABLE IF NOT EXISTS equipment (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    status TEXT NOT NULL
      CHECK (status IN ('available', 'booked', 'repair'))
      DEFAULT 'available',
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

/*
====================================================
CREATE BOOKINGS TABLE
====================================================
*/

db.exec(`
  CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    equipment_id INTEGER NOT NULL
      REFERENCES equipment(id)
      ON DELETE CASCADE,
    requester_id INTEGER NOT NULL
      REFERENCES users(id)
      ON DELETE CASCADE,
    requester_name TEXT NOT NULL,
    purpose TEXT NOT NULL,
    duration_hours REAL NOT NULL,
    status TEXT NOT NULL
      CHECK (
        status IN (
          'pending',
          'accepted',
          'rejected',
          'completed'
        )
      )
      DEFAULT 'pending',
    gate_pass_code TEXT,
    requested_at TEXT NOT NULL DEFAULT (datetime('now')),
    decided_at TEXT,
    expires_at TEXT,
    manager_note TEXT
  );
`);

/*
====================================================
USERS TABLE
====================================================
*/

const usersTable = db
  .prepare(`
    SELECT name, sql
    FROM sqlite_master
    WHERE type = 'table'
    AND name = 'users'
  `)
  .get();

/*
====================================================
CREATE USERS TABLE IF IT DOES NOT EXIST
====================================================
*/

if (!usersTable) {

  db.exec(`
    CREATE TABLE users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'staff',
      active INTEGER NOT NULL DEFAULT 1,
      must_change_password INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  console.log("✅ Users table created.");

}

/*
====================================================
MIGRATE EXISTING USERS TABLE
====================================================
*/

else {

  const columns = db
    .prepare("PRAGMA table_info(users)")
    .all();

  const hasActiveColumn = columns.some(
    column => column.name === "active"
  );

  const hasMustChangePasswordColumn = columns.some(
    column => column.name === "must_change_password"
  );

  const usersTableSql = usersTable.sql || "";

  const hasOldRoleConstraint =
    usersTableSql.includes("'user'") &&
    usersTableSql.includes("'manager'") &&
    usersTableSql.includes("CHECK");

  /*
  --------------------------------------------------
  MIGRATE OLD ROLE STRUCTURE
  --------------------------------------------------
  */

  if (hasOldRoleConstraint) {

    console.log("🔄 Migrating users table...");

    db.pragma("foreign_keys = OFF");

    db.exec(`
      CREATE TABLE users_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'staff',
        active INTEGER NOT NULL DEFAULT 1,
        must_change_password INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      INSERT INTO users_new (
        id,
        name,
        username,
        password_hash,
        role,
        active,
        must_change_password,
        created_at
      )
      SELECT
        id,
        name,
        username,
        password_hash,
        CASE
          WHEN role = 'user' THEN 'staff'
          ELSE role
        END,
        1,
        0,
        created_at
      FROM users;

      DROP TABLE users;

      ALTER TABLE users_new
      RENAME TO users;
    `);

    db.pragma("foreign_keys = ON");

    console.log("✅ Users table migration complete.");

  }

  /*
  --------------------------------------------------
  ADD ACTIVE COLUMN
  --------------------------------------------------
  */

  else if (!hasActiveColumn) {

    console.log("🔄 Adding active column...");

    db.exec(`
      ALTER TABLE users
      ADD COLUMN active INTEGER NOT NULL DEFAULT 1
    `);

    console.log("✅ Active column added.");

  }

  /*
  --------------------------------------------------
  ADD PASSWORD CHANGE COLUMN
  --------------------------------------------------
  */

  if (!hasMustChangePasswordColumn && !hasOldRoleConstraint) {

    console.log("🔄 Adding must_change_password column...");

    db.exec(`
      ALTER TABLE users
      ADD COLUMN must_change_password INTEGER NOT NULL DEFAULT 0
    `);

    console.log("✅ Password-change column added.");

  }

}

/*
====================================================
CONVERT OLD USER ROLE
====================================================
*/

db.prepare(`
  UPDATE users
  SET role = 'staff'
  WHERE role = 'user'
`).run();

/*
====================================================
SEED DEFAULT USERS
====================================================
*/

const userCount = db
  .prepare("SELECT COUNT(*) AS c FROM users")
  .get().c;

if (userCount === 0) {

  const insertUser = db.prepare(`
    INSERT INTO users (
      name,
      username,
      password_hash,
      role,
      active,
      must_change_password
    )
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  /*
  --------------------------------------------------
  SUPER USER
  --------------------------------------------------
  */

  insertUser.run(
    "System Administrator",
    "superadmin",
    bcrypt.hashSync("admin123", 10),
    "superuser",
    1,
    0
  );

  /*
  --------------------------------------------------
  MANAGER
  --------------------------------------------------
  */

  insertUser.run(
    "Site Manager",
    "manager",
    bcrypt.hashSync("manager123", 10),
    "manager",
    1,
    0
  );

  /*
  --------------------------------------------------
  STAFF
  --------------------------------------------------
  */

  insertUser.run(
    "Demo User",
    "user",
    bcrypt.hashSync("user123", 10),
    "staff",
    1,
    0
  );

  console.log("✅ Default users created.");

}

/*
====================================================
SEED EQUIPMENT
====================================================
*/

const equipmentCount = db
  .prepare("SELECT COUNT(*) AS c FROM equipment")
  .get().c;

if (equipmentCount === 0) {

  const insertEq = db.prepare(`
    INSERT INTO equipment (
      code,
      name,
      category,
      status
    )
    VALUES (?, ?, ?, ?)
  `);

  const starter = [
    ["EQ-1001", "Cordless Drill", "Power Tools", "available"],
    ["EQ-1002", "Angle Grinder", "Power Tools", "available"],
    ["EQ-1003", "Safety Harness", "Safety Gear", "available"],
    ["EQ-1004", "Generator 5kVA", "Heavy Equipment", "repair"],
    ["EQ-1005", "Extension Ladder 6m", "Access Equipment", "available"]
  ];

  for (const row of starter) {
    insertEq.run(...row);
  }

  console.log("✅ Starter equipment created.");

}

/*
====================================================
EXPORT DATABASE
====================================================
*/

module.exports = db;