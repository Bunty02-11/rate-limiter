// src/App.jsx
import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, BarChart, Bar
} from "recharts";

const API = "http://localhost:8081";

// ── Summary cards ──────────────────────────────────────────────
function SummaryCards({ summary }) {
  const cards = [
    { label: "Total Requests", value: summary.total, color: "#6366f1" },
    { label: "Allowed", value: summary.allowed, color: "#22c55e" },
    { label: "Blocked", value: summary.blocked, color: "#ef4444" },
    {
      label: "Block Rate",
      value: summary.total
        ? `${((summary.blocked / summary.total) * 100).toFixed(1)}%`
        : "0%",
      color: "#f59e0b",
    },
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 32 }}>
      {cards.map((c) => (
        <div key={c.label} style={{
          background: "#1e1e2e", borderRadius: 12, padding: "20px 24px",
          borderLeft: `4px solid ${c.color}`
        }}>
          <div style={{ color: "#888", fontSize: 13, marginBottom: 6 }}>{c.label}</div>
          <div style={{ color: c.color, fontSize: 28, fontWeight: 700 }}>{c.value ?? "—"}</div>
        </div>
      ))}
    </div>
  );
}

// ── Live request feed ──────────────────────────────────────────
function LiveFeed({ logs }) {
  return (
    <div style={{ background: "#1e1e2e", borderRadius: 12, padding: 24, marginBottom: 32 }}>
      <h2 style={{ margin: "0 0 16px", color: "#fff", fontSize: 16 }}>
        Live Request Feed
        <span style={{
          marginLeft: 8, background: "#22c55e", borderRadius: 99,
          width: 8, height: 8, display: "inline-block", animation: "pulse 1.5s infinite"
        }} />
      </h2>
      <div style={{ maxHeight: 240, overflowY: "auto" }}>
        {logs.length === 0 && (
          <div style={{ color: "#555", textAlign: "center", padding: 32 }}>
            No requests yet — hit an API route to see data here.
          </div>
        )}
        {logs.map((log) => (
          <div key={log._id} style={{
            display: "flex", alignItems: "center", gap: 12,
            padding: "8px 0", borderBottom: "1px solid #2a2a3e"
          }}>
            <span style={{
              background: log.allowed ? "#166534" : "#7f1d1d",
              color: log.allowed ? "#22c55e" : "#ef4444",
              borderRadius: 6, padding: "2px 10px", fontSize: 12, fontWeight: 600,
              minWidth: 60, textAlign: "center"
            }}>
              {log.allowed ? "200" : "429"}
            </span>
            <span style={{ color: "#aaa", fontSize: 13, minWidth: 80 }}>{log.ip}</span>
            <span style={{ color: "#6366f1", fontSize: 13 }}>{log.method}</span>
            <span style={{ color: "#fff", fontSize: 13, flex: 1 }}>{log.path}</span>
            <span style={{ color: "#555", fontSize: 11 }}>
              {new Date(log.timestamp).toLocaleTimeString()}
            </span>
            <span style={{ color: "#f59e0b", fontSize: 12 }}>
              {log.remaining} left
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Token bucket visualizer ────────────────────────────────────
function TokenBucketVisual({ remaining, capacity = 10 }) {
  const pct = Math.max(0, Math.min(1, remaining / capacity));
  const color = pct > 0.5 ? "#22c55e" : pct > 0.2 ? "#f59e0b" : "#ef4444";

  return (
    <div style={{ background: "#1e1e2e", borderRadius: 12, padding: 24, textAlign: "center" }}>
      <h2 style={{ margin: "0 0 16px", color: "#fff", fontSize: 16 }}>Token Bucket</h2>
      <div style={{
        width: 100, height: 160, border: "3px solid #444", borderRadius: "0 0 16px 16px",
        margin: "0 auto 12px", position: "relative", overflow: "hidden", background: "#111"
      }}>
        <div style={{
          position: "absolute", bottom: 0, width: "100%",
          height: `${pct * 100}%`, background: color,
          transition: "height 0.4s ease, background 0.4s ease"
        }} />
      </div>
      <div style={{ color, fontSize: 24, fontWeight: 700 }}>{remaining}/{capacity}</div>
      <div style={{ color: "#666", fontSize: 12, marginTop: 4 }}>tokens remaining</div>
    </div>
  );
}

// ── Main App ───────────────────────────────────────────────────
export default function App() {
  const [summary, setSummary] = useState({});
  const [logs, setLogs] = useState([]);
  const [overTime, setOverTime] = useState([]);
  const [remaining, setRemaining] = useState(10);

  const fetchAll = useCallback(async () => {
    try {
      const [s, l, o] = await Promise.all([
        axios.get(`${API}/stats/summary`),
        axios.get(`${API}/stats/recent`),
        axios.get(`${API}/stats/over-time`),
      ]);
      setSummary(s.data);
      setLogs(l.data);
      setOverTime(o.data.map((d) => ({ time: d._id.minute, ...d })));
      if (l.data.length > 0) setRemaining(l.data[0].remaining);
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    }
  }, []);

  // Fire a test request directly from the dashboard
  const fireRequest = async () => {
    try {
      await axios.get(`${API}/api/data`);
    } catch {
      // 429s will throw — that's fine, we still want to refresh
    }
    fetchAll();
  };

  // Auto-refresh every 3 seconds
  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 3000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  return (
    <div style={{
      minHeight: "100vh", background: "#13131f", color: "#fff",
      fontFamily: "'Inter', sans-serif", padding: 32
    }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>
            Rate Limiter Dashboard
          </h1>
          <p style={{ margin: "4px 0 0", color: "#555", fontSize: 13 }}>
            Token Bucket · Redis · MongoDB · Live
          </p>
        </div>
        <button onClick={fireRequest} style={{
          background: "#6366f1", color: "#fff", border: "none",
          borderRadius: 8, padding: "10px 20px", cursor: "pointer",
          fontWeight: 600, fontSize: 14
        }}>
          Fire Request
        </button>
      </div>

      {/* Summary Cards */}
      <SummaryCards summary={summary} />

      {/* Live Feed + Token Bucket side by side */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 200px", gap: 16, marginBottom: 32 }}>
        <LiveFeed logs={logs} />
        <TokenBucketVisual remaining={remaining} capacity={10} />
      </div>

      {/* Requests over time chart */}
      <div style={{ background: "#1e1e2e", borderRadius: 12, padding: 24 }}>
        <h2 style={{ margin: "0 0 16px", color: "#fff", fontSize: 16 }}>Requests Over Time</h2>
        {overTime.length === 0 ? (
          <div style={{ color: "#555", textAlign: "center", padding: 32 }}>
            Not enough data yet — keep firing requests!
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={overTime}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3e" />
              <XAxis dataKey="time" stroke="#555" tick={{ fontSize: 11 }} />
              <YAxis stroke="#555" tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ background: "#1e1e2e", border: "1px solid #333" }} />
              <Legend />
              <Line type="monotone" dataKey="allowed" stroke="#22c55e" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="blocked" stroke="#ef4444" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}