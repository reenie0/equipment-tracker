const STATUS_LABEL = {
  pending: "Awaiting manager approval",
  accepted: "Approved — in use",
  rejected: "Denied",
  completed: "Returned",
};

const STATUS_COLOR = {
  pending: "#8a6420",
  accepted: "#1f7a3f",
  rejected: "#a5322a",
  completed: "#5c5343",
};

export default function GatePass({ booking }) {
  return (
    <div className="gate-pass">
      <div className="gate-pass-top">
        <span className="gate-pass-title">Equipment Gate Pass</span>
        <span className="gate-pass-code">{booking.gate_pass_code}</span>
      </div>

      <div className="gate-pass-grid">
        <div>
          <div className="gp-field-label">Equipment</div>
          <div className="gp-field-value">{booking.equipment_name}</div>
        </div>
        <div>
          <div className="gp-field-label">Equipment ID</div>
          <div className="gp-field-value">{booking.equipment_code}</div>
        </div>
        <div>
          <div className="gp-field-label">Issued to</div>
          <div className="gp-field-value">{booking.requester_name}</div>
        </div>
        <div>
          <div className="gp-field-label">Duration</div>
          <div className="gp-field-value">{booking.duration_hours}h</div>
        </div>
        <div style={{ gridColumn: "1 / -1" }}>
          <div className="gp-field-label">Purpose / use</div>
          <div className="gp-field-value" style={{ fontSize: 14 }}>
            {booking.purpose}
          </div>
        </div>
      </div>

      <div className="gate-pass-status">
        <span style={{ fontSize: 12.5, color: "#6b5a2c" }}>Status</span>
        <span style={{ fontWeight: 700, fontSize: 13, color: STATUS_COLOR[booking.status] }}>
          {STATUS_LABEL[booking.status]}
        </span>
      </div>
    </div>
  );
}
