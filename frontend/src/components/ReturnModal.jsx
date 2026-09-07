import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../api";

const CONDITIONS = [
  { value: "available", label: "Available" },
  { value: "repair", label: "Gone for repair" },
  { value: "out_of_service", label: "Out of service", danger: true },
];

export default function ReturnModal({ booking, onClose, onReturned }) {
  const { token } = useAuth();
  const [status, setStatus] = useState("available");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const noteRequired = status === "repair" || status === "out_of_service";

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    if (noteRequired && !note.trim()) {
      setError("Please add a note describing how the equipment came back.");
      return;
    }

    setSubmitting(true);
    try {
      const { booking: updated } = await api.returnBooking(token, booking.id, {
        status,
        note: note.trim() || undefined,
      });
      onReturned(updated);
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
          <h3>Mark equipment returned</h3>
          <button className="close-x" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <form onSubmit={submit}>
          {error && <div className="form-error">{error}</div>}

          <div className="form-field">
            <label>Equipment</label>
            <input value={`${booking.equipment_name} (${booking.equipment_code})`} disabled />
          </div>

          <div className="form-field">
            <label>Set status after return</label>
            <div className="condition-choice">
              {CONDITIONS.map((option) => (
                <label
                  key={option.value}
                  className={
                    "condition-option" +
                    (option.danger ? " condition-option-danger" : "") +
                    (status === option.value ? " selected" : "")
                  }
                >
                  <input
                    type="radio"
                    name="return_status"
                    value={option.value}
                    checked={status === option.value}
                    onChange={() => setStatus(option.value)}
                  />
                  {option.label}
                </label>
              ))}
            </div>
          </div>

          <div className="form-field">
            <label>Return note {noteRequired ? "(required)" : "(optional)"}</label>
            <textarea
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={
                status === "repair"
                  ? "e.g. Lens is foggy and the battery door is loose"
                  : status === "out_of_service"
                    ? "e.g. Dropped on set, will not power on"
                    : "Describe how the equipment came back"
              }
            />
          </div>

          <p className="form-hint" style={{ marginTop: 4 }}>
            This completes the booking and updates the equipment status.
          </p>

          <div style={{ display: "flex", gap: 10, marginTop: 20, flexWrap: "wrap" }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? "Saving…" : "Confirm return"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
