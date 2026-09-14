import StatusPill from "./StatusPill";

export default function EquipmentCard({
  item,
  isManager,
  onBook,
  onDelete,
  onSetStatus,
  onEdit,
}) {
  return (
    <div
      className="eq-card"
      style={{
        "--status-color": `var(--${statusVar(
          item.status
        )})`,
      }}
    >

      {/* ==================================================
          EQUIPMENT HEADER
          ================================================== */}

      <div className="eq-top">

        <div>

          <div className="eq-code">
            {item.code}
          </div>

          <h3 className="eq-name">
            {item.name}
          </h3>

          <div className="eq-category">
            {item.category}
          </div>

        </div>

        <StatusPill
          status={item.status}
        />

      </div>


      {/* ==================================================
          EQUIPMENT INFORMATION
          ================================================== */}

      <div className="eq-details">

        <div className="eq-detail">

          <span className="eq-detail-label">
            Department
          </span>

          <span className="eq-detail-value">
            {item.department ||
              "Not assigned"}
          </span>

        </div>


        <div className="eq-detail">

          <span className="eq-detail-label">
            Serial Number
          </span>

          <span className="eq-detail-value">
            {item.serial_number ||
              "Not assigned"}
          </span>

        </div>

      </div>


      {/* ==================================================
          STAFF ACTIONS
          ================================================== */}

      <div className="eq-actions">

        {!isManager && (
          <button
            className="btn btn-primary btn-sm"
            disabled={
              item.status !== "available"
            }
            onClick={() =>
              onBook(item)
            }
          >
            {item.status ===
            "available"
              ? "Request booking"
              : "Not available"}
          </button>
        )}

      </div>


      {/* ==================================================
          MANAGER ACTIONS
          ================================================== */}

      {isManager && (
        <div className="eq-manager-row">

          {/* EDIT */}

          <button
            className="btn btn-secondary btn-sm"
            onClick={() =>
              onEdit(item)
            }
          >
            Edit
          </button>


          {/* MARK AVAILABLE */}

          <button
            className="btn btn-ghost btn-sm"
            disabled={
              item.status ===
              "available"
            }
            onClick={() =>
              onSetStatus(
                item,
                "available"
              )
            }
          >
            Mark available
          </button>


          {/* SEND TO REPAIR */}

          <button
            className="btn btn-ghost btn-sm"
            disabled={
              item.status === "repair"
            }
            onClick={() =>
              onSetStatus(
                item,
                "repair"
              )
            }
          >
            Send to repair
          </button>


          {/* DELETE */}

          <button
            className="btn btn-danger btn-sm"
            onClick={() =>
              onDelete(item)
            }
          >
            Delete
          </button>

        </div>
      )}

    </div>
  );
}


/* ==================================================
   STATUS COLOUR
   ================================================== */

function statusVar(status) {

  if (status === "available") {
    return "ok";
  }

  if (status === "booked") {
    return "wait";
  }

  return "bad";
}