import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../api";

export default function BookingModal({ equipment, onClose, onBooked }) {
  const { token, user } = useAuth();
  const [purpose, setPurpose] = useState("");
  const [duration, setDuration] = useState("2");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!purpose.trim()) return setError("Tell the manager what you'll use this for.");
    if (!duration || Number(duration) <= 0) return setError("Enter how many hours you need it for.");

    setSubmitting(true);
    try {
      const { booking } = await api.createBooking(token, {
        equipment_id: equipment.id,
        purpose: purpose.trim(),
        duration_hours: Number(duration),
      });
      onBooked(booking);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Request gate pass</h3>
          <button className="close-x" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <form onSubmit={submit}>
          {error && <div className="form-error">{error}</div>}

          <div className="form-field">
            <label>Equipment</label>
            <input value={`${equipment.name} (${equipment.code})`} disabled />
          </div>

          <div className="form-field">
            <label>Requested by</label>
            <input value={user?.name || ""} disabled />
          </div>

          <div className="form-field">
            <label>What will you use it for?</label>
            <textarea
              rows={3}
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="e.g. Fixing the fence line on the east perimeter"
            />
          </div>

          <div className="form-field">
            <label>How long will you need it? (hours)</label>
            <input
              type="number"
              min="0.5"
              step="0.5"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
            />
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? "Sending…" : "Submit request"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
