import { useEffect, useState } from "react";
import axios from "axios";

const API = "http://127.0.0.1:8000/api";


const Card = ({ label, value, color, icon }) => (
  <div style={{
    background: `linear-gradient(135deg, ${color[0]}, ${color[1]})`,
    borderRadius: "16px", padding: "24px",
    boxShadow: `0 8px 24px ${color[2]}`,
    display: "flex", alignItems: "center", gap: "16px"
  }}>
    <div style={{
      fontSize: "32px", background: "rgba(255,255,255,0.2)",
      borderRadius: "12px", width: "56px", height: "56px",
      display: "flex", alignItems: "center", justifyContent: "center"
    }}>{icon}</div>
    <div>
      <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "13px", margin: "0 0 4px", fontWeight: "600" }}>{label}</p>
      <p style={{ color: "#fff", fontSize: "32px", fontWeight: "800", margin: 0, lineHeight: 1 }}>{value ?? 0}</p>
    </div>
  </div>
);

const StatusBadge = ({ status }) => {
  const s = (status || "").toLowerCase();
  const colors = {
    pending:    { bg: "rgba(234,179,8,0.15)",   color: "#fbbf24" },
    processing: { bg: "rgba(59,130,246,0.15)",  color: "#60a5fa" },
    completed:  { bg: "rgba(34,197,94,0.15)",   color: "#4ade80" },
    found:      { bg: "rgba(16,185,129,0.15)",  color: "#34d399" },
  };
  const key = Object.keys(colors).find(k => s.includes(k)) || "pending";
  const c = colors[key];
  return (
    <span style={{
      padding: "3px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "700",
      background: c.bg, color: c.color
    }}>{status || "pending"}</span>
  );
};

export default function Dashboard() {
  const [stats, setStats]     = useState(null);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    axios.get(`${API}/admin/dashboard/`)
      .then(res => {
        setStats(res.data.stats);
        setReports(res.data.recent_reports || []);
        setLoading(false);
      })
      .catch(() => {
        axios.get(`${API}/admin/get-reports/`)
          .then(res => {
            const data = res.data || [];
            setReports(data);
            setStats({
              total_reports:  data.length,
              pending:        data.filter(r => (r.status||"").toLowerCase().includes("pending")).length,
              processing:     data.filter(r => (r.status||"").toLowerCase().includes("processing")).length,
              found:          data.filter(r => (r.status||"").toLowerCase().includes("found")).length,
              completed:      data.filter(r => (r.status||"").toLowerCase().includes("completed")).length,
              total_students: 0,
              total_videos:   0,
            });
            setLoading(false);
          })
          .catch(() => {
            setError("Failed to load. Is the backend running on port 8000?");
            setLoading(false);
          });
      });
  }, []);

  const getField = (obj, ...keys) => {
    for (const k of keys) {
      if (obj[k] !== undefined && obj[k] !== null && obj[k] !== "") return obj[k];
    }
    return null;
  };

  const base = {
    minHeight: "100vh", background: "#0f172a", padding: "32px",
    fontFamily: "'Segoe UI', sans-serif", color: "#fff"
  };

  if (loading) return (
    <div style={{ ...base, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: "40px", marginBottom: "16px" }}>⏳</div>
        <p style={{ color: "rgba(255,255,255,0.5)" }}>Loading dashboard...</p>
      </div>
    </div>
  );

  if (error) return (
    <div style={{ ...base, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{
        background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
        borderRadius: "16px", padding: "32px", textAlign: "center", maxWidth: "400px"
      }}>
        <p style={{ fontSize: "40px", margin: "0 0 12px" }}>⚠️</p>
        <p style={{ color: "#f87171", marginBottom: "16px" }}>{error}</p>
        <button onClick={() => window.location.reload()} style={{
          padding: "10px 24px", background: "rgba(239,68,68,0.2)",
          border: "1px solid rgba(239,68,68,0.4)", borderRadius: "8px",
          color: "#f87171", cursor: "pointer", fontWeight: "600"
        }}>Try Again</button>
      </div>
    </div>
  );

  return (
    <div style={base}>
      <div style={{ marginBottom: "32px" }}>
        <h1 style={{ fontSize: "28px", fontWeight: "800", margin: "0 0 4px" }}>Dashboard</h1>
        <p style={{ color: "rgba(255,255,255,0.4)", margin: 0, fontSize: "14px" }}>
          Overview of all missing person reports
        </p>
      </div>

      {stats && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "32px" }}>
          <Card label="Total Reports" value={stats.total_reports} icon="📋" color={["#1d4ed8","#1e40af","rgba(29,78,216,0.3)"]} />
          <Card label="Pending"       value={stats.pending}       icon="⏳" color={["#d97706","#b45309","rgba(217,119,6,0.3)"]} />
          <Card label="Processing"    value={stats.processing}    icon="🔄" color={["#7c3aed","#6d28d9","rgba(124,58,237,0.3)"]} />
          <Card label="Found"         value={stats.found}         icon="✅" color={["#059669","#047857","rgba(5,150,105,0.3)"]} />
        </div>
      )}

      <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px", overflow: "hidden" }}>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ margin: 0, fontSize: "18px", fontWeight: "700" }}>Recent Reports</h2>
          <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px" }}>{reports.length} records</span>
        </div>

        {reports.length === 0 ? (
          <div style={{ padding: "48px", textAlign: "center" }}>
            <p style={{ fontSize: "36px", margin: "0 0 12px" }}>📭</p>
            <p style={{ color: "rgba(255,255,255,0.3)" }}>No reports found</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "rgba(255,255,255,0.03)" }}>
                  {["Photo","Reference ID","Name","Department","Status","Date"].map(h => (
                    <th key={h} style={{ padding: "12px 16px", textAlign: "left", color: "rgba(255,255,255,0.4)", fontSize: "12px", fontWeight: "600", letterSpacing: "0.08em", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>{h.toUpperCase()}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {reports.map((m, i) => {
                  const refId  = getField(m, "reference_id", "id");
                  const name   = getField(m, "name") || "Unknown";
                  const dept   = getField(m, "department");
                  const status = getField(m, "status") || "pending";
                  const photo  = getField(m, "photo");
                  const date   = getField(m, "created_at", "submitted_at", "updated_at");

                  return (
                    <tr key={String(refId) + i}
                      style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
                      onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.03)"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                    >
                      <td style={{ padding: "14px 16px" }}>
                        {photo ? (
                          <img src={photo.startsWith("http") ? photo : `http://localhost:8000${photo}`} alt={name}
                            style={{ width: "36px", height: "36px", borderRadius: "50%", objectFit: "cover", border: "2px solid rgba(59,130,246,0.4)" }} />
                        ) : (
                          <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "rgba(59,130,246,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px" }}>👤</div>
                        )}
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <span style={{ fontFamily: "monospace", color: "#60a5fa", fontSize: "12px", fontWeight: "600" }}>
                          {String(refId).length > 12 ? String(refId).substring(0, 12) + "..." : refId}
                        </span>
                      </td>
                      <td style={{ padding: "14px 16px", color: "#fff", fontWeight: "600" }}>{name}</td>
                      <td style={{ padding: "14px 16px", color: "rgba(255,255,255,0.5)", fontSize: "14px" }}>
                        {dept || <span style={{ color: "#f97316" }}>Outsider</span>}
                      </td>
                      <td style={{ padding: "14px 16px" }}><StatusBadge status={status} /></td>
                      <td style={{ padding: "14px 16px", color: "rgba(255,255,255,0.4)", fontSize: "13px" }}>
                        {date ? new Date(date).toLocaleDateString() : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}