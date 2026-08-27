import StatusPill from "./StatusPill";

export default function EquipmentCard({ item, isManager, onBook, onDelete, onSetStatus }) {
  return (
    <div className="eq-card" style={{ "--status-color": `var(--${statusVar(item.status)})` }}>
      <div className="eq-top">
        <div>
          <div className="eq-code">{item.code}</div>
          <h3 className="eq-name">{item.name}</h3>
          <div className="eq-category">{item.category}</div>
        </div>
        <StatusPill status={item.status} />
      </div>

      <div className="eq-actions">
        {!isManager && (
          <button className="btn btn-primary btn-sm" disabled={item.status !== "available"} onClick={() => onBook(item)}>
            {item.status === "available" ? "Request booking" : "Not available"}
          </button>
        )}
      </div>

      {isManager && (
        <div className="eq-manager-row">
          <button
            className="btn btn-ghost btn-sm"
            disabled={item.status === "available"}
            onClick={() => onSetStatus(item, "available")}
          >
            Mark available
          </button>
          <button
            className="btn btn-ghost btn-sm"
            disabled={item.status === "repair"}
            onClick={() => onSetStatus(item, "repair")}
          >
            Send to repair
          </button>
          <button className="btn btn-danger btn-sm" onClick={() => onDelete(item)}>
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

function statusVar(status) {
  if (status === "available") return "ok";
  if (status === "booked") return "wait";
  return "bad";
}
