const LABELS = {
  available: "Available",
  booked: "Booked",
  repair: "In repair",
  out_of_service: "Out of service",
};

export default function StatusPill({ status }) {
  return (
    <span className={`status-pill status-${status}`}>
      <span className="status-dot" />
      {LABELS[status] || status}
    </span>
  );
}