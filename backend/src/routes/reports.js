const express = require("express");

const db = require("../db");

const {
  requireAuth,
  requireManager
} = require("../middleware/auth");

const router = express.Router();

/*
====================================================
ALL REPORT ROUTES REQUIRE LOGIN
====================================================
*/

router.use(requireAuth);


/*
====================================================
EQUIPMENT INVENTORY REPORT
====================================================

Managers and superusers can retrieve the complete
equipment inventory for printing/reporting.
====================================================
*/

router.get(
  "/equipment",
  requireManager,
  (req, res) => {

    try {

      const items = db.prepare(`
        SELECT
          id,
          code,
          name,
          category,
          department,
          serial_number,
          status,
          notes,
          created_at
        FROM equipment
        ORDER BY
          department ASC,
          category ASC,
          code ASC
      `).all();


      /*
      ==============================================
      SUMMARY
      ==============================================
      */

      const total = items.length;

      const available = items.filter(
        item => item.status === "available"
      ).length;

      const booked = items.filter(
        item => item.status === "booked"
      ).length;

      const repair = items.filter(
        item => item.status === "repair"
      ).length;

      const outOfService = items.filter(
        item => item.status === "out_of_service"
      ).length;


      /*
      ==============================================
      DEPARTMENT COUNTS
      ==============================================
      */

      const departments = {};

      items.forEach(item => {

        const department =
          item.department || "Unassigned";

        if (!departments[department]) {
          departments[department] = 0;
        }

        departments[department]++;
      });


      /*
      ==============================================
      CATEGORY COUNTS
      ==============================================
      */

      const categories = {};

      items.forEach(item => {

        const category =
          item.category || "Uncategorised";

        if (!categories[category]) {
          categories[category] = 0;
        }

        categories[category]++;
      });


      /*
      ==============================================
      RESPONSE
      ==============================================
      */

      res.json({
        success: true,

        generated_at: new Date().toISOString(),

        summary: {
          total,
          available,
          booked,
          repair,
          out_of_service: outOfService
        },

        departments,

        categories,

        items
      });

    } catch (error) {

      console.error(
        "Equipment report error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Unable to generate equipment report."
      });

    }

  }
);


module.exports = router;