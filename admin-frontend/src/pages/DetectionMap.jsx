// DetectionMap.jsx
import { useEffect, useState } from "react";
import axios from "axios";
const API = "http://localhost:8000/api";

export function DetectionMap() {
  const [detections, setDetections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API}/admin/detections/`)
      .then(res => setDetections(res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const base = {
    minHeight: "100vh", background: "#0f172a", padding: "32px",
    fontFamily: "'Segoe UI', sans-serif", color: "#fff"
  };

  return (
    <div style={base}>
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ fontSize: "28px", fontWeight: "800", margin: "0 0 4px" }}>Detection Map</h1>
        <p style={{ color: "rgba(255,255,255,0.4)", margin: 0, fontSize: "14px" }}>
          Locations where missing persons were detected in CCTV footage
        </p>
      </div>

      {/* Map placeholder */}
      <div style={{
        background: "rgba(59,130,246,0.05)",
        border: "2px dashed rgba(59,130,246,0.3)",
        borderRadius: "20px", height: "320px",
        display: "flex", alignItems: "center", justifyContent: "center",
        marginBottom: "28px"
      }}>
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: "48px", margin: "0 0 12px" }}>🗺️</p>
          <p style={{ color: "#60a5fa", fontWeight: "600", marginBottom: "6px" }}>Interactive Map</p>
          <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "13px" }}>
            Integrate Google Maps / Leaflet.js for live location pins
          </p>
        </div>
      </div>

      {/* Detections list */}
      <h2 style={{ fontSize: "18px", fontWeight: "700", marginBottom: "16px" }}>
        Detection Records ({detections.length})
      </h2>

      {loading ? (
        <p style={{ color: "rgba(255,255,255,0.4)" }}>Loading...</p>
      ) : detections.length === 0 ? (
        <div style={{
          padding: "48px", textAlign: "center",
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.07)", borderRadius: "16px"
        }}>
          <p style={{ fontSize: "36px", margin: "0 0 12px" }}>📍</p>
          <p style={{ color: "rgba(255,255,255,0.3)" }}>No detections yet. Run detection on a report first.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px,1fr))", gap: "14px" }}>
          {detections.map(d => (
            <div key={d.id} style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "14px", padding: "18px"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                <span style={{ fontFamily: "monospace", color: "#60a5fa", fontSize: "13px", fontWeight: "600" }}>{d.reference_id}</span>
                <span style={{
                  padding: "2px 10px", background: "rgba(16,185,129,0.15)",
                  border: "1px solid rgba(16,185,129,0.3)",
                  borderRadius: "20px", color: "#34d399", fontSize: "12px", fontWeight: "700"
                }}>
                  {(d.confidence * 100).toFixed(1)}% match
                </span>
              </div>
              <p style={{ margin: "0 0 4px", fontWeight: "700" }}>{d.missing_person}</p>
              <p style={{ margin: "0 0 8px", color: "rgba(255,255,255,0.5)", fontSize: "13px" }}>
                📍 {d.location}
              </p>
              {d.latitude && d.longitude && (
                <p style={{ margin: "0 0 6px", color: "rgba(255,255,255,0.3)", fontSize: "12px", fontFamily: "monospace" }}>
                  {d.latitude.toFixed(4)}, {d.longitude.toFixed(4)}
                </p>
              )}
              <p style={{ margin: 0, color: "rgba(255,255,255,0.3)", fontSize: "12px" }}>
                🕒 {new Date(d.timestamp).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default DetectionMap;