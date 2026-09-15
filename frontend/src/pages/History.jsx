import { useEffect, useMemo, useState } from "react";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";


export default function History() {
  const { token } = useAuth();

  const [activeTab, setActiveTab] = useState("all");

  const [history, setHistory] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [returns, setReturns] = useState([]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadHistory();
  }, [token]);

  async function loadHistory() {
    if (!token) return;

    try {
      setLoading(true);
      setError("");

      const [
        historyData,
        allocationData,
        returnData,
      ] = await Promise.all([
        api.listHistory(token),
        api.listAllocationHistory(token),
        api.listReturnHistory(token),
      ]);

      setHistory(historyData?.history || []);
      setAllocations(
        allocationData?.allocations || []
      );
      setReturns(returnData?.returns || []);
    } catch (err) {
      console.error("History loading error:", err);

      setError(
        err.message ||
          "Unable to load history."
      );
    } finally {
      setLoading(false);
    }
  }

  /*
  ==================================================
  FORMAT DATE
  ==================================================
  */

  function formatDate(value) {
    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleString();
  }

  /*
  ==================================================
  STATUS LABEL
  ==================================================
  */

  function statusLabel(status) {
    if (!status) return "—";

    switch (status) {
      case "pending":
        return "Pending";

      case "accepted":
        return "Accepted";

      case "rejected":
        return "Rejected";

      case "completed":
        return "Completed";

      case "available":
        return "Available";

      case "repair":
        return "Repair";

      case "out_of_service":
        return "Out of Service";

      default:
        return status;
    }
  }

  /*
  ==================================================
  STATUS CLASS
  ==================================================
  */

  function statusClass(status) {
    switch (status) {
      case "accepted":
        return "history-status accepted";

      case "pending":
        return "history-status pending";

      case "rejected":
        return "history-status rejected";

      case "completed":
        return "history-status completed";

      case "available":
        return "history-status available";

      case "repair":
        return "history-status repair";

      case "out_of_service":
        return "history-status out-of-service";

      default:
        return "history-status";
    }
  }

  /*
  ==================================================
  SEARCH HELPER
  ==================================================
  */

  function matchesSearch(item) {
    if (!search.trim()) {
      return true;
    }

    const searchText =
      search.toLowerCase();

    return [
      item.employee_name,
      item.employee_department,
      item.equipment_name,
      item.equipment_code,
      item.serial_number,
      item.purpose,
      item.booking_status,
      item.return_status,
      item.return_note,
      item.manager_note,
      item.decision_manager,
      item.return_manager,
      item.gate_pass_code,
    ]
      .filter(Boolean)
      .some(value =>
        String(value)
          .toLowerCase()
          .includes(searchText)
      );
  }

  /*
  ==================================================
  FILTER DATA
  ==================================================
  */

  const filteredHistory = useMemo(() => {
    return history.filter(item => {
      const matchesStatus =
        statusFilter === "all" ||
        item.booking_status ===
          statusFilter ||
        item.return_status ===
          statusFilter;

      return (
        matchesStatus &&
        matchesSearch(item)
      );
    });
  }, [
    history,
    search,
    statusFilter,
  ]);

  const filteredAllocations = useMemo(() => {
    return allocations.filter(item => {
      const matchesStatus =
        statusFilter === "all" ||
        item.booking_status ===
          statusFilter;

      return (
        matchesStatus &&
        matchesSearch(item)
      );
    });
  }, [
    allocations,
    search,
    statusFilter,
  ]);

  const filteredReturns = useMemo(() => {
    return returns.filter(item => {
      const matchesStatus =
        statusFilter === "all" ||
        item.booking_status ===
          statusFilter ||
        item.return_status ===
          statusFilter;

      return (
        matchesStatus &&
        matchesSearch(item)
      );
    });
  }, [
    returns,
    search,
    statusFilter,
  ]);

  /*
  ==================================================
  SUMMARY COUNTS
  ==================================================
  */

  const pendingCount =
    history.filter(
      item =>
        item.booking_status ===
        "pending"
    ).length;

  const acceptedCount =
    history.filter(
      item =>
        item.booking_status ===
        "accepted"
    ).length;

  const completedCount =
    history.filter(
      item =>
        item.booking_status ===
        "completed"
    ).length;

  const returnedCount =
    returns.length;

  /*
  ==================================================
  PRINT
  ==================================================
  */

  function handlePrint() {
    window.print();
  }

  /*
  ==================================================
  LOADING
  ==================================================
  */

  if (loading) {
    return (
      <main className="history-page">
        <div className="history-container">
          <div className="history-loading">
            Loading history...
          </div>
        </div>
      </main>
    );
  }

  /*
  ==================================================
  ERROR
  ==================================================
  */

  if (error) {
    return (
      <main className="history-page">
        <div className="history-container">
          <div className="history-header">
            <div>
              <h1>History</h1>
              <p>
                View equipment bookings,
                allocations and returns.
              </p>
            </div>
          </div>

          <div className="history-error">
            <strong>
              Unable to load history
            </strong>

            <p>{error}</p>

            <button
              className="history-btn primary"
              onClick={loadHistory}
            >
              Try Again
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="history-page">

      <div className="history-container">

        {/* ==================================================
            HEADER
            ================================================== */}

        <div className="history-header">

          <div>
            <h1>History</h1>

            <p>
              View equipment bookings,
              allocations and returns.
            </p>
          </div>

          <div className="history-actions">

            <button
              className="history-btn secondary"
              onClick={loadHistory}
            >
              ↻ Refresh
            </button>

            <button
              className="history-btn primary"
              onClick={handlePrint}
            >
              🖨 Print
            </button>

          </div>

        </div>


        {/* ==================================================
            SUMMARY CARDS
            ================================================== */}

        <div className="history-summary">

          <div className="history-card">

            <span className="history-card-label">
              Total Records
            </span>

            <strong>
              {history.length}
            </strong>

          </div>

          <div className="history-card">

            <span className="history-card-label">
              Pending
            </span>

            <strong>
              {pendingCount}
            </strong>

          </div>

          <div className="history-card">

            <span className="history-card-label">
              Active Bookings
            </span>

            <strong>
              {acceptedCount}
            </strong>

          </div>

          <div className="history-card">

            <span className="history-card-label">
              Completed
            </span>

            <strong>
              {completedCount}
            </strong>

          </div>

          <div className="history-card">

            <span className="history-card-label">
              Returned
            </span>

            <strong>
              {returnedCount}
            </strong>

          </div>

        </div>


        {/* ==================================================
            TABS
            ================================================== */}

        <div className="history-tabs">

          <button
            className={
              activeTab === "all"
                ? "history-tab active"
                : "history-tab"
            }
            onClick={() =>
              setActiveTab("all")
            }
          >
            All History
            <span>
              {history.length}
            </span>
          </button>

          <button
            className={
              activeTab === "allocations"
                ? "history-tab active"
                : "history-tab"
            }
            onClick={() =>
              setActiveTab(
                "allocations"
              )
            }
          >
            Allocations / Booking
            <span>
              {allocations.length}
            </span>
          </button>

          <button
            className={
              activeTab === "returns"
                ? "history-tab active"
                : "history-tab"
            }
            onClick={() =>
              setActiveTab("returns")
            }
          >
            Returns
            <span>
              {returns.length}
            </span>
          </button>

        </div>


        {/* ==================================================
            FILTERS
            ================================================== */}

        <div className="history-filters">

          <div className="history-search">

            <span>🔎</span>

            <input
              type="text"
              placeholder="Search employee, equipment, code, serial number..."
              value={search}
              onChange={event =>
                setSearch(
                  event.target.value
                )
              }
            />

          </div>

          <select
            value={statusFilter}
            onChange={event =>
              setStatusFilter(
                event.target.value
              )
            }
          >
            <option value="all">
              All Statuses
            </option>

            <option value="pending">
              Pending
            </option>

            <option value="accepted">
              Accepted
            </option>

            <option value="rejected">
              Rejected
            </option>

            <option value="completed">
              Completed
            </option>

            <option value="available">
              Available
            </option>

            <option value="repair">
              Repair
            </option>

            <option value="out_of_service">
              Out of Service
            </option>

          </select>

          {(search ||
            statusFilter !==
              "all") && (

            <button
              className="history-clear"
              onClick={() => {
                setSearch("");
                setStatusFilter("all");
              }}
            >
              Clear Filters
            </button>

          )}

        </div>


        {/* ==================================================
            ALL HISTORY
            ================================================== */}

        {activeTab === "all" && (

          <section className="history-section">

            <div className="history-section-header">

              <div>
                <h2>
                  All History
                </h2>

                <p>
                  Complete record of
                  equipment requests,
                  bookings and returns.
                </p>
              </div>

              <span className="history-record-count">
                {filteredHistory.length} records
              </span>

            </div>


            <div className="history-table-wrapper">

              <table className="history-table">

                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Department</th>
                    <th>Equipment</th>
                    <th>Code</th>
                    <th>Serial Number</th>
                    <th>Requested</th>
                    <th>Expected Return</th>
                    <th>Booking Status</th>
                    <th>Return Status</th>
                    <th>Returned</th>
                  </tr>
                </thead>

                <tbody>

                  {filteredHistory.length === 0 ? (

                    <tr>
                      <td
                        colSpan="10"
                        className="history-empty"
                      >
                        No history records found.
                      </td>
                    </tr>

                  ) : (

                    filteredHistory.map(item => (

                      <tr key={item.id}>

                        <td>
                          <strong>
                            {item.employee_name ||
                              "—"}
                          </strong>
                        </td>

                        <td>
                          {item.employee_department ||
                            "—"}
                        </td>

                        <td>
                          {item.equipment_name ||
                            "—"}
                        </td>

                        <td>
                          <span className="equipment-code">
                            {item.equipment_code ||
                              "—"}
                          </span>
                        </td>

                        <td>
                          {item.serial_number ||
                            "—"}
                        </td>

                        <td>
                          {formatDate(
                            item.requested_at
                          )}
                        </td>

                        <td>
                          {formatDate(
                            item.expires_at
                          )}
                        </td>

                        <td>
                          <span
                            className={statusClass(
                              item.booking_status
                            )}
                          >
                            {statusLabel(
                              item.booking_status
                            )}
                          </span>
                        </td>

                        <td>
                          {item.return_status ? (
                            <span
                              className={statusClass(
                                item.return_status
                              )}
                            >
                              {statusLabel(
                                item.return_status
                              )}
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>

                        <td>
                          {formatDate(
                            item.returned_at
                          )}
                        </td>

                      </tr>

                    ))

                  )}

                </tbody>

              </table>

            </div>

          </section>

        )}


        {/* ==================================================
            ALLOCATION / BOOKING HISTORY
            ================================================== */}

        {activeTab === "allocations" && (

          <section className="history-section">

            <div className="history-section-header">

              <div>
                <h2>
                  Allocations / Booking
                </h2>

                <p>
                  Equipment requests,
                  approvals and booking
                  information.
                </p>
              </div>

              <span className="history-record-count">
                {filteredAllocations.length} records
              </span>

            </div>


            <div className="history-table-wrapper">

              <table className="history-table">

                <thead>

                  <tr>
                    <th>Employee</th>
                    <th>Department</th>
                    <th>Equipment</th>
                    <th>Code</th>
                    <th>Serial Number</th>
                    <th>Purpose</th>
                    <th>Requested</th>
                    <th>Expected Return</th>
                    <th>Status</th>
                    <th>Approved By</th>
                  </tr>

                </thead>

                <tbody>

                  {filteredAllocations.length ===
                  0 ? (

                    <tr>
                      <td
                        colSpan="10"
                        className="history-empty"
                      >
                        No allocation records
                        found.
                      </td>
                    </tr>

                  ) : (

                    filteredAllocations.map(
                      item => (

                        <tr key={item.id}>

                          <td>
                            <strong>
                              {item.employee_name ||
                                "—"}
                            </strong>
                          </td>

                          <td>
                            {item.employee_department ||
                              "—"}
                          </td>

                          <td>
                            {item.equipment_name ||
                              "—"}
                          </td>

                          <td>
                            <span className="equipment-code">
                              {item.equipment_code ||
                                "—"}
                            </span>
                          </td>

                          <td>
                            {item.serial_number ||
                              "—"}
                          </td>

                          <td>
                            {item.purpose ||
                              "—"}
                          </td>

                          <td>
                            {formatDate(
                              item.requested_at
                            )}
                          </td>

                          <td>
                            {formatDate(
                              item.expires_at
                            )}
                          </td>

                          <td>
                            <span
                              className={statusClass(
                                item.booking_status
                              )}
                            >
                              {statusLabel(
                                item.booking_status
                              )}
                            </span>
                          </td>

                          <td>
                            {item.decision_manager ||
                              "—"}
                          </td>

                        </tr>

                      )
                    )

                  )}

                </tbody>

              </table>

            </div>

          </section>

        )}


        {/* ==================================================
            RETURN HISTORY
            ================================================== */}

        {activeTab === "returns" && (

          <section className="history-section">

            <div className="history-section-header">

              <div>
                <h2>
                  Return History
                </h2>

                <p>
                  Equipment that has been
                  returned and its recorded
                  condition.
                </p>
              </div>

              <span className="history-record-count">
                {filteredReturns.length} records
              </span>

            </div>


            <div className="history-table-wrapper">

              <table className="history-table">

                <thead>

                  <tr>
                    <th>Equipment</th>
                    <th>Code</th>
                    <th>Serial Number</th>
                    <th>Booked By</th>
                    <th>Department</th>
                    <th>Booking Status</th>
                    <th>Return Condition</th>
                    <th>Return Note</th>
                    <th>Returned Date</th>
                    <th>Returned By</th>
                  </tr>

                </thead>

                <tbody>

                  {filteredReturns.length ===
                  0 ? (

                    <tr>
                      <td
                        colSpan="10"
                        className="history-empty"
                      >
                        No returned equipment
                        found.
                      </td>
                    </tr>

                  ) : (

                    filteredReturns.map(
                      item => (

                        <tr key={item.id}>

                          <td>
                            <strong>
                              {item.equipment_name ||
                                "—"}
                            </strong>
                          </td>

                          <td>
                            <span className="equipment-code">
                              {item.equipment_code ||
                                "—"}
                            </span>
                          </td>

                          <td>
                            {item.serial_number ||
                              "—"}
                          </td>

                          <td>
                            {item.employee_name ||
                              "—"}
                          </td>

                          <td>
                            {item.employee_department ||
                              "—"}
                          </td>

                          <td>
                            <span
                              className={statusClass(
                                item.booking_status
                              )}
                            >
                              {statusLabel(
                                item.booking_status
                              )}
                            </span>
                          </td>

                          <td>
                            <span
                              className={statusClass(
                                item.return_status
                              )}
                            >
                              {statusLabel(
                                item.return_status
                              )}
                            </span>
                          </td>

                          <td className="return-note">
                            {item.return_note ||
                              "—"}
                          </td>

                          <td>
                            {formatDate(
                              item.returned_at
                            )}
                          </td>

                          <td>
                            {item.return_manager ||
                              "—"}
                          </td>

                        </tr>

                      )
                    )

                  )}

                </tbody>

              </table>

            </div>

          </section>

        )}

      </div>

    </main>
  );
}