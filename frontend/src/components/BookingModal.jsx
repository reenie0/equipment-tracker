
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../api";

export default function BookingModal({
  equipment,
  onClose,
  onBooked,
}) {
  const { token, user } = useAuth();

  const [purpose, setPurpose] = useState("");
  const [duration, setDuration] = useState("2");

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    // Equipment must exist
    if (!equipment?.id) {
      return setError("No equipment was selected.");
    }

    // Purpose is required by the database
    if (!purpose.trim()) {
      return setError(
        "Please explain what you will use the equipment for."
      );
    }

    // Convert duration to a number
    const durationHours = Number(duration);

    // Validate duration
    if (!duration || Number.isNaN(durationHours)) {
      return setError(
        "Please enter how many hours you need the equipment."
      );
    }

    if (durationHours <= 0) {
      return setError(
        "Duration must be greater than 0 hours."
      );
    }

    setSubmitting(true);

    try {
      /*
       * The backend will automatically determine:
       *
       * requester_id
       * requester_name
       * status = pending
       * requested_at
       *
       * The frontend only submits the fields the user
       * is allowed to provide.
       */
      const { booking } = await api.createBooking(token, {
        equipment_id: equipment.id,
        purpose: purpose.trim(),
        duration_hours: durationHours,
      });

      onBooked(booking);
    } catch (err) {
      setError(
        err?.message ||
          "Failed to submit the equipment request."
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
        {/* HEADER */}
        <div className="modal-header">
          <h3>Request Equipment</h3>

          <button
            type="button"
            className="close-x"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <form onSubmit={submit}>
          {/* ERROR */}
          {error && (
            <div className="form-error">
              {error}
            </div>
          )}

          {/* EQUIPMENT */}
          <div className="form-field">
            <label htmlFor="booking-equipment">
              Equipment
            </label>

            <input
              id="booking-equipment"
              value={
                equipment
                  ? `${equipment.name} (${equipment.code})`
                  : ""
              }
              disabled
            />
          </div>

          {/* CATEGORY */}
          {equipment?.category && (
            <div className="form-field">
              <label htmlFor="booking-category">
                Category
              </label>

              <input
                id="booking-category"
                value={equipment.category}
                disabled
              />
            </div>
          )}

          {/* DEPARTMENT */}
          {equipment?.department && (
            <div className="form-field">
              <label htmlFor="booking-department">
                Department
              </label>

              <input
                id="booking-department"
                value={equipment.department}
                disabled
              />
            </div>
          )}

          {/* REQUESTER */}
          <div className="form-field">
            <label htmlFor="booking-requester">
              Requested By
            </label>

            <input
              id="booking-requester"
              value={user?.name || ""}
              disabled
            />
          </div>

          {/* REQUESTER DEPARTMENT */}
          {user?.department && (
            <div className="form-field">
              <label htmlFor="requester-department">
                Requester's Department
              </label>

              <input
                id="requester-department"
                value={user.department}
                disabled
              />
            </div>
          )}

          {/* PURPOSE */}
          <div className="form-field">
            <label htmlFor="booking-purpose">
              Purpose
            </label>

            <textarea
              id="booking-purpose"
              rows={4}
              value={purpose}
              onChange={(e) =>
                setPurpose(e.target.value)
              }
              placeholder="Explain what you will use this equipment for..."
              required
            />

            <small>
              Please provide a clear reason for requesting
              this equipment.
            </small>
          </div>

          {/* DURATION */}
          <div className="form-field">
            <label htmlFor="booking-duration">
              Duration (hours)
            </label>

            <input
              id="booking-duration"
              type="number"
              min="0.5"
              step="0.5"
              value={duration}
              onChange={(e) =>
                setDuration(e.target.value)
              }
              required
            />

            <small>
              Enter the number of hours you expect to use
              the equipment.
            </small>
          </div>

          {/* REQUEST STATUS */}
          <div
            style={{
              marginTop: 15,
              padding: 12,
              borderRadius: 8,
              background: "#f5f5f5",
              fontSize: 14,
            }}
          >
            <strong>Request status:</strong>{" "}
            Pending manager approval
          </div>

          {/* BUTTONS */}
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
                ? "Submitting..."
                : "Submit Request"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
