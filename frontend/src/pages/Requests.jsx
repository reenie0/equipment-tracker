import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../api";
import Countdown from "../components/Countdown";

const TABS = [
  { key: "pending", label: "Pending" },
  { key: "accepted", label: "Accepted" },
  { key: "rejected", label: "Rejected" },
  { key: "completed", label: "Returned" },
];

const RETURN_LABELS = {
  available: "Available",
  repair: "Gone for repair",
  out_of_service: "Out of service",
};

export default function Requests() {
  const { token } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [tab, setTab] = useState("pending");
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const load = async () => {
    try {
      const { bookings } = await api.listBookings(token);
      setBookings(bookings);
    } catch (err) {
      setToast(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // Accepted bookings auto-expire server-side, so poll periodically to
    // reflect completion without requiring a manual refresh.
    const id = setInterval(load, 15000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(id);
  }, [toast]);

  const grouped = useMemo(
    () => ({
      pending: bookings.filter((b) => b.status === "pending"),
      accepted: bookings.filter((b) => b.status === "accepted"),
      rejected: bookings.filter((b) => b.status === "rejected"),
      completed: bookings.filter((b) => b.status === "completed"),
    }),
    [bookings]
  );

  const visible = grouped[tab];

  return (
    <div className="page">
      <div className="container">
        <div className="page-header">
          <div>
            <p className="eyebrow">My Requests</p>
            <h1 className="page-title">Booking requests</h1>
            <p className="page-sub">Track every gate pass you've requested. A manager marks the equipment returned.</p>
          </div>
        </div>

        <div className="tabs">
          {TABS.map((t) => (
            <button key={t.key} className={"tab-btn" + (tab === t.key ? " active" : "")} onClick={() => setTab(t.key)}>
              {t.label}
              <span className="tab-count">{grouped[t.key].length}</span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="empty-state">Loading requests…</div>
        ) : visible.length === 0 ? (
          <div className="empty-state">Nothing here yet.</div>
        ) : (
          <div className="request-list">
            {visible.map((b) => (
              <div className="request-row" key={b.id}>
                <div className="request-main">
                  <span className="request-eq-name">
                    {b.equipment_name} <span style={{ color: "var(--muted)", fontWeight: 400 }}>· {b.equipment_code}</span>
                  </span>
                  <span className="request-meta">
                    {b.purpose} · requested for {b.duration_hours}h · pass {b.gate_pass_code}
                  </span>
                  {b.status === "rejected" && b.manager_note && (
                    <span className="manager-note">Manager note: {b.manager_note}</span>
                  )}
                  {b.status === "completed" && (b.return_status || b.return_note) && (
                    <span className="manager-note">
                      Returned as {RETURN_LABELS[b.return_status] || b.return_status || "completed"}
                      {b.return_note ? ` — ${b.return_note}` : ""}
                    </span>
                  )}
                </div>

                <div className="request-side">
                  {b.status === "accepted" && <Countdown expiresAt={b.expires_at} />}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {toast && <div className="toast error">{toast}</div>}
    </div>
  );
}
