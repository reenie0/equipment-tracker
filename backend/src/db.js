const Database = require("better-sqlite3");
const bcrypt = require("bcryptjs");
const path = require("path");
const fs = require("fs");

const DATA_DIR = path.join(__dirname, "..", "data");

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, {
    recursive: true
  });
}

const db = new Database(
  path.join(DATA_DIR, "equipment.db")
);

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");


/*
====================================================
DEPARTMENT DEFINITIONS
====================================================
*/

/*
----------------------------------------------------
USER DEPARTMENTS
----------------------------------------------------

These are the ONLY departments users can have.
----------------------------------------------------
*/

const USER_DEPARTMENTS = [
  "Newsroom",
  "Post Production",
  "Production",
  "Transmission",
  "Marketing",
  "Social Media",
  "IT",
  "Musanza",
  "Security",
  "Administration",
  "Programming",
  "Finance"
];


/*
----------------------------------------------------
EQUIPMENT DEPARTMENTS
----------------------------------------------------

Equipment intentionally uses a separate list.
----------------------------------------------------
*/

const EQUIPMENT_DEPARTMENTS = [
  "Post Production",
  "IT",
  "Social Media"
];


/*
====================================================
HELPERS
====================================================
*/

function tableExists(tableName) {
  const result = db
    .prepare(`
      SELECT name
      FROM sqlite_master
      WHERE type = 'table'
        AND name = ?
    `)
    .get(tableName);

  return !!result;
}


function getTableSql(tableName) {
  const result = db
    .prepare(`
      SELECT sql
      FROM sqlite_master
      WHERE type = 'table'
        AND name = ?
    `)
    .get(tableName);

  return result?.sql || "";
}


function getColumns(tableName) {
  if (!tableExists(tableName)) {
    return [];
  }

  return db
    .prepare(
      `PRAGMA table_info(${tableName})`
    )
    .all();
}


function hasColumn(tableName, columnName) {
  return getColumns(tableName).some(
    column => column.name === columnName
  );
}


/*
====================================================
CLEAN UP FAILED TEMPORARY TABLES
====================================================
*/

if (
  tableExists("users_new") &&
  tableExists("users")
) {
  console.log(
    "⚠️ Removing incomplete users_new migration table..."
  );

  db.pragma("foreign_keys = OFF");

  db.exec(`
    DROP TABLE IF EXISTS users_new;
  `);

  db.pragma("foreign_keys = ON");
}


if (
  tableExists("bookings_new") &&
  tableExists("bookings")
) {
  console.log(
    "⚠️ Removing incomplete bookings_new migration table..."
  );

  db.pragma("foreign_keys = OFF");

  db.exec(`
    DROP TABLE IF EXISTS bookings_new;
  `);

  db.pragma("foreign_keys = ON");
}


/*
====================================================
USERS TABLE
====================================================
*/

if (!tableExists("users")) {

  console.log(
    "🔄 Creating users table..."
  );

  db.exec(`
    CREATE TABLE users (

      id INTEGER PRIMARY KEY AUTOINCREMENT,

      name TEXT NOT NULL,

      username TEXT UNIQUE NOT NULL,

      password_hash TEXT NOT NULL,

      role TEXT NOT NULL

        CHECK (
          role IN (
            'staff',
            'manager',
            'superuser'
          )
        )

        DEFAULT 'staff',

      department TEXT NOT NULL

        CHECK (
          department IN (
            'Newsroom',
            'Post Production',
            'Production',
            'Transmission',
            'Marketing',
            'Social Media',
            'IT',
            'Musanza',
            'Security',
            'Administration',
            'Programming',
            'Finance'
          )
        )

        DEFAULT 'Post Production',

      active INTEGER NOT NULL

        DEFAULT 1,

      must_change_password INTEGER NOT NULL

        DEFAULT 0,

      created_at TEXT NOT NULL

        DEFAULT (datetime('now'))
    );
  `);

  console.log(
    "✅ Users table created."
  );

}


/*
====================================================
MIGRATE EXISTING USERS TABLE
====================================================
*/

else {

  const usersSql =
    getTableSql("users");

  const usersColumns =
    getColumns("users");

  const hasRoleColumn =
    usersColumns.some(
      column => column.name === "role"
    );

  const hasDepartment =
    usersColumns.some(
      column => column.name === "department"
    );

  const hasActive =
    usersColumns.some(
      column => column.name === "active"
    );

  const hasMustChangePassword =
    usersColumns.some(
      column =>
        column.name ===
        "must_change_password"
    );

  /*
  --------------------------------------------------
  CHECK WHETHER THE CURRENT TABLE ALREADY USES
  THE NEW DEPARTMENT LIST
  --------------------------------------------------
  */

  const needsDepartmentMigration =
    !usersSql.includes("'Newsroom'") ||
    !usersSql.includes("'Marketing'") ||
    !usersSql.includes("'Musanza'") ||
    !usersSql.includes("'Administration'") ||
    !usersSql.includes("'Finance'");


  /*
  ==================================================
  ADD MISSING SIMPLE COLUMNS FIRST
  ==================================================
  */

  if (!hasActive) {

    console.log(
      "🔄 Adding users.active..."
    );

    db.exec(`
      ALTER TABLE users
      ADD COLUMN active INTEGER
      NOT NULL
      DEFAULT 1
    `);

    console.log(
      "✅ users.active added."
    );
  }


  if (!hasMustChangePassword) {

    console.log(
      "🔄 Adding users.must_change_password..."
    );

    db.exec(`
      ALTER TABLE users
      ADD COLUMN must_change_password INTEGER
      NOT NULL
      DEFAULT 0
    `);

    console.log(
      "✅ users.must_change_password added."
    );
  }


  /*
  ==================================================
  REBUILD USERS TABLE IF THE DEPARTMENT CHECK
  IS OLD OR MISSING
  ==================================================
  */

  if (
    needsDepartmentMigration ||
    !hasDepartment
  ) {

    console.log(
      "🔄 Migrating users table to the new 12-department structure..."
    );

    /*
    ------------------------------------------------
    FOREIGN KEYS OFF
    ------------------------------------------------
    */

    db.pragma(
      "foreign_keys = OFF"
    );

    /*
    ------------------------------------------------
    CREATE NEW USERS TABLE
    ------------------------------------------------
    */

    db.exec(`
      CREATE TABLE users_new (

        id INTEGER PRIMARY KEY AUTOINCREMENT,

        name TEXT NOT NULL,

        username TEXT UNIQUE NOT NULL,

        password_hash TEXT NOT NULL,

        role TEXT NOT NULL

          CHECK (
            role IN (
              'staff',
              'manager',
              'superuser'
            )
          )

          DEFAULT 'staff',

        department TEXT NOT NULL

          CHECK (
            department IN (
              'Newsroom',
              'Post Production',
              'Production',
              'Transmission',
              'Marketing',
              'Social Media',
              'IT',
              'Musanza',
              'Security',
              'Administration',
              'Programming',
              'Finance'
            )
          )

          DEFAULT 'Post Production',

        active INTEGER NOT NULL

          DEFAULT 1,

        must_change_password INTEGER NOT NULL

          DEFAULT 0,

        created_at TEXT NOT NULL

          DEFAULT (datetime('now'))
      );
    `);


    /*
    ------------------------------------------------
    COPY EXISTING USERS
    ------------------------------------------------

    Old departments are translated to the new
    department names.
    ------------------------------------------------
    */

    const existingColumns =
      getColumns("users");

    const oldHasActive =
      existingColumns.some(
        column =>
          column.name === "active"
      );

    const oldHasMustChange =
      existingColumns.some(
        column =>
          column.name ===
          "must_change_password"
      );

    const oldHasDepartment =
      existingColumns.some(
        column =>
          column.name ===
          "department"
      );


    /*
    ------------------------------------------------
    DEPARTMENT MIGRATION
    ------------------------------------------------
    */

    let departmentExpression;

    if (oldHasDepartment) {

      departmentExpression = `
        CASE

          WHEN department IS NULL
            OR TRIM(department) = ''
            THEN 'Post Production'

          WHEN department = 'Admin'
            THEN 'Administration'

          WHEN department = 'Newsroom Creatives'
            THEN 'Newsroom'

          WHEN department IN (
            'Newsroom',
            'Post Production',
            'Production',
            'Transmission',
            'Marketing',
            'Social Media',
            'IT',
            'Musanza',
            'Security',
            'Administration',
            'Programming',
            'Finance'
          )
            THEN department

          ELSE 'Post Production'

        END
      `;

    } else {

      departmentExpression =
        `'Post Production'`;
    }


    /*
    ------------------------------------------------
    ROLE MIGRATION
    ------------------------------------------------
    */

    let roleExpression;

    if (hasRoleColumn) {

      roleExpression = `
        CASE

          WHEN role = 'user'
            THEN 'staff'

          WHEN role IN (
            'staff',
            'manager',
            'superuser'
          )
            THEN role

          ELSE 'staff'

        END
      `;

    } else {

      roleExpression =
        `'staff'`;
    }


    /*
    ------------------------------------------------
    ACTIVE
    ------------------------------------------------
    */

    const activeExpression =
      oldHasActive
        ? `COALESCE(active, 1)`
        : `1`;


    /*
    ------------------------------------------------
    MUST CHANGE PASSWORD
    ------------------------------------------------
    */

    const mustChangeExpression =
      oldHasMustChange
        ? `COALESCE(must_change_password, 0)`
        : `0`;


    /*
    ------------------------------------------------
    COPY USERS
    ------------------------------------------------
    */

    db.exec(`
      INSERT INTO users_new (

        id,

        name,

        username,

        password_hash,

        role,

        department,

        active,

        must_change_password,

        created_at

      )

      SELECT

        id,

        name,

        username,

        password_hash,

        ${roleExpression},

        ${departmentExpression},

        ${activeExpression},

        ${mustChangeExpression},

        COALESCE(
          created_at,
          datetime('now')
        )

      FROM users;
    `);


    /*
    ------------------------------------------------
    DROP OLD USERS TABLE
    ------------------------------------------------
    */

    db.exec(`
      DROP TABLE users;
    `);


    /*
    ------------------------------------------------
    RENAME NEW TABLE
    ------------------------------------------------
    */

    db.exec(`
      ALTER TABLE users_new
      RENAME TO users;
    `);


    /*
    ------------------------------------------------
    FOREIGN KEYS BACK ON
    ------------------------------------------------
    */

    db.pragma(
      "foreign_keys = ON"
    );

    console.log(
      "✅ Users table migrated successfully."
    );
  }


  /*
  ==================================================
  NORMALISE ROLE
  ==================================================
  */

  db.prepare(`
    UPDATE users

    SET role = 'staff'

    WHERE role = 'user'
  `).run();


  /*
  ==================================================
  NORMALISE DEPARTMENTS
  ==================================================
  */

  db.prepare(`
    UPDATE users

    SET department = 'Administration'

    WHERE department = 'Admin'
  `).run();


  db.prepare(`
    UPDATE users

    SET department = 'Newsroom'

    WHERE department = 'Newsroom Creatives'
  `).run();


  db.prepare(`
    UPDATE users

    SET department = 'Post Production'

    WHERE department IS NULL

       OR TRIM(department) = ''

       OR department NOT IN (
          'Newsroom',
          'Post Production',
          'Production',
          'Transmission',
          'Marketing',
          'Social Media',
          'IT',
          'Musanza',
          'Security',
          'Administration',
          'Programming',
          'Finance'
       )
  `).run();
}


/*
====================================================
EQUIPMENT TABLE
====================================================
*/

if (!tableExists("equipment")) {

  console.log(
    "🔄 Creating equipment table..."
  );

  db.exec(`
    CREATE TABLE equipment (

      id INTEGER PRIMARY KEY AUTOINCREMENT,

      code TEXT UNIQUE NOT NULL,

      name TEXT NOT NULL,

      category TEXT NOT NULL,

      department TEXT NOT NULL

        CHECK (
          department IN (
            'Post Production',
            'IT',
            'Social Media'
          )
        )

        DEFAULT 'Post Production',

      serial_number TEXT UNIQUE,

      status TEXT NOT NULL

        CHECK (
          status IN (
            'available',
            'booked',
            'repair'
          )
        )

        DEFAULT 'available',

      notes TEXT,

      created_at TEXT NOT NULL

        DEFAULT (datetime('now'))
    );
  `);

  console.log(
    "✅ Equipment table created."
  );

} else {

  const equipmentColumns =
    getColumns("equipment");

  const hasDepartmentColumn =
    equipmentColumns.some(
      column =>
        column.name === "department"
    );

  const hasSerialNumberColumn =
    equipmentColumns.some(
      column =>
        column.name ===
        "serial_number"
    );


  /*
  --------------------------------------------------
  ADD EQUIPMENT DEPARTMENT
  --------------------------------------------------
  */

  if (!hasDepartmentColumn) {

    console.log(
      "🔄 Adding equipment.department..."
    );

    db.exec(`
      ALTER TABLE equipment
      ADD COLUMN department TEXT
      NOT NULL
      DEFAULT 'Post Production'
    `);

    console.log(
      "✅ Equipment department added."
    );
  }


  /*
  --------------------------------------------------
  ADD SERIAL NUMBER
  --------------------------------------------------
  */

  if (!hasSerialNumberColumn) {

    console.log(
      "🔄 Adding equipment.serial_number..."
    );

    db.exec(`
      ALTER TABLE equipment
      ADD COLUMN serial_number TEXT
    `);

    console.log(
      "✅ Equipment serial number added."
    );
  }
}


/*
====================================================
NORMALISE EQUIPMENT DEPARTMENTS
====================================================
*/

db.prepare(`
  UPDATE equipment

  SET department = 'Post Production'

  WHERE department IS NULL

     OR TRIM(department) = ''

     OR department NOT IN (
       'Post Production',
       'IT',
       'Social Media'
     )
`).run();


/*
====================================================
SERIAL NUMBER INDEX
====================================================
*/

db.exec(`
  CREATE UNIQUE INDEX IF NOT EXISTS
  idx_equipment_serial_number

  ON equipment(serial_number)

  WHERE serial_number IS NOT NULL

    AND TRIM(serial_number) != '';
`);


/*
====================================================
BOOKINGS TABLE
====================================================
*/

if (!tableExists("bookings")) {

  console.log(
    "🔄 Creating bookings table..."
  );

  db.exec(`
    CREATE TABLE bookings (

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

      requested_at TEXT NOT NULL

        DEFAULT (datetime('now')),

      decided_at TEXT,

      expires_at TEXT,

      manager_note TEXT
    );
  `);

  console.log(
    "✅ Bookings table created."
  );
}


/*
====================================================
INDEXES
====================================================
*/

db.exec(`
  CREATE INDEX IF NOT EXISTS
  idx_users_department
  ON users(department);

  CREATE INDEX IF NOT EXISTS
  idx_users_role
  ON users(role);

  CREATE INDEX IF NOT EXISTS
  idx_users_active
  ON users(active);

  CREATE INDEX IF NOT EXISTS
  idx_equipment_department
  ON equipment(department);

  CREATE INDEX IF NOT EXISTS
  idx_equipment_status
  ON equipment(status);

  CREATE INDEX IF NOT EXISTS
  idx_bookings_equipment
  ON bookings(equipment_id);

  CREATE INDEX IF NOT EXISTS
  idx_bookings_requester
  ON bookings(requester_id);

  CREATE INDEX IF NOT EXISTS
  idx_bookings_status
  ON bookings(status);
`);


/*
====================================================
SEED DEFAULT USERS
====================================================
*/

const userCount =
  db
    .prepare(`
      SELECT COUNT(*) AS c
      FROM users
    `)
    .get().c;


if (userCount === 0) {

  const insertUser =
    db.prepare(`
      INSERT INTO users (

        name,

        username,

        password_hash,

        role,

        department,

        active,

        must_change_password

      )

      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);


  /*
  --------------------------------------------------
  SUPER USER
  --------------------------------------------------
  */

  insertUser.run(
    "System Administrator",
    "superadmin",
    bcrypt.hashSync(
      "admin123",
      10
    ),
    "superuser",
    "IT",
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
    bcrypt.hashSync(
      "manager123",
      10
    ),
    "manager",
    "Administration",
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
    bcrypt.hashSync(
      "user123",
      10
    ),
    "staff",
    "Post Production",
    1,
    0
  );


  console.log(
    "✅ Default users created."
  );
}


/*
====================================================
POST PRODUCTION EQUIPMENT
====================================================
*/

const postProductionEquipment = [

  ["PP-001", "JBL Speaker SRX700 (15inch)", "Audio"],

  ["PP-002", "JBL Base Bin STX800", "Audio"],

  ["PP-003", "Amplifier JBL MP-70", "Audio"],

  ["PP-004", "Yamaha 12 Channels Audio Mixer", "Audio"],

  ["PP-005", "Speaker Stand WD-502", "Stands"],

  ["PP-006", "Beam Moving Head (260)", "Lighting"],

  ["PP-007", "Canon C100 MKII Camera", "Cameras"],

  ["PP-008", "SONY PMW-400", "Cameras"],

  ["PP-009", "JVC GY-HM750E Camera", "Cameras"],

  ["PP-010", "SONY XDCAM - PXW-X70", "Cameras"],

  ["PP-011", "Nikon D5600 Camera", "Cameras"],

  ["PP-012", "Small Light Hongbad LED", "Lighting"],

  ["PP-013", "Big Light Tolifo LED", "Lighting"],

  ["PP-014", "BOYA Lapel Mic", "Microphones"],

  ["PP-015", "TASCAM Sound", "Audio"],

  ["PP-016", "Wireless Microphone 4 Ways BNK", "Microphones"],

  ["PP-017", "Light Stand", "Stands"],

  ["PP-018", "C Stand", "Stands"],

  ["PP-019", "Medium Tripod Stand", "Stands"],

  ["PP-020", "Big Tripod Stand", "Stands"],

  ["PP-021", "Small Tripod Stand", "Stands"],

  ["PP-022", "Big Dolly", "Camera Support"],

  ["PP-023", "Small Dolly", "Camera Support"],

  ["PP-024", "C100 Battery Pack", "Batteries"],

  ["PP-025", "LATT Lithium Battery", "Batteries"],

  ["PP-026", "Nikon Battery", "Batteries"],

  ["PP-027", "Charger LATT Lithium", "Chargers"],

  ["PP-028", "Charger C100", "Chargers"],

  ["PP-029", "Charger Nikon", "Chargers"],

  ["PP-030", "Charger AA/AAA", "Chargers"],

  ["PP-031", "Gimbal", "Camera Support"],

  ["PP-032", "Yamaha Audio Mixer 4 Channel", "Audio"],

  ["PP-033", "Dynamic Mic", "Microphones"],

  ["PP-034", "Hollyland", "Wireless Systems"],

  ["PP-035", "Shure SM58", "Microphones"],

  ["PP-036", "HDMI Splitter 8 Port", "Video Equipment"],

  ["PP-037", "News Rode Microphone", "Microphones"],

  ["PP-038", "NTG4 Boom Microphone", "Microphones"],

  ["PP-039", "ATEM Mini Pro II", "Video Equipment"],

  ["PP-040", "Rodecaster Pro II", "Audio"],

  ["PP-041", "TV", "Displays"],

  ["PP-042", "Podcast Shure Microphone", "Microphones"],

  ["PP-043", "Podcast Set", "Podcast Equipment"],

  ["PP-044", "HDMI Splitter", "Video Equipment"],

  ["PP-045", "Personal Monitor Wireless System / In Ear", "Monitoring"],

  ["PP-046", "Talkback", "Communication"],

  ["PP-047", "SONY XDCAM HD Recorder", "Recorders"],

  ["PP-048", "Long HDMI Cables", "Cables"],

  ["PP-049", "Long SDI Cables", "Cables"],

  ["PP-050", "Mic Stand", "Stands"],

  ["PP-051", "Audio Cable", "Cables"],

  ["PP-052", "Soliton", "Transmission Equipment"],

  ["PP-053", "LiveU", "Transmission Equipment"],

  ["PP-054", "Data Video Switcher", "Video Equipment"],

  ["PP-055", "Data Video Monitor", "Displays"]

];


/*
====================================================
INSERT EQUIPMENT
====================================================
*/

const insertEquipment =
  db.prepare(`
    INSERT OR IGNORE INTO equipment (

      code,

      name,

      category,

      department,

      serial_number,

      status

    )

    VALUES (

      ?,

      ?,

      ?,

      'Post Production',

      NULL,

      'available'

    )
  `);


/*
====================================================
LOAD INVENTORY
====================================================
*/

for (
  const equipment
  of postProductionEquipment
) {

  insertEquipment.run(
    ...equipment
  );
}


console.log(
  `✅ Post Production inventory checked: ${postProductionEquipment.length} items.`
);


/*
====================================================
DATABASE SUMMARY
====================================================
*/

const totalUsers =
  db
    .prepare(`
      SELECT COUNT(*) AS count
      FROM users
    `)
    .get().count;


const totalEquipment =
  db
    .prepare(`
      SELECT COUNT(*) AS count
      FROM equipment
    `)
    .get().count;


const totalBookings =
  db
    .prepare(`
      SELECT COUNT(*) AS count
      FROM bookings
    `)
    .get().count;


console.log("");

console.log(
  "=============================================="
);

console.log(
  " EQUIPMENT TRACKER DATABASE"
);

console.log(
  "=============================================="
);

console.log(
  ` Users:      ${totalUsers}`
);

console.log(
  ` Equipment:  ${totalEquipment}`
);

console.log(
  ` Bookings:   ${totalBookings}`
);

console.log(
  "=============================================="
);

console.log("");

console.log(
  "User departments:"
);

USER_DEPARTMENTS.forEach(
  department => {
    console.log(
      ` - ${department}`
    );
  }
);


/*
====================================================
EXPORT DATABASE
====================================================
*/

module.exports = db;


/*
====================================================
EXPORT DEPARTMENT LISTS
====================================================
*/

module.exports.USER_DEPARTMENTS =
  USER_DEPARTMENTS;

module.exports.EQUIPMENT_DEPARTMENTS =
  EQUIPMENT_DEPARTMENTS;