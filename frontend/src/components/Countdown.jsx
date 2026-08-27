import { useEffect, useState } from "react";

function formatRemaining(ms) {
  if (ms <= 0) return "Time's up";
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

export default function Countdown({ expiresAt }) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const remainingMs = new Date(expiresAt).getTime() - now;
  const expired = remainingMs <= 0;

  return <span className={`countdown${expired ? " expired" : ""}`}>{formatRemaining(remainingMs)}</span>;
}
