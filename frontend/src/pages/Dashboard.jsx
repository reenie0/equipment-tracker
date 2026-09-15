import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { useAuth } from "../context/AuthContext";
import { api } from "../api";

import EquipmentCard from "../components/EquipmentCard";
import BookingModal from "../components/BookingModal";
import AddEquipmentModal from "../components/AddEquipmentModal";
import EditEquipmentModal from "../components/EditEquipmentModal";
import GatePass from "../components/GatePass";


/* ==================================================
   EQUIPMENT DEPARTMENTS
   ================================================== */

const DEPARTMENTS = [
  "Post Production",
  "IT",
  "Social Media",
];


/* ==================================================
   EQUIPMENT STATUSES
   ================================================== */

const STATUSES = [
  {
    value: "all",
    label: "All statuses",
  },
  {
    value: "available",
    label: "Available",
  },
  {
    value: "booked",
    label: "Booked",
  },
  {
    value: "repair",
    label: "Repair",
  },
  {
    value: "out_of_service",
    label: "Out of service",
  },
];


export default function Dashboard() {

  const {
    token,
    isManager,
  } = useAuth();


  /* ==================================================
     STATE
     ================================================== */

  const [items, setItems] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [search, setSearch] =
    useState("");

  const [category, setCategory] =
    useState("all");

  const [department, setDepartment] =
    useState("all");

  const [status, setStatus] =
    useState("all");

  const [bookingTarget, setBookingTarget] =
    useState(null);

  const [addOpen, setAddOpen] =
    useState(false);

  const [editTarget, setEditTarget] =
    useState(null);

  const [confirmedPass, setConfirmedPass] =
    useState(null);

  const [toast, setToast] =
    useState(null);


  /* ==================================================
     LOAD EQUIPMENT
     ================================================== */

  const load = async () => {

    setLoading(true);

    try {

      const {
        items,
      } = await api.listEquipment(token);

      setItems(items || []);

    } catch (err) {

      setToast({
        type: "error",
        text:
          err.message ||
          "Unable to load equipment.",
      });

    } finally {

      setLoading(false);

    }
  };


  /* ==================================================
     INITIAL LOAD
     ================================================== */

  useEffect(() => {

    if (token) {
      load();
    }

  }, [token]);


  /* ==================================================
     TOAST TIMER
     ================================================== */

  useEffect(() => {

    if (!toast) return;

    const id =
      setTimeout(
        () => setToast(null),
        3500
      );

    return () =>
      clearTimeout(id);

  }, [toast]);


  /* ==================================================
     CATEGORIES
     ================================================== */

  const categories =
    useMemo(() => {

      const values =
        items
          .map(
            (item) =>
              item.category
          )
          .filter(Boolean);

      return [
        "all",
        ...new Set(values),
      ];

    }, [items]);


  /* ==================================================
     FILTER EQUIPMENT
     ================================================== */

  const visible =
    useMemo(() => {

      const term =
        search
          .trim()
          .toLowerCase();

      return items.filter(
        (item) => {

          /* ------------------------------------------
             CATEGORY FILTER
             ------------------------------------------ */

          const categoryMatches =
            category === "all" ||
            item.category === category;


          /* ------------------------------------------
             DEPARTMENT FILTER
             ------------------------------------------ */

          const departmentMatches =
            department === "all" ||
            item.department === department;


          /* ------------------------------------------
             STATUS FILTER
             ------------------------------------------ */

          const statusMatches =
            status === "all" ||
            item.status === status;


          /* ------------------------------------------
             SEARCH
             ------------------------------------------ */

          const searchMatches =
            !term ||
            [
              item.name,
              item.code,
              item.serial_number,
              item.category,
              item.department,
            ]
              .filter(Boolean)
              .join(" ")
              .toLowerCase()
              .includes(term);


          /* ------------------------------------------
             FINAL RESULT
             ------------------------------------------ */

          return (
            categoryMatches &&
            departmentMatches &&
            statusMatches &&
            searchMatches
          );
        }
      );

    }, [
      items,
      category,
      department,
      status,
      search,
    ]);


  /* ==================================================
     DELETE EQUIPMENT
     ================================================== */

  const handleDelete =
    async (item) => {

      const confirmed =
        window.confirm(
          `Delete ${item.name} (${item.code})? This can't be undone.`
        );

      if (!confirmed) return;

      try {

        await api.deleteEquipment(
          token,
          item.id
        );

        setItems(
          (prev) =>
            prev.filter(
              (i) =>
                i.id !== item.id
            )
        );

        setToast({
          type: "ok",
          text:
            `${item.name} was deleted.`,
        });

      } catch (err) {

        setToast({
          type: "error",
          text:
            err.message ||
            "Unable to delete equipment.",
        });

      }
    };


  /* ==================================================
     CHANGE EQUIPMENT STATUS
     ================================================== */

  const handleSetStatus =
    async (
      item,
      newStatus
    ) => {

      try {

        const {
          item: updated,
        } =
          await api.setEquipmentStatus(
            token,
            item.id,
            newStatus
          );

        setItems(
          (prev) =>
            prev.map(
              (i) =>
                i.id === updated.id
                  ? updated
                  : i
            )
        );

        setToast({
          type: "ok",
          text:
            `${updated.name} status updated.`,
        });

      } catch (err) {

        setToast({
          type: "error",
          text:
            err.message ||
            "Unable to update equipment status.",
        });

      }
    };


  /* ==================================================
     EQUIPMENT EDITED
     ================================================== */

  const handleEquipmentUpdated =
    (updated) => {

      setItems(
        (prev) =>
          prev.map(
            (item) =>
              item.id === updated.id
                ? updated
                : item
          )
      );

      setEditTarget(null);

      setToast({
        type: "ok",
        text:
          `${updated.name} was updated successfully.`,
      });
    };


  /* ==================================================
     BOOKING COMPLETED
     ================================================== */

  const handleBooked =
    (booking) => {

      setBookingTarget(null);

      setConfirmedPass(
        booking
      );

      load();
    };


  /* ==================================================
     ADD EQUIPMENT
     ================================================== */

  const handleAdded =
    (item) => {

      setItems(
        (prev) => [
          item,
          ...prev,
        ]
      );

      setAddOpen(false);

      setToast({
        type: "ok",
        text:
          `${item.name} was added successfully.`,
      });
    };


  /* ==================================================
     CLEAR FILTERS
     ================================================== */

  const clearFilters = () => {

    setSearch("");
    setCategory("all");
    setDepartment("all");
    setStatus("all");

  };


  /* ==================================================
     CHECK WHETHER FILTERS ARE ACTIVE
     ================================================== */

  const filtersActive =
    search.trim() !== "" ||
    category !== "all" ||
    department !== "all" ||
    status !== "all";


  /* ==================================================
     RENDER
     ================================================== */

  return (

    <div className="page">

      <div className="container">


        {/* ==================================================
            PAGE HEADER
            ================================================== */}

        <div className="page-header">

          <div>

            <p className="eyebrow">
              Equipment Yard
            </p>

            <h1 className="page-title">
              Equipment
            </h1>

            <p className="page-sub">
              Green means ready to go,
              amber means it's out on a job,
              red means it's in repair,
              and grey means it's out of service.
            </p>

          </div>


          {/* MANAGER CONTROLS */}

          {isManager && (

            <div
              style={{
                display: "flex",
                gap: 10,
                flexWrap: "wrap",
              }}
            >

              <button
                className="btn"
                onClick={() =>
                  window.location.href =
                    "/reports"
                }
              >
                📊 Reports
              </button>


              <button
                className="btn btn-primary"
                onClick={() =>
                  setAddOpen(true)
                }
              >
                + Add equipment
              </button>

            </div>

          )}

        </div>


        {/* ==================================================
            SEARCH AND FILTERS
            ================================================== */}

        <div className="user-filter-panel">


          {/* FILTER HEADER */}

          <div className="user-filter-header">

            <div>

              <p className="eyebrow">
                Search & Filters
              </p>

              <p className="user-filter-description">
                Find equipment by name, code,
                serial number, department,
                category, or status.
              </p>

            </div>

          </div>


          {/* ==================================================
              SEARCH
              ================================================== */}

          <div
            className="form-field"
            style={{
              marginBottom: 18,
            }}
          >

            <label htmlFor="equipment-search">
              Search equipment
            </label>

            <input
              id="equipment-search"
              type="text"
              placeholder="Search name, code, serial number…"
              value={search}
              onChange={(e) =>
                setSearch(
                  e.target.value
                )
              }
            />

          </div>


          {/* ==================================================
              DROPDOWN FILTERS
              ================================================== */}

          <div className="user-filter-grid">


            {/* DEPARTMENT */}

            <div className="form-field">

              <label htmlFor="equipment-department">
                Department
              </label>

              <select
                id="equipment-department"
                value={department}
                onChange={(e) =>
                  setDepartment(
                    e.target.value
                  )
                }
              >

                <option value="all">
                  All departments
                </option>

                {DEPARTMENTS.map(
                  (dept) => (

                    <option
                      key={dept}
                      value={dept}
                    >
                      {dept}
                    </option>

                  )
                )}

              </select>

            </div>


            {/* CATEGORY */}

            <div className="form-field">

              <label htmlFor="equipment-category">
                Category
              </label>

              <select
                id="equipment-category"
                value={category}
                onChange={(e) =>
                  setCategory(
                    e.target.value
                  )
                }
              >

                <option value="all">
                  All categories
                </option>

                {categories
                  .filter(
                    (item) =>
                      item !== "all"
                  )
                  .map(
                    (item) => (

                      <option
                        key={item}
                        value={item}
                      >
                        {item}
                      </option>

                    )
                  )}

              </select>

            </div>


            {/* STATUS */}

            <div className="form-field">

              <label htmlFor="equipment-status">
                Status
              </label>

              <select
                id="equipment-status"
                value={status}
                onChange={(e) =>
                  setStatus(
                    e.target.value
                  )
                }
              >

                {STATUSES.map(
                  (statusOption) => (

                    <option
                      key={
                        statusOption.value
                      }
                      value={
                        statusOption.value
                      }
                    >
                      {
                        statusOption.label
                      }
                    </option>

                  )
                )}

              </select>

            </div>

          </div>

        </div>


        {/* ==================================================
            FILTER SUMMARY
            ================================================== */}

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
            marginTop: 16,
            marginBottom: 20,
          }}
        >

          <p
            className="page-sub"
            style={{
              margin: 0,
            }}
          >

            Showing{" "}

            <strong>
              {visible.length}
            </strong>{" "}

            of{" "}

            <strong>
              {items.length}
            </strong>{" "}

            equipment items

          </p>


          {filtersActive && (

            <button
              className="btn btn-ghost btn-sm"
              onClick={
                clearFilters
              }
            >
              Clear filters
            </button>

          )}

        </div>


        {/* ==================================================
            EQUIPMENT LIST
            ================================================== */}

        {loading ? (

          <div className="empty-state">
            Loading equipment…
          </div>

        ) : visible.length === 0 ? (

          <div className="empty-state">

            <div
              style={{
                fontSize: 32,
                marginBottom: 10,
              }}
            >
              🔍
            </div>

            <strong>
              No equipment found
            </strong>

            <p
              className="page-sub"
              style={{
                marginTop: 8,
              }}
            >
              No equipment matches your
              current search and filters.
            </p>

            {filtersActive && (

              <button
                className="btn btn-primary btn-sm"
                style={{
                  marginTop: 10,
                }}
                onClick={
                  clearFilters
                }
              >
                Clear filters
              </button>

            )}

          </div>

        ) : (

          <div className="equipment-grid">

            {visible.map(
              (item) => (

                <EquipmentCard
                  key={item.id}

                  item={item}

                  isManager={
                    isManager
                  }

                  onBook={
                    setBookingTarget
                  }

                  onDelete={
                    handleDelete
                  }

                  onSetStatus={
                    handleSetStatus
                  }

                  onEdit={
                    setEditTarget
                  }
                />

              )
            )}

          </div>

        )}

      </div>


      {/* ==================================================
          BOOKING MODAL
          ================================================== */}

      {bookingTarget && (

        <BookingModal

          equipment={
            bookingTarget
          }

          onClose={() =>
            setBookingTarget(
              null
            )
          }

          onBooked={
            handleBooked
          }

        />

      )}


      {/* ==================================================
          ADD EQUIPMENT MODAL
          ================================================== */}

      {addOpen && (

        <AddEquipmentModal

          onClose={() =>
            setAddOpen(false)
          }

          onAdded={
            handleAdded
          }

        />

      )}


      {/* ==================================================
          EDIT EQUIPMENT MODAL
          ================================================== */}

      {editTarget && (

        <EditEquipmentModal

          equipment={
            editTarget
          }

          onClose={() =>
            setEditTarget(null)
          }

          onUpdated={
            handleEquipmentUpdated
          }

        />

      )}


      {/* ==================================================
          CONFIRMED GATE PASS
          ================================================== */}

      {confirmedPass && (

        <div
          className="modal-backdrop"
          onClick={() =>
            setConfirmedPass(
              null
            )
          }
        >

          <div
            className="modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <div className="modal-header">

              <h3>
                Request submitted
              </h3>

              <button
                className="close-x"
                onClick={() =>
                  setConfirmedPass(
                    null
                  )
                }
              >
                ×
              </button>

            </div>


            <p
              className="page-sub"
              style={{
                marginTop: -6,
                marginBottom: 16,
              }}
            >
              Your gate pass is pending
              manager approval. Track it
              under the Requests tab.
            </p>


            <GatePass
              booking={
                confirmedPass
              }
            />

          </div>

        </div>

      )}


      {/* ==================================================
          TOAST
          ================================================== */}

      {toast && (

        <div
          className={
            `toast${
              toast.type === "error"
                ? " error"
                : ""
            }`
          }
        >
          {toast.text}
        </div>

      )}

    </div>

  );
}