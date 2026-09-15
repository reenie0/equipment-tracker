const express = require("express");

const db = require("../db");

const {
  requireAuth,
  requireManager
} = require("../middleware/auth");

const router = express.Router();


/*
====================================================
AUTHENTICATION
====================================================
*/

router.use(requireAuth);


/*
====================================================
AUTHORIZATION
====================================================

Managers can see everyone's history.

Normal users can see only their own history.

The filtering is done on the backend using
req.user.id from the authenticated JWT.
====================================================
*/


/*
====================================================
ALL HISTORY
====================================================
*/

router.get("/", (req, res) => {

  try {

    const isManager =
      req.user.role === "manager" ||
      req.user.role === "superuser" ||
      req.user.role === "super_user";

    let query = `
      SELECT

        b.id,

        /*
        ========================================
        EMPLOYEE
        ========================================
        */

        b.requester_id,

        COALESCE(

          NULLIF(

            TRIM(
              requester.first_name ||
              ' ' ||
              requester.last_name
            ),

            ''

          ),

          b.requester_name

        ) AS employee_name,


        requester.department
          AS employee_department,


        /*
        ========================================
        EQUIPMENT
        ========================================
        */

        b.equipment_id,

        e.name
          AS equipment_name,

        e.code
          AS equipment_code,

        e.category
          AS equipment_category,

        e.serial_number,


        /*
        ========================================
        BOOKING
        ========================================
        */

        b.purpose,

        b.duration_hours,

        b.status
          AS booking_status,

        b.gate_pass_code,

        b.requested_at,

        b.decided_at,

        b.expires_at,


        /*
        ========================================
        APPROVAL / REJECTION
        ========================================
        */

        b.decided_by,

        CASE

          WHEN decision_manager.id IS NOT NULL

          THEN
            TRIM(
              decision_manager.first_name ||
              ' ' ||
              decision_manager.last_name
            )

          ELSE NULL

        END
          AS decision_manager_name,


        /*
        ========================================
        MANAGER NOTE
        ========================================
        */

        b.manager_note,


        /*
        ========================================
        RETURN
        ========================================
        */

        b.return_status,

        b.return_note,

        b.returned_at,

        b.returned_by,


        CASE

          WHEN return_manager.id IS NOT NULL

          THEN
            TRIM(
              return_manager.first_name ||
              ' ' ||
              return_manager.last_name
            )

          ELSE NULL

        END
          AS return_manager_name


      FROM bookings b


      JOIN equipment e
        ON e.id = b.equipment_id


      LEFT JOIN users requester
        ON requester.id = b.requester_id


      LEFT JOIN users decision_manager
        ON decision_manager.id = b.decided_by


      LEFT JOIN users return_manager
        ON return_manager.id = b.returned_by
    `;


    /*
    ------------------------------------------------
    NORMAL USERS
    ------------------------------------------------

    Only return bookings belonging to the
    currently logged-in user.
    ------------------------------------------------
    */

    if (!isManager) {

      query += `
        WHERE b.requester_id = ?
      `;

    }


    query += `
      ORDER BY
        b.requested_at DESC
    `;


    const history = isManager

      ? db
          .prepare(query)
          .all()

      : db
          .prepare(query)
          .all(req.user.id);


    res.json({

      success: true,

      history

    });


  } catch (error) {

    console.error(
      "History error:",
      error
    );


    res.status(500).json({

      success: false,

      message:
        "Unable to load history."

    });

  }

});


/*
====================================================
ALLOCATIONS / BOOKINGS HISTORY
====================================================
*/

router.get(
  "/allocations",
  (req, res) => {

    try {

      const isManager =
        req.user.role === "manager" ||
        req.user.role === "superuser" ||
        req.user.role === "super_user";


      let query = `
        SELECT

          b.id,

          b.requester_id,


          /*
          ======================================
          EMPLOYEE
          ======================================
          */

          COALESCE(

            NULLIF(

              TRIM(
                requester.first_name ||
                ' ' ||
                requester.last_name
              ),

              ''

            ),

            b.requester_name

          ) AS employee_name,


          requester.department
            AS employee_department,


          /*
          ======================================
          EQUIPMENT
          ======================================
          */

          e.name
            AS equipment_name,

          e.code
            AS equipment_code,

          e.serial_number,


          /*
          ======================================
          BOOKING
          ======================================
          */

          b.purpose,

          b.requested_at,

          b.decided_at,

          b.expires_at,

          b.status
            AS booking_status,

          b.gate_pass_code,


          /*
          ======================================
          MANAGER
          ======================================
          */

          CASE

            WHEN decision_manager.id IS NOT NULL

            THEN
              TRIM(
                decision_manager.first_name ||
                ' ' ||
                decision_manager.last_name
              )

            ELSE NULL

          END
            AS manager_name,


          b.manager_note


        FROM bookings b


        JOIN equipment e
          ON e.id = b.equipment_id


        LEFT JOIN users requester
          ON requester.id = b.requester_id


        LEFT JOIN users decision_manager
          ON decision_manager.id = b.decided_by
      `;


      /*
      ------------------------------------------------
      NORMAL USERS ONLY SEE THEIR OWN BOOKINGS
      ------------------------------------------------
      */

      if (!isManager) {

        query += `
          WHERE b.requester_id = ?
        `;

      }


      query += `
        ORDER BY
          b.requested_at DESC
      `;


      const allocations = isManager

        ? db
            .prepare(query)
            .all()

        : db
            .prepare(query)
            .all(req.user.id);


      res.json({

        success: true,

        allocations

      });


    } catch (error) {

      console.error(
        "Allocation history error:",
        error
      );


      res.status(500).json({

        success: false,

        message:
          "Unable to load allocation history."

      });

    }

  }
);


/*
====================================================
RETURN HISTORY
====================================================
*/

router.get(
  "/returns",
  (req, res) => {

    try {

      const isManager =
        req.user.role === "manager" ||
        req.user.role === "superuser" ||
        req.user.role === "super_user";


      let query = `
        SELECT

          b.id,

          b.requester_id,


          /*
          ======================================
          EQUIPMENT
          ======================================
          */

          e.name
            AS equipment_name,

          e.code
            AS equipment_code,

          e.serial_number,


          /*
          ======================================
          EMPLOYEE
          ======================================
          */

          COALESCE(

            NULLIF(

              TRIM(
                requester.first_name ||
                ' ' ||
                requester.last_name
              ),

              ''

            ),

            b.requester_name

          ) AS employee_name,


          requester.department
            AS employee_department,


          /*
          ======================================
          BOOKING STATUS
          ======================================
          */

          b.status
            AS booking_status,


          /*
          ======================================
          RETURN
          ======================================
          */

          b.return_status,

          b.return_note,

          b.returned_at,


          /*
          ======================================
          MANAGER
          ======================================
          */

          CASE

            WHEN return_manager.id IS NOT NULL

            THEN
              TRIM(
                return_manager.first_name ||
                ' ' ||
                return_manager.last_name
              )

            ELSE NULL

          END
            AS returned_by_name,


          /*
          ======================================
          ORIGINAL BOOKING
          ======================================
          */

          b.requested_at,

          b.expires_at,

          b.purpose


        FROM bookings b


        JOIN equipment e
          ON e.id = b.equipment_id


        LEFT JOIN users requester
          ON requester.id = b.requester_id


        LEFT JOIN users return_manager
          ON return_manager.id = b.returned_by


        /*
        Only actual recorded returns.
        Automatic expiry is NOT considered
        a physical return.
        */

        WHERE b.returned_at IS NOT NULL
      `;


      /*
      ------------------------------------------------
      NORMAL USERS ONLY SEE THEIR OWN RETURNS
      ------------------------------------------------
      */

      if (!isManager) {

        query += `
          AND b.requester_id = ?
        `;

      }


      query += `
        ORDER BY
          b.returned_at DESC
      `;


      const returns = isManager

        ? db
            .prepare(query)
            .all()

        : db
            .prepare(query)
            .all(req.user.id);


      res.json({

        success: true,

        returns

      });


    } catch (error) {

      console.error(
        "Return history error:",
        error
      );


      res.status(500).json({

        success: false,

        message:
          "Unable to load return history."

      });

    }

  }
);


module.exports = router;