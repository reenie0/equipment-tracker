const express = require("express");
const db = require("../db");

const {
  requireAuth,
  requireManager,
} = require("../middleware/auth");

const router = express.Router();

// All category routes require login
router.use(requireAuth);

/**
 * GET /api/categories
 *
 * Get all categories with the number of equipment
 * items currently using each category.
 */
router.get("/", (req, res) => {
  try {
    const categories = db
      .prepare(`
        SELECT
          c.id,
          c.name,
          c.created_at,
          (
            SELECT COUNT(*)
            FROM equipment e
            WHERE LOWER(TRIM(e.category))
              = LOWER(TRIM(c.name))
          ) AS equipment_count
        FROM categories c
        ORDER BY c.name COLLATE NOCASE ASC
      `)
      .all();

    res.json({ categories });
  } catch (err) {
    console.error("Error loading categories:", err);

    res.status(500).json({
      error: "Unable to load categories",
    });
  }
});

/**
 * GET /api/categories/:id
 *
 * Get one category.
 */
router.get("/:id", (req, res) => {
  try {
    const category = db
      .prepare(`
        SELECT
          c.id,
          c.name,
          c.created_at,
          (
            SELECT COUNT(*)
            FROM equipment e
            WHERE LOWER(TRIM(e.category))
              = LOWER(TRIM(c.name))
          ) AS equipment_count
        FROM categories c
        WHERE c.id = ?
      `)
      .get(req.params.id);

    if (!category) {
      return res.status(404).json({
        error: "Category not found",
      });
    }

    res.json({ category });
  } catch (err) {
    console.error("Error loading category:", err);

    res.status(500).json({
      error: "Unable to load category",
    });
  }
});

/**
 * POST /api/categories
 *
 * Create a new category.
 *
 * Manager/Superuser only.
 */
router.post("/", requireManager, (req, res) => {
  try {
    const { name } = req.body || {};

    if (!name || !name.trim()) {
      return res.status(400).json({
        error: "Category name is required",
      });
    }

    const categoryName = name.trim();

    // Check if the category already exists.
    // COLLATE NOCASE makes the check case-insensitive.
    const existing = db
      .prepare(`
        SELECT id, name
        FROM categories
        WHERE name = ? COLLATE NOCASE
      `)
      .get(categoryName);

    if (existing) {
      return res.status(409).json({
        error: "A category with that name already exists",
      });
    }

    const info = db
      .prepare(`
        INSERT INTO categories (name)
        VALUES (?)
      `)
      .run(categoryName);

    const category = db
      .prepare(`
        SELECT
          id,
          name,
          created_at,
          0 AS equipment_count
        FROM categories
        WHERE id = ?
      `)
      .get(info.lastInsertRowid);

    res.status(201).json({
      category,
    });
  } catch (err) {
    console.error("Error creating category:", err);

    // Handle SQLite UNIQUE constraint as an extra safeguard.
    if (
      err.code === "SQLITE_CONSTRAINT_UNIQUE" ||
      err.code === "SQLITE_CONSTRAINT"
    ) {
      return res.status(409).json({
        error: "A category with that name already exists",
      });
    }

    res.status(500).json({
      error: "Unable to create category",
    });
  }
});

/**
 * PATCH /api/categories/:id
 *
 * Rename an existing category.
 *
 * Manager/Superuser only.
 *
 * When a category is renamed, all equipment using
 * the old category name is updated automatically.
 */
router.patch("/:id", requireManager, (req, res) => {
  try {
    const { name } = req.body || {};

    if (!name || !name.trim()) {
      return res.status(400).json({
        error: "Category name is required",
      });
    }

    const newName = name.trim();

    // Find the existing category.
    const category = db
      .prepare(`
        SELECT
          id,
          name,
          created_at
        FROM categories
        WHERE id = ?
      `)
      .get(req.params.id);

    if (!category) {
      return res.status(404).json({
        error: "Category not found",
      });
    }

    // Check if another category already has the new name.
    const duplicate = db
      .prepare(`
        SELECT id
        FROM categories
        WHERE name = ? COLLATE NOCASE
          AND id != ?
      `)
      .get(newName, category.id);

    if (duplicate) {
      return res.status(409).json({
        error: "A category with that name already exists",
      });
    }

    /*
     * Rename the category and update equipment
     * inside one transaction.
     *
     * This means both changes succeed together.
     */
    const updateCategory = db.transaction(() => {
      // Update equipment first.
      db.prepare(`
        UPDATE equipment
        SET category = ?
        WHERE LOWER(TRIM(category))
          = LOWER(TRIM(?))
      `).run(newName, category.name);

      // Then update the category itself.
      db.prepare(`
        UPDATE categories
        SET name = ?
        WHERE id = ?
      `).run(newName, category.id);
    });

    updateCategory();

    // Return the updated category with its equipment count.
    const updated = db
      .prepare(`
        SELECT
          c.id,
          c.name,
          c.created_at,
          (
            SELECT COUNT(*)
            FROM equipment e
            WHERE LOWER(TRIM(e.category))
              = LOWER(TRIM(c.name))
          ) AS equipment_count
        FROM categories c
        WHERE c.id = ?
      `)
      .get(category.id);

    res.json({
      category: updated,
    });
  } catch (err) {
    console.error("Error updating category:", err);

    if (
      err.code === "SQLITE_CONSTRAINT_UNIQUE" ||
      err.code === "SQLITE_CONSTRAINT"
    ) {
      return res.status(409).json({
        error: "A category with that name already exists",
      });
    }

    res.status(500).json({
      error: "Unable to update category",
    });
  }
});

/**
 * DELETE /api/categories/:id
 *
 * Delete a category.
 *
 * Manager/Superuser only.
 *
 * A category cannot be deleted while equipment
 * is still using it.
 */
router.delete("/:id", requireManager, (req, res) => {
  try {
    const category = db
      .prepare(`
        SELECT
          id,
          name
        FROM categories
        WHERE id = ?
      `)
      .get(req.params.id);

    if (!category) {
      return res.status(404).json({
        error: "Category not found",
      });
    }

    // Check how many equipment items use this category.
    const result = db
      .prepare(`
        SELECT COUNT(*) AS count
        FROM equipment
        WHERE LOWER(TRIM(category))
          = LOWER(TRIM(?))
      `)
      .get(category.name);

    const equipmentCount = Number(result.count || 0);

    if (equipmentCount > 0) {
      return res.status(409).json({
        error:
          `Can't delete "${category.name}" because ` +
          `${equipmentCount} equipment item` +
          `${equipmentCount === 1 ? "" : "s"} ` +
          `use this category. Rename the category instead.`,
      });
    }

    db.prepare(`
      DELETE FROM categories
      WHERE id = ?
    `).run(category.id);

    res.json({
      ok: true,
    });
  } catch (err) {
    console.error("Error deleting category:", err);

    res.status(500).json({
      error: "Unable to delete category",
    });
  }
});

module.exports = router;