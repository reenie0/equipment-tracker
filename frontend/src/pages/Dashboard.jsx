import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../api";
import EquipmentCard from "../components/EquipmentCard";
import BookingModal from "../components/BookingModal";
import AddEquipmentModal from "../components/AddEquipmentModal";
import GatePass from "../components/GatePass";

export default function Dashboard() {
  const { token, isManager } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("all");
  const [bookingTarget, setBookingTarget] = useState(null);
  const [addOpen, setAddOpen] = useState(false);
  const [confirmedPass, setConfirmedPass] = useState(null);
  const [toast, setToast] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const { items } = await api.listEquipment(token);
      setItems(items);
    } catch (err) {
      setToast({ type: "error", text: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(id);
  }, [toast]);

  const categories = useMemo(() => ["all", ...new Set(items.map((i) => i.category))], [items]);
  const visible = category === "all" ? items : items.filter((i) => i.category === category);

  const handleDelete = async (item) => {
    if (!confirm(`Delete ${item.name} (${item.code})? This can't be undone.`)) return;
    try {
      await api.deleteEquipment(token, item.id);
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      setToast({ type: "ok", text: `${item.name} was deleted.` });
    } catch (err) {
      setToast({ type: "error", text: err.message });
    }
  };

  const handleSetStatus = async (item, status) => {
    try {
      const { item: updated } = await api.setEquipmentStatus(token, item.id, status);
      setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
    } catch (err) {
      setToast({ type: "error", text: err.message });
    }
  };

  const handleBooked = (booking) => {
    setBookingTarget(null);
    setConfirmedPass(booking);
    load();
  };

  return (
    <div className="page">
      <div className="container">
        <div className="page-header">
          <div>
            <p className="eyebrow">Equipment Yard</p>
            <h1 className="page-title">Equipment</h1>
            <p className="page-sub">
              Green means ready to go, yellow means it's out on a job, red means it's in repair.
            </p>
          </div>
          {isManager && (
            <button className="btn btn-primary" onClick={() => setAddOpen(true)}>
              + Add equipment
            </button>
          )}
        </div>

        <div className="tabs" style={{ borderBottom: "none", marginBottom: 20 }}>
          {categories.map((c) => (
            <button
              key={c}
              className={"tab-btn" + (category === c ? " active" : "")}
              onClick={() => setCategory(c)}
            >
              {c === "all" ? "All categories" : c}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="empty-state">Loading equipment…</div>
        ) : visible.length === 0 ? (
          <div className="empty-state">No equipment in this category yet.</div>
        ) : (
          <div className="equipment-grid">
            {visible.map((item) => (
              <EquipmentCard
                key={item.id}
                item={item}
                isManager={isManager}
                onBook={setBookingTarget}
                onDelete={handleDelete}
                onSetStatus={handleSetStatus}
              />
            ))}
          </div>
        )}
      </div>

      {bookingTarget && (
        <BookingModal equipment={bookingTarget} onClose={() => setBookingTarget(null)} onBooked={handleBooked} />
      )}

      {addOpen && (
        <AddEquipmentModal
          onClose={() => setAddOpen(false)}
          onAdded={(item) => {
            setItems((prev) => [item, ...prev]);
            setAddOpen(false);
          }}
        />
      )}

      {confirmedPass && (
        <div className="modal-backdrop" onClick={() => setConfirmedPass(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Request submitted</h3>
              <button className="close-x" onClick={() => setConfirmedPass(null)}>
                ×
              </button>
            </div>
            <p className="page-sub" style={{ marginTop: -6, marginBottom: 16 }}>
              Your gate pass is pending manager approval. Track it under the Requests tab.
            </p>
            <GatePass booking={confirmedPass} />
          </div>
        </div>
      )}

      {toast && <div className={`toast${toast.type === "error" ? " error" : ""}`}>{toast.text}</div>}
    </div>
  );
}
