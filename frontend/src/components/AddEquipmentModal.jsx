import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../api";

export default function AddEquipmentModal({ onClose, onAdded }) {
  const { token } = useAuth();
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!code.trim() || !name.trim() || !category.trim()) {
      return setError("Equipment ID, name, and category are all required.");
    }

    setSubmitting(true);
    try {
      const { item } = await api.addEquipment(token, {
        code: code.trim(),
        name: name.trim(),
        category: category.trim(),
        notes: notes.trim() || null,
      });
      onAdded(item);
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
          <h3>Add equipment</h3>
          <button className="close-x" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <form onSubmit={submit}>
          {error && <div className="form-error">{error}</div>}

          <div className="form-field">
            <label>Equipment ID</label>
            <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g. EQ-1006" />
          </div>

          <div className="form-field">
            <label>Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Pressure Washer" />
          </div>

          <div className="form-field">
            <label>Category</label>
            <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g. Power Tools" />
          </div>

          <div className="form-field">
            <label>Notes (optional)</label>
            <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? "Adding…" : "Add equipment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
