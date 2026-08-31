
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../api";
import EquipmentCard from "../components/EquipmentCard";
import BookingModal from "../components/BookingModal";
import AddEquipmentModal from "../components/AddEquipmentModal";
import GatePass from "../components/GatePass";

/*
====================================================
DEPARTMENTS
====================================================
These are the ONLY departments used by the
Equipment Tracker.
====================================================
*/

const DEPARTMENTS = [
  "Post Production",
  "IT",
  "Social Media"
];

export default function Dashboard() {
  const {
    token,
    isManager
  } = useAuth();

  const [items, setItems] = useState([]);

  const [loading, setLoading] =
    useState(true);

  const [category, setCategory] =
    useState("all");

  const [department, setDepartment] =
    useState("all");

  const [bookingTarget, setBookingTarget] =
    useState(null);

  const [addOpen, setAddOpen] =
    useState(false);

  const [confirmedPass, setConfirmedPass] =
    useState(null);

  const [toast, setToast] =
    useState(null);

  /*
  ==================================================
  LOAD EQUIPMENT
  ==================================================
  */

  const load = async () => {
    setLoading(true);

    try {
      const { items } =
        await api.listEquipment(token);

      setItems(items || []);
    } catch (err) {
      setToast({
        type: "error",
        text:
          err.message ||
          "Unable to load equipment."
      });
    } finally {
      setLoading(false);
    }
  };

  /*
  ==================================================
  INITIAL LOAD
  ==================================================
  */

  useEffect(() => {
    load();
  }, []);

  /*
  ==================================================
  TOAST TIMER
  ==================================================
  */

  useEffect(() => {
    if (!toast) return;

    const id = setTimeout(
      () => setToast(null),
      3500
    );

    return () =>
      clearTimeout(id);
  }, [toast]);

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
      ...new Set(values)
    ];
  }, [items]);

  /*
  ==================================================
  FILTER EQUIPMENT
  ==================================================
  */

  const visible = useMemo(() => {
    return items.filter((item) => {
      const categoryMatches =
        category === "all" ||
        item.category === category;

      const departmentMatches =
        department === "all" ||
        item.department === department;

      return (
        categoryMatches &&
        departmentMatches
      );
    });
  }, [
    items,
    category,
    department
  ]);

  /*
  ==================================================
  DELETE EQUIPMENT
  ==================================================
  */

  const handleDelete = async (
    item
  ) => {
    const confirmed = window.confirm(
      `Delete ${item.name} (${item.code})? This can't be undone.`
    );

    if (!confirmed) return;

    try {
      await api.deleteEquipment(
        token,
        item.id
      );

      setItems((prev) =>
        prev.filter(
          (i) => i.id !== item.id
        )
      );

      setToast({
        type: "ok",
        text: `${item.name} was deleted.`
      });
    } catch (err) {
      setToast({
        type: "error",
        text:
          err.message ||
          "Unable to delete equipment."
      });
    }
  };

  /*
  ==================================================
  CHANGE EQUIPMENT STATUS
  ==================================================
  */

  const handleSetStatus = async (
    item,
    status
  ) => {
    try {
      const { item: updated } =
        await api.setEquipmentStatus(
          token,
          item.id,
          status
        );

      setItems((prev) =>
        prev.map((i) =>
          i.id === updated.id
            ? updated
            : i
        )
      );

      setToast({
        type: "ok",
        text: `${updated.name} status updated.`
      });
    } catch (err) {
      setToast({
        type: "error",
        text:
          err.message ||
          "Unable to update equipment status."
      });
    }
  };

  /*
  ==================================================
  BOOKING COMPLETED
  ==================================================
  */

  const handleBooked = (
    booking
  ) => {
    setBookingTarget(null);
    setConfirmedPass(booking);

    load();
  };

  /*
  ==================================================
  ADD EQUIPMENT
  ==================================================
  */

  const handleAdded = (
    item
  ) => {
    setItems((prev) => [
      item,
      ...prev
    ]);

    setAddOpen(false);

    /*
    If the new equipment belongs to one of
    the three departments, keep the normal
    dashboard filters intact.
    */
  };

  /*
  ==================================================
  RENDER
  ==================================================
  */

  return (
    <div className="page">

      <div className="container">

        {/* ==========================================
            PAGE HEADER
            ========================================== */}

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

          {isManager && (
            <button
              className="btn btn-primary"
              onClick={() =>
                setAddOpen(true)
              }
            >
              + Add equipment
            </button>
          )}

        </div>


        {/* ==========================================
            DEPARTMENT FILTER
            ========================================== */}

        <div
          style={{
            marginBottom: 8
          }}
        >

          <p
            className="eyebrow"
            style={{
              marginBottom: 8
            }}
          >
            Department
          </p>

          <div
            className="tabs tabs-scroll"
            style={{
              borderBottom: "none",
              marginBottom: 0
            }}
          >

            <button
              className={
                "tab-btn" +
                (department === "all"
                  ? " active"
                  : "")
              }
              onClick={() =>
                setDepartment("all")
              }
            >
              All departments
            </button>

            {DEPARTMENTS.map(
              (dept) => (
                <button
                  key={dept}
                  className={
                    "tab-btn" +
                    (department === dept
                      ? " active"
                      : "")
                  }
                  onClick={() =>
                    setDepartment(dept)
                  }
                >
                  {dept}
                </button>
              )
            )}

          </div>

        </div>


        {/* ==========================================
            CATEGORY FILTER
            ========================================== */}

        <div
          style={{
            marginBottom: 20
          }}
        >

          <p
            className="eyebrow"
            style={{
              marginBottom: 8
            }}
          >
            Category
          </p>

          <div
            className="tabs tabs-scroll"
            style={{
              borderBottom: "none",
              marginBottom: 0
            }}
          >

            {categories.map(
              (c) => (
                <button
                  key={c}
                  className={
                    "tab-btn" +
                    (category === c
                      ? " active"
                      : "")
                  }
                  onClick={() =>
                    setCategory(c)
                  }
                >
                  {c === "all"
                    ? "All categories"
                    : c}
                </button>
              )
            )}

          </div>

        </div>


        {/* ==========================================
            EQUIPMENT
            ========================================== */}

        {loading ? (

          <div className="empty-state">
            Loading equipment…
          </div>

        ) : visible.length === 0 ? (

          <div className="empty-state">
            No equipment matches these filters.
          </div>

        ) : (

          <div className="equipment-grid">

            {visible.map(
              (item) => (
                <EquipmentCard
                  key={item.id}
                  item={item}
                  isManager={isManager}
                  onBook={
                    setBookingTarget
                  }
                  onDelete={
                    handleDelete
                  }
                  onSetStatus={
                    handleSetStatus
                  }
                />
              )
            )}

          </div>

        )}

      </div>


      {/* ============================================
          BOOKING MODAL
          ============================================ */}

      {bookingTarget && (
        <BookingModal
          equipment={
            bookingTarget
          }
          onClose={() =>
            setBookingTarget(null)
          }
          onBooked={
            handleBooked
          }
        />
      )}


      {/* ============================================
          ADD EQUIPMENT MODAL
          ============================================ */}

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


      {/* ============================================
          CONFIRMED GATE PASS
          ============================================ */}

      {confirmedPass && (
        <div
          className="modal-backdrop"
          onClick={() =>
            setConfirmedPass(null)
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
                marginBottom: 16
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


      {/* ============================================
          TOAST
          ============================================ */}

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

