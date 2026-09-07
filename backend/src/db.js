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
            'repair',
            'out_of_service'
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


  /*
  --------------------------------------------------
  ADD 'out_of_service' TO STATUS CHECK
  --------------------------------------------------

  This modifies an existing CHECK constraint, which
  SQLite can only do by rebuilding the table. The
  whole rebuild runs inside a single transaction so
  a failure partway through can never leave a stray
  equipment_new table behind — the same class of bug
  that previously got bookings_new stuck permanently.
  --------------------------------------------------
  */

  const equipmentSql =
    getTableSql("equipment");

  const hasOutOfService =
    equipmentSql.includes(
      "out_of_service"
    );

  if (!hasOutOfService) {

    console.log(
      "🔄 Migrating equipment table to support out_of_service status..."
    );

    db.pragma("foreign_keys = OFF");

    db.exec(`DROP TABLE IF EXISTS equipment_new;`);

    const migrateEquipment =
      db.transaction(() => {

        db.exec(`
          CREATE TABLE equipment_new (

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
                  'repair',
                  'out_of_service'
                )
              )

              DEFAULT 'available',

            notes TEXT,

            created_at TEXT NOT NULL

              DEFAULT (datetime('now'))
          );

          INSERT INTO equipment_new (
            id, code, name, category, department,
            serial_number, status, notes, created_at
          )
          SELECT
            id, code, name, category, department,
            serial_number, status, notes, created_at
          FROM equipment;

          DROP TABLE equipment;

          ALTER TABLE equipment_new
          RENAME TO equipment;
        `);
      });

    migrateEquipment();

    db.pragma("foreign_keys = ON");

    console.log(
      "✅ Equipment table migration complete."
    );
  }
}

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

      manager_note TEXT,

      return_status TEXT
        CHECK (
          return_status IN (
            'available',
            'repair',
            'out_of_service'
          )
        ),

      return_note TEXT,

      returned_at TEXT
    );
  `);

  console.log(
    "✅ Bookings table created."
  );

}


/*
====================================================
MIGRATE EXISTING BOOKINGS TABLE
====================================================

The return_status / return_note / returned_at
columns above only get created for a brand new
database. Your bookings table already exists, so
without this branch it would never get them.

return_status has no CHECK constraint at the ALTER
TABLE level — validation happens in bookings.js
instead. That means adding another allowed status
later never requires rebuilding this table.
====================================================
*/

else {

  const bookingsColumns =
    getColumns("bookings");

  const hasReturnStatus =
    bookingsColumns.some(
      column => column.name === "return_status"
    );

  const hasReturnNote =
    bookingsColumns.some(
      column => column.name === "return_note"
    );

  const hasReturnedAt =
    bookingsColumns.some(
      column => column.name === "returned_at"
    );

  if (!hasReturnStatus) {

    console.log(
      "🔄 Adding bookings.return_status..."
    );

    db.exec(`
      ALTER TABLE bookings
      ADD COLUMN return_status TEXT
    `);

    console.log(
      "✅ bookings.return_status added."
    );
  }

  if (!hasReturnNote) {

    console.log(
      "🔄 Adding bookings.return_note..."
    );

    db.exec(`
      ALTER TABLE bookings
      ADD COLUMN return_note TEXT
    `);

    console.log(
      "✅ bookings.return_note added."
    );
  }

  if (!hasReturnedAt) {

    console.log(
      "🔄 Adding bookings.returned_at..."
    );

    db.exec(`
      ALTER TABLE bookings
      ADD COLUMN returned_at TEXT
    `);

    console.log(
      "✅ bookings.returned_at added."
    );
  }
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
IT EQUIPMENT
====================================================
*/

const itEquipment = [

  /*
  --------------------------------------------------
  TABLETS
  --------------------------------------------------
  */

  [
    "IT-001",
    "Galaxy Tab S10",
    "Tablets",
    "R5GYB1C2PPH",
    null
  ],

  [
    "IT-002",
    "Galaxy Tab S10",
    "Tablets",
    "R5GYB3EN1FB",
    null
  ],


  /*
  --------------------------------------------------
  LAPTOPS
  --------------------------------------------------
  */

  [
    "IT-003",
    "HP ProBook 450 G9",
    "Laptops",
    "5CD3484JV",
    null
  ],

  [
    "IT-004",
    "HP ProBook 450 G8",
    "Laptops",
    "5CD147LBVS",
    null
  ],

  [
    "IT-005",
    "HP ProBook 450 G9",
    "Laptops",
    "5CD410CM78",
    null
  ],

  [
    "IT-006",
    "HP ProBook 450 G9",
    "Laptops",
    "5CD3493N10",
    null
  ],


  /*
  --------------------------------------------------
  PHONES
  --------------------------------------------------
  */

  ["IT-007", "Samsung Phone", "Phones", "R5GL11JVOZA", "Color: Peach Pink"],
  ["IT-008", "Samsung Phone", "Phones", "R5GL15B7GDW", "Color: Peach Pink"],
  ["IT-009", "Samsung Phone", "Phones", "R5GL13V9LEA", "Color: Peach Pink"],
  ["IT-010", "Samsung Phone", "Phones", "R5GL11JT061", "Color: Peach Pink"],
  ["IT-011", "Samsung Phone", "Phones", "R5GL13V9ERX", "Color: Peach Pink"],
  ["IT-012", "Samsung Phone", "Phones", "R5GL13V9E1W", "Color: Peach Pink"],
  ["IT-013", "Samsung Phone", "Phones", "R5GYB402HYM", "Color: Peach Pink"],
  ["IT-014", "Samsung Phone", "Phones", "R5GL15B7AEW", "Color: Peach Pink"],
  ["IT-015", "Samsung Phone", "Phones", "R5GYB4023WJ", "Color: Peach Pink"],
  ["IT-016", "Samsung Phone", "Phones", "R5GYB402MYK", "Color: Peach Pink"],
  ["IT-017", "Samsung Phone", "Phones", "R5GL20LNG6J", "Color: Peach Pink"],
  ["IT-018", "Samsung Phone", "Phones", "R5GL15B7AJK", "Color: Peach Pink"],

  ["IT-019", "Samsung Phone", "Phones", "R5GL21Q9GAX", "Color: Pink"],
  ["IT-020", "Samsung Phone", "Phones", "R5GL20LNG3W", "Color: Pink"],
  ["IT-021", "Samsung Phone", "Phones", "R5GL13V9DEV", "Color: Pink"],
  ["IT-022", "Samsung Phone", "Phones", "R5GYB40245L", "Color: Pink"],
  ["IT-023", "Samsung Phone", "Phones", "R5GYB40242E", "Color: Pink"],
  ["IT-024", "Samsung Phone", "Phones", "R5GL11A32GF", "Color: Pink"],
  ["IT-025", "Samsung Phone", "Phones", "R5GYB401ZFP", "Color: Pink"],
  ["IT-026", "Samsung Phone", "Phones", "R5GL13V9DYA", "Color: Pink"],
  ["IT-027", "Samsung Phone", "Phones", "R5GYB402AKB", "Color: Pink"],
  ["IT-028", "Samsung Phone", "Phones", "R5GYB4022QM", "Color: Pink"],
  ["IT-029", "Samsung Phone", "Phones", "R5GL15B7K9J", "Color: Pink"],
  ["IT-030", "Samsung Phone", "Phones", "R5GL20LNJDD", "Color: Pink"],
  ["IT-031", "Samsung Phone", "Phones", "R5GL11A42GR", "Color: Pink"],
  ["IT-032", "Samsung Phone", "Phones", "R5GL211HKMK", "Color: Pink"],
  ["IT-033", "Samsung Phone", "Phones", "R5GL11JT1EZ", "Color: Pink"],
  ["IT-034", "Samsung Phone", "Phones", "R5GL20LAHWD", "Color: Pink"],
  ["IT-035", "Samsung Phone", "Phones", "R5GL11JT4QV", "Color: Pink"],
  ["IT-036", "Samsung Phone", "Phones", "R5GL11JSVLW", "Color: Pink"],
  ["IT-037", "Samsung Phone", "Phones", "R5GL11A43ZJ", "Color: Pink"],
  ["IT-038", "Samsung Phone", "Phones", "R5GL15B7JTD", "Color: Pink"],
  ["IT-039", "Samsung Phone", "Phones", "R5GL15B7HQD", "Color: Pink"],
  ["IT-040", "Samsung Phone", "Phones", "R5GL20LNFQT", "Color: Pink"],
  ["IT-041", "Samsung Phone", "Phones", "R5GL20LNGRJ", "Color: Pink"],
  ["IT-042", "Samsung Phone", "Phones", "R5GL13V9MLY", "Color: Pink"],
  ["IT-043", "Samsung Phone", "Phones", "R5GL15B78NA", "Color: Pink"],
  ["IT-044", "Samsung Phone", "Phones", "R5GL20LNK1V", "Color: Pink"],

  ["IT-045", "Samsung Phone", "Phones", "R5GYB3JXQFP", "Color: White"],
  ["IT-046", "Samsung Phone", "Phones", "R5GYB3JXSKD", "Color: White"],
  ["IT-047", "Samsung Phone", "Phones", "R5GYB3AAKGH", "Color: White"],
  ["IT-048", "Samsung Phone", "Phones", "R5GYB3AAX7M", "Color: White"],
  ["IT-049", "Samsung Phone", "Phones", "R5GYB3AANEN", "Color: White"],
  ["IT-050", "Samsung Phone", "Phones", "R5GYB3JXP2F", "Color: White"],
  ["IT-051", "Samsung Phone", "Phones", "R5GYB3AAPBR", "Color: White"],
  ["IT-052", "Samsung Phone", "Phones", "R5GYB3JXNLE", "Color: White"],
  ["IT-053", "Samsung Phone", "Phones", "R5GYB3JXR1A", "Color: White"],
  ["IT-054", "Samsung Phone", "Phones", "R5GYB3AA7ZP", "Color: White"],
  ["IT-055", "Samsung Phone", "Phones", "R5GYB3JXSWK", "Color: White"],
  ["IT-056", "Samsung Phone", "Phones", "R5GYB3AADTX", "Color: White"],
  ["IT-057", "Samsung Phone", "Phones", "R5GYB3AAK6L", "Color: White"],
  ["IT-058", "Samsung Phone", "Phones", "R5GYB3JXMSM", "Color: White"],

  ["IT-059", "Samsung Phone", "Phones", "R5GYB402H5N", "Color: Pink"],
  ["IT-060", "Samsung Phone", "Phones", "R5GL158798V", "Color: Pink"],

  ["IT-061", "Samsung Phone", "Phones", "R5GYB3JXVNL", "Color: White"],
  ["IT-062", "Samsung Phone", "Phones", "R5GYB3JXQRB", "Color: White"],
  ["IT-063", "Samsung Phone", "Phones", "R5GYB3JXPCP", "Color: White"],
  ["IT-064", "Samsung Phone", "Phones", "R5GYB3AAY1E", "Color: White"],
  ["IT-065", "Samsung Phone", "Phones", "R5GYB3AAXAY", "Color: White"],

  ["IT-066", "Samsung Phone", "Phones", "R5GYA0RTBXF", "Color: Black"],
  ["IT-067", "Samsung Phone", "Phones", "R5GYA0RTZWN", "Color: Black"],
  ["IT-068", "Samsung Phone", "Phones", "R5GL20LNL4V", "Color: Black"],
  ["IT-069", "Samsung Phone", "Phones", "R5GYB3RQ7XZ", "Color: Black"],
  ["IT-070", "Samsung Phone", "Phones", "R5GL20LNKHT", "Color: Black"],
  ["IT-071", "Samsung Phone", "Phones", "R5GL134CPGL", "Color: Black"],
  ["IT-072", "Samsung Phone", "Phones", "R5GL20LNNNN", "Color: Black"],
  ["IT-073", "Samsung Phone", "Phones", "R5GL20LNQAK", "Color: Black"],
  ["IT-074", "Samsung Phone", "Phones", "R5GL134CLLB", "Color: Black"],
  ["IT-075", "Samsung Phone", "Phones", "R5GL20LNPXR", "Color: Black"],
  ["IT-076", "Samsung Phone", "Phones", "R5GL134C4VJ", "Color: Black"],
  ["IT-077", "Samsung Phone", "Phones", "R5GYB09992D", "Color: Black"],
  ["IT-078", "Samsung Phone", "Phones", "R5GYB2T7TWT", "Color: Black"],
  ["IT-079", "Samsung Phone", "Phones", "R5GL20LNNFB", "Color: Black"],
  ["IT-080", "Samsung Phone", "Phones", "R5GYB4BDJJL", "Color: Black"],
  ["IT-081", "Samsung Phone", "Phones", "R5GYB09B20E", "Color: Black"],
  ["IT-082", "Samsung Phone", "Phones", "R5GYB3EBDYY", "Color: Black"],
  ["IT-083", "Samsung Phone", "Phones", "R5GL20LNPTJ", "Color: Black"],
  ["IT-084", "Samsung Phone", "Phones", "R5GL20LNROV", "Color: Black"],
  ["IT-085", "Samsung Phone", "Phones", "R5GL20LNKZN", "Color: Black"],
  ["IT-086", "Samsung Phone", "Phones", "R5GYB1SPQ4E", "Color: Black"],
  ["IT-087", "Samsung Phone", "Phones", "R5GYA0RTCJY", "Color: Black"],
  ["IT-088", "Samsung Phone", "Phones", "R5GYB09BNEJ", "Color: Black"],
  ["IT-089", "Samsung Phone", "Phones", "R5GYA0RTBWX", "Color: Black"],
  ["IT-090", "Samsung Phone", "Phones", "R5GYB09B2QV", "Color: Black"],
  ["IT-091", "Samsung Phone", "Phones", "R5GL134BQXD", "Color: Black"],
  ["IT-092", "Samsung Phone", "Phones", "R5GYB09A4EJ", "Color: Black"],
  ["IT-093", "Samsung Phone", "Phones", "R5GYB09C15V", "Color: Black"],
  ["IT-094", "Samsung Phone", "Phones", "R5GYB1Z4ELM", "Color: Black"],
  ["IT-095", "Samsung Phone", "Phones", "R5GL20LNPSW", "Color: Black"],
  ["IT-096", "Samsung Phone", "Phones", "R5GYB09BN7X", "Color: Black"],
  ["IT-097", "Samsung Phone", "Phones", "R5GYA0RTZ3D", "Color: Black"],
  ["IT-098", "Samsung Phone", "Phones", "R5GL20LNMFL", "Color: Black"],
  ["IT-099", "Samsung Phone", "Phones", "R5GYB3EAW3R", "Color: Black"],

  ["IT-100", "Samsung Phone", "Phones", "R5GYB3AANTR", "Color: White"],

  ["IT-101", "Samsung Phone", "Phones", "R5GL12V1N1M", "Color: Black"],
  ["IT-102", "Samsung Phone", "Phones", "R5GYB3CZW9B", "Color: Black"],
  ["IT-103", "Samsung Phone", "Phones", "R5GL20LNQ1X", "Color: Black"],
  ["IT-104", "Samsung Phone", "Phones", "R5GYA0RTCBK", "Color: Black"],
  ["IT-105", "Samsung Phone", "Phones", "R5GYB09BNNE", "Color: Black"],
  ["IT-106", "Samsung Phone", "Phones", "R5GYA0RTLXP", "Color: Black"],
  ["IT-107", "Samsung Phone", "Phones", "R5GL134C34K", "Color: Black"],
  ["IT-108", "Samsung Phone", "Phones", "R5GL20LNKXY", "Color: Black"],

  ["IT-109", "Samsung Phone", "Phones", "R5GL15B7BPJ", "Color: Peach Pink"],
  ["IT-110", "Samsung Phone", "Phones", "R5GL20LNPFZ", "Color: Black"],
  ["IT-111", "Samsung Phone", "Phones", "R5GL12V1F5H", "Color: Black"],
  ["IT-112", "Samsung Phone", "Phones", "R5GL12V1HZP", "Color: Black"],
  ["IT-113", "Samsung Phone", "Phones", "R5GYB099MXF", "Color: Black"],
  ["IT-114", "Samsung Phone", "Phones", "R5GYB09B24X", "Color: Black"],
  ["IT-115", "Samsung Phone", "Phones", "R5GYB1SP9YR", "Color: Black"],
  ["IT-116", "Samsung Phone", "Phones", "R5GYB3RQ7ZK", "Color: Black"],
  ["IT-117", "Samsung Phone", "Phones", "R5GL20LNMJW", "Color: Black"],

  ["IT-118", "Samsung Phone", "Phones", "R5GL13V9LNM", "Color: Peach Pink"],
  ["IT-119", "Samsung Phone", "Phones", "R5GL11JTYMD", "Color: Peach Pink"],
  ["IT-120", "Samsung Phone", "Phones", "R5GL11A43RE", "Color: Peach Pink"],
  ["IT-121", "Samsung Phone", "Phones", "R5GL11JTYEZ", "Color: Peach Pink"],
  ["IT-122", "Samsung Phone", "Phones", "R5GL11JTYCE", "Color: Peach Pink"],
  ["IT-123", "Samsung Phone", "Phones", "R5GL15B7CSJ", "Color: Peach Pink"],
  ["IT-124", "Samsung Phone", "Phones", "R5GL13V9B4R", "Color: Peach Pink"],
  ["IT-125", "Samsung Phone", "Phones", "R5GL15B7GZW", "Color: Peach Pink"],
  ["IT-126", "Samsung Phone", "Phones", "R5GL13VNERX", "Color: Peach Pink"],
  ["IT-127", "Samsung Phone", "Phones", "R5GL13V8YAE", "Color: Peach Pink"],
  ["IT-128", "Samsung Phone", "Phones", "R5GL20LNHNL", "Color: Peach Pink"],
  ["IT-129", "Samsung Phone", "Phones", "R5GL20LNJBK", "Color: Peach Pink"],
  ["IT-130", "Samsung Phone", "Phones", "R5GL20LNJWN", "Color: Peach Pink"],
  ["IT-131", "Samsung Phone", "Phones", "R5GL15B7J1Z", "Color: Peach Pink"],
  ["IT-132", "Samsung Phone", "Phones", "R5GL13V98QM", "Color: Peach Pink"],
  ["IT-133", "Samsung Phone", "Phones", "R5GL15B7GPT", "Color: Peach Pink"],
  ["IT-134", "Samsung Phone", "Phones", "R5GL11JV18J", "Color: Peach Pink"],
  ["IT-135", "Samsung Phone", "Phones", "R5GL11A3DSP", "Color: Peach Pink"],
  ["IT-136", "Samsung Phone", "Phones", "R5GL13V9LBP", "Color: Peach Pink"],
  ["IT-137", "Samsung Phone", "Phones", "R5GL11JTYLB", "Color: Peach Pink"],
  ["IT-138", "Samsung Phone", "Phones", "R5GL11JTE2N", "Color: Peach Pink"]

];





/*
====================================================
INSERT POST PRODUCTION EQUIPMENT
====================================================
*/

const insertPostProductionEquipment =
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

      ?, ?, ?, 'Post Production', NULL, 'available'

    )
  `);


/*
====================================================
INSERT IT EQUIPMENT
====================================================
*/

const insertITEquipment =
  db.prepare(`
    INSERT OR IGNORE INTO equipment (

      code,

      name,

      category,

      department,

      serial_number,

      status,

      notes

    )

    VALUES (

      ?, ?, ?, 'IT', ?, 'available', ?

    )
  `);


/*
====================================================
LOAD IT INVENTORY
====================================================
*/

for (
  const equipment
  of itEquipment
) {

  insertITEquipment.run(
    ...equipment
  );

}


console.log(
  `✅ IT inventory checked: ${itEquipment.length} items.`
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