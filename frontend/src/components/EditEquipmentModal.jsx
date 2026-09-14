import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../api";

const DEPARTMENTS = [
  "Post Production",
  "IT",
  "Social Media",
];

export default function EditEquipmentModal({
  equipment,
  onClose,
  onUpdated,
}) {
  const { token } = useAuth();

  const [name, setName] = useState(
    equipment?.name || ""
  );

  const [serialNumber, setSerialNumber] =
    useState(
      equipment?.serial_number || ""
    );

  const [department, setDepartment] =
    useState(
      equipment?.department || ""
    );

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  useEffect(() => {
    if (!equipment) return;

    setName(equipment.name || "");
    setSerialNumber(
      equipment.serial_number || ""
    );
    setDepartment(
      equipment.department || ""
    );
    setError("");
  }, [equipment]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    if (!name.trim()) {
      setError(
        "Equipment name is required."
      );
      return;
    }

    if (!department) {
      setError(
        "Please select a department."
      );
      return;
    }

    if (
      (department === "IT" ||
        department === "Social Media") &&
      !serialNumber.trim()
    ) {
      setError(
        "A serial number is required for IT and Social Media equipment."
      );
      return;
    }

    setSaving(true);

    try {
      const result =
        await api.updateEquipment(
          token,
          equipment.id,
          {
            name: name.trim(),
            serial_number:
              serialNumber.trim() || null,
            department,
          }
        );

      onUpdated(result.item);

      onClose();
    } catch (err) {
      setError(
        err.message ||
          "Unable to update equipment."
      );
    } finally {
      setSaving(false);
    }
  };

  if (!equipment) {
    return null;
  }

  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
    >
      <div
  className="modal edit-equipment-modal"
  onClick={(e) =>
    e.stopPropagation()
  }
>

        <div className="modal-header">
          <div>
            <p className="eyebrow">
              Equipment
            </p>

            <h3>
              Edit equipment
            </h3>
          </div>

          <button
            className="close-x"
            onClick={onClose}
            type="button"
          >
            ×
          </button>
        </div>

        <div
          style={{
            marginBottom: 18,
            padding: "12px 14px",
            borderRadius: 10,
            background:
              "var(--surface-2, rgba(127,127,127,.08))",
          }}
        >
          <div
            style={{
              fontWeight: 700,
            }}
          >
            {equipment.code}
          </div>

          <div
            className="page-sub"
            style={{
              marginTop: 3,
            }}
          >
            {equipment.category}
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="form-stack"
        >

          <label>
            Equipment name

            <input
              type="text"
              value={name}
              onChange={(e) =>
                setName(e.target.value)
              }
              placeholder="Equipment name"
              disabled={saving}
            />
          </label>

          <label>
            Serial number

            <input
              type="text"
              value={serialNumber}
              onChange={(e) =>
                setSerialNumber(
                  e.target.value
                )
              }
              placeholder="Serial number"
              disabled={saving}
            />
          </label>

          <label>
            Department

            <select
              value={department}
              onChange={(e) =>
                setDepartment(
                  e.target.value
                )
              }
              disabled={saving}
            >
              <option value="">
                Select department
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
          </label>

          {error && (
            <div
              className="form-error"
              style={{
                marginTop: 4,
              }}
            >
              {error}
            </div>
          )}

          <div
            className="modal-actions"
          >
            <button
              type="button"
              className="btn"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving}
            >
              {saving
                ? "Saving…"
                : "Save changes"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}