import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../api";

const DEPARTMENTS = [
  "Post Production",
  "IT",
  "Social Media"
];

const STATUS_LABELS = {
  available: "Available",
  booked: "Booked",
  repair: "In Repair",
  out_of_service: "Out of Service"
};

export default function Reports() {
  const { token, isManager } = useAuth();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [department, setDepartment] = useState("all");
  const [status, setStatus] = useState("all");
  const [category, setCategory] = useState("all");

  /*
  ==================================================
  LOAD ALL EQUIPMENT
  ==================================================
  */

  const loadEquipment = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.listEquipment(token);

      setItems(response.items || []);
    } catch (err) {
      setError(
        err.message ||
        "Unable to load equipment for the report."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEquipment();
  }, []);

  /*
  ==================================================
  CATEGORIES
  ==================================================
  */

  const categories = useMemo(() => {
    const values = items
      .map((item) => item.category)
      .filter(Boolean);

    return [
      "all",
      ...Array.from(new Set(values)).sort()
    ];
  }, [items]);

  /*
  ==================================================
  FILTER EQUIPMENT
  ==================================================
  */

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const departmentMatches =
        department === "all" ||
        item.department === department;

      const statusMatches =
        status === "all" ||
        item.status === status;

      const categoryMatches =
        category === "all" ||
        item.category === category;

      return (
        departmentMatches &&
        statusMatches &&
        categoryMatches
      );
    });
  }, [
    items,
    department,
    status,
    category
  ]);

  /*
  ==================================================
  SUMMARY
  ==================================================
  */

  const summary = useMemo(() => {
    const total = filteredItems.length;

    const available = filteredItems.filter(
      (item) => item.status === "available"
    ).length;

    const booked = filteredItems.filter(
      (item) => item.status === "booked"
    ).length;

    const repair = filteredItems.filter(
      (item) => item.status === "repair"
    ).length;

    const outOfService = filteredItems.filter(
      (item) => item.status === "out_of_service"
    ).length;

    return {
      total,
      available,
      booked,
      repair,
      outOfService
    };
  }, [filteredItems]);

  /*
  ==================================================
  DEPARTMENT COUNTS
  ==================================================
  */

  const departmentCounts = useMemo(() => {
    return DEPARTMENTS.map((dept) => ({
      department: dept,
      count: filteredItems.filter(
        (item) => item.department === dept
      ).length
    }));
  }, [filteredItems]);

  /*
  ==================================================
  PRINT
  ==================================================
  */

  const handlePrint = () => {
    window.print();
  };

  /*
  ==================================================
  ACCESS PROTECTION
  ==================================================
  */

  if (!isManager) {
    return (
      <div className="page">
        <div className="container">
          <div className="empty-state">
            You do not have permission to view reports.
          </div>
        </div>
      </div>
    );
  }

  /*
  ==================================================
  RENDER
  ==================================================
  */

  return (
    <div className="page reports-page">

      <div className="container">

        {/* ==========================================
            HEADER
            ========================================== */}

        <div className="page-header no-print">

          <div>

            <p className="eyebrow">
              Management
            </p>

            <h1 className="page-title">
              Equipment Reports
            </h1>

            <p className="page-sub">
              Generate and print equipment inventory
              reports from the current database.
            </p>

          </div>

          <button
            className="btn btn-primary"
            onClick={handlePrint}
            disabled={loading || filteredItems.length === 0}
          >
            🖨 Print report
          </button>

        </div>


        {/* ==========================================
            PRINT HEADER
            ========================================== */}

        <div className="print-only report-print-header">

          <h1>
            EQUIPMENT INVENTORY REPORT
          </h1>

          <p>
            Equipment Tracker
          </p>

          <p>
            Generated:{" "}
            {new Date().toLocaleString()}
          </p>

        </div>


        {/* ==========================================
            FILTERS
            ========================================== */}

        <div className="report-filters no-print">

          <div className="form-group">

            <label>
              Department
            </label>

            <select
              value={department}
              onChange={(e) =>
                setDepartment(e.target.value)
              }
            >

              <option value="all">
                All departments
              </option>

              {DEPARTMENTS.map((dept) => (
                <option
                  key={dept}
                  value={dept}
                >
                  {dept}
                </option>
              ))}

            </select>

          </div>


          <div className="form-group">

            <label>
              Status
            </label>

            <select
              value={status}
              onChange={(e) =>
                setStatus(e.target.value)
              }
            >

              <option value="all">
                All statuses
              </option>

              <option value="available">
                Available
              </option>

              <option value="booked">
                Booked
              </option>

              <option value="repair">
                In Repair
              </option>

              <option value="out_of_service">
                Out of Service
              </option>

            </select>

          </div>


          <div className="form-group">

            <label>
              Category
            </label>

            <select
              value={category}
              onChange={(e) =>
                setCategory(e.target.value)
              }
            >

              {categories.map((value) => (
                <option
                  key={value}
                  value={value}
                >
                  {value === "all"
                    ? "All categories"
                    : value}
                </option>
              ))}

            </select>

          </div>

        </div>


        {/* ==========================================
            REPORT TITLE
            ========================================== */}

        <div className="report-title-block">

          <div>

            <p className="eyebrow">
              Inventory Report
            </p>

            <h2>
              Equipment Inventory
            </h2>

          </div>

          <div className="report-date">
            Generated{" "}
            {new Date().toLocaleDateString()}
          </div>

        </div>


        {/* ==========================================
            SUMMARY CARDS
            ========================================== */}

        {loading ? (

          <div className="empty-state">
            Loading equipment report…
          </div>

        ) : error ? (

          <div className="empty-state">
            {error}
          </div>

        ) : (

          <>

            <div className="report-summary">

              <div className="report-stat">

                <span>
                  Total Equipment
                </span>

                <strong>
                  {summary.total}
                </strong>

              </div>


              <div className="report-stat">

                <span>
                  Available
                </span>

                <strong>
                  {summary.available}
                </strong>

              </div>


              <div className="report-stat">

                <span>
                  Booked
                </span>

                <strong>
                  {summary.booked}
                </strong>

              </div>


              <div className="report-stat">

                <span>
                  In Repair
                </span>

                <strong>
                  {summary.repair}
                </strong>

              </div>


              <div className="report-stat">

                <span>
                  Out of Service
                </span>

                <strong>
                  {summary.outOfService}
                </strong>

              </div>

            </div>


            {/* ========================================
                DEPARTMENT SUMMARY
                ======================================== */}

            <div className="report-section">

              <h3>
                Equipment by Department
              </h3>

              <div className="department-summary">

                {departmentCounts.map(
                  (item) => (
                    <div
                      key={item.department}
                      className="department-summary-row"
                    >

                      <span>
                        {item.department}
                      </span>

                      <strong>
                        {item.count}
                      </strong>

                    </div>
                  )
                )}

              </div>

            </div>


            {/* ========================================
                EQUIPMENT TABLE
                ======================================== */}

            <div className="report-section">

              <div className="report-section-header">

                <h3>
                  Equipment Inventory
                </h3>

                <span>
                  {filteredItems.length} item
                  {filteredItems.length === 1
                    ? ""
                    : "s"}
                </span>

              </div>


              {filteredItems.length === 0 ? (

                <div className="empty-state">
                  No equipment matches the selected
                  filters.
                </div>

              ) : (

                <div className="report-table-wrapper">

                  <table className="report-table">

                    <thead>

                      <tr>

                        <th>
                          #
                        </th>

                        <th>
                          Code
                        </th>

                        <th>
                          Equipment
                        </th>

                        <th>
                          Category
                        </th>

                        <th>
                          Serial Number
                        </th>

                        <th>
                          Department
                        </th>

                        <th>
                          Status
                        </th>

                        <th>
                          Date Added
                        </th>

                      </tr>

                    </thead>


                    <tbody>

                      {filteredItems.map(
                        (item, index) => (

                          <tr
                            key={item.id}
                          >

                            <td>
                              {index + 1}
                            </td>

                            <td>
                              <strong>
                                {item.code || "—"}
                              </strong>
                            </td>

                            <td>
                              {item.name || "—"}
                            </td>

                            <td>
                              {item.category || "—"}
                            </td>

                            <td>
                              {item.serial_number ||
                                "Not assigned"}
                            </td>

                            <td>
                              {item.department ||
                                "—"}
                            </td>

                            <td>

                              <span
                                className={
                                  `report-status status-${item.status}`
                                }
                              >
                                {STATUS_LABELS[
                                  item.status
                                ] ||
                                  item.status ||
                                  "Unknown"}
                              </span>

                            </td>

                            <td>
                              {item.created_at
                                ? new Date(
                                    item.created_at
                                  ).toLocaleDateString()
                                : "—"}
                            </td>

                          </tr>

                        )
                      )}

                    </tbody>

                  </table>

                </div>

              )}

            </div>


            {/* ========================================
                PRINT FOOTER
                ======================================== */}

            <div className="print-only report-print-footer">

              <p>
                Total equipment shown:{" "}
                <strong>
                  {filteredItems.length}
                </strong>
              </p>

              <p>
                Equipment Tracker — Inventory Report
              </p>

            </div>

          </>

        )}

      </div>

    </div>
  );
}