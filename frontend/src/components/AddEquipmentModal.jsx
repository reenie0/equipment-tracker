
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../api";

const EQUIPMENT_DEPARTMENTS = [
  "Post Production",
  "IT",
  "Social Media",
];

export default function AddEquipmentModal({ onClose, onAdded }) {
  const { token } = useAuth();

  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [department, setDepartment] = useState(
    EQUIPMENT_DEPARTMENTS[0]
  );
  const [serialNumber, setSerialNumber] = useState("");
  const [notes, setNotes] = useState("");

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    // Validate required database fields
    if (!code.trim()) {
      return setError("Equipment ID is required.");
    }

    if (!name.trim()) {
      return setError("Equipment name is required.");
    }

    if (!category.trim()) {
      return setError("Category is required.");
    }

    if (!department) {
      return setError("Please select a department.");
    }

    setSubmitting(true);

    try {
      const { item } = await api.addEquipment(token, {
        code: code.trim(),
        name: name.trim(),
        category: category.trim(),
        department,
        serial_number: serialNumber.trim() || null,
        notes: notes.trim() || null,
      });

      onAdded(item);
    } catch (err) {
      setError(
        err?.message || "Failed to add equipment."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
    >
      <div
        className="modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3>Add Equipment</h3>

          <button
            className="close-x"
            onClick={onClose}
            aria-label="Close"
            type="button"
          >
            ×
          </button>
        </div>

        <form onSubmit={submit}>
          {error && (
            <div className="form-error">
              {error}
            </div>
          )}

          {/* Equipment ID */}
          <div className="form-field">
            <label htmlFor="equipment-code">
              Equipment ID
            </label>

            <input
              id="equipment-code"
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="e.g. PP-056"
              autoComplete="off"
            />
          </div>

          {/* Equipment Name */}
          <div className="form-field">
            <label htmlFor="equipment-name">
              Equipment Name
            </label>

            <input
              id="equipment-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Sony Camera"
              autoComplete="off"
            />
          </div>

          {/* Category */}
          <div className="form-field">
            <label htmlFor="equipment-category">
              Category
            </label>

            <input
              id="equipment-category"
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g. Cameras"
              autoComplete="off"
            />
          </div>

          {/* Department */}
          <div className="form-field">
            <label htmlFor="equipment-department">
              Department
            </label>

            <select
              id="equipment-department"
              value={department}
              onChange={(e) =>
                setDepartment(e.target.value)
              }
            >
              {EQUIPMENT_DEPARTMENTS.map(
                (departmentName) => (
                  <option
                    key={departmentName}
                    value={departmentName}
                  >
                    {departmentName}
                  </option>
                )
              )}
            </select>
          </div>

          {/* Serial Number */}
          <div className="form-field">
            <label htmlFor="equipment-serial">
              Serial Number
            </label>

            <input
              id="equipment-serial"
              type="text"
              value={serialNumber}
              onChange={(e) =>
                setSerialNumber(e.target.value)
              }
              placeholder="Enter physical serial number"
              autoComplete="off"
            />

            <small>
              Optional. This can be added later if the
              physical serial number is not available.
            </small>
          </div>

          {/* Notes */}
          <div className="form-field">
            <label htmlFor="equipment-notes">
              Notes
            </label>

            <textarea
              id="equipment-notes"
              rows={3}
              value={notes}
              onChange={(e) =>
                setNotes(e.target.value)
              }
              placeholder="Optional equipment notes..."
            />
          </div>

          {/* Buttons */}
          <div
            style={{
              display: "flex",
              gap: 10,
              marginTop: 20,
            }}
          >
            <button
              type="button"
              className="btn btn-ghost"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting
                ? "Adding..."
                : "Add Equipment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

