import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../api";
import Countdown from "../components/Countdown";

const TABS = [
  { key: "pending", label: "Pending" },
  { key: "accepted", label: "Active" },
  { key: "rejected", label: "Rejected" },
  { key: "completed", label: "Completed" },
];

export default function ManagerReview() {
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

  const approve = async (id) => {
    try {
      await api.approveBooking(token, id);
      load();
    } catch (err) {
      setToast(err.message);
    }
  };

  const reject = async (id) => {
    const note = window.prompt("Optional note to the requester about why this was denied:") || "";
    try {
      await api.rejectBooking(token, id, note);
      load();
    } catch (err) {
      setToast(err.message);
    }
  };

  const visible = grouped[tab];

  return (
    <div className="page">
      <div className="container">
        <div className="page-header">
          <div>
            <p className="eyebrow">Manager Review</p>
            <h1 className="page-title">Booking requests</h1>
            <p className="page-sub">Approve or deny gate pass requests from the team.</p>
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
                    Requested by {b.requester_name} · {b.purpose} · {b.duration_hours}h · pass {b.gate_pass_code}
                  </span>
                  {b.manager_note && <span className="manager-note">Your note: {b.manager_note}</span>}
                </div>

                <div className="request-side">
                  {b.status === "pending" && (
                    <>
                      <button className="btn btn-primary btn-sm" onClick={() => approve(b.id)}>
                        Approve
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => reject(b.id)}>
                        Deny
                      </button>
                    </>
                  )}
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
