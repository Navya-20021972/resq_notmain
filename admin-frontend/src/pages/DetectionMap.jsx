// LOCATION: admin-frontend/src/pages/DetectionMap.jsx
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix leaflet default icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:       "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:     "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const API = "http://localhost:8000/api";

// ─────────────────────────────────────────────────────────────────────────────
// AMAL JYOTHI COLLEGE — exact campus location coordinates
// Update lat/lng here if any location is slightly off
// ─────────────────────────────────────────────────────────────────────────────
const CAMPUS_CENTER = { lat: 9.5278, lng: 76.8216 };

const CAMPUS_LOCATIONS = {
  "Main Gate":           { lat: 9.528700573372275, lng: 76.82343259954885, color: "#3b82f6" },
  "Canteen":             { lat: 9.528312666270441, lng: 76.82135118602386, color: "#f97316" },
  "Central Complex (CC)":{ lat: 9.527767987721617, lng: 76.82158489327396, color: "#8b5cf6" },
  "RB Lawn":             { lat: 9.52794786190133, lng: 76.82220180133518, color: "#10b981" },
  "Library":             { lat: 9.527796449495929, lng: 76.8219616331206, color: "#f59e0b" },
  "Auditorium":          { lat: 9.528222319693706, lng: 76.82220155000242, color: "#ef4444" },
};

// Find closest campus location by name match
function getLocationCoords(locationName) {
  if (!locationName) return CAMPUS_CENTER;
  const name = locationName.toLowerCase();
  for (const [key, val] of Object.entries(CAMPUS_LOCATIONS)) {
    if (name.includes(key.toLowerCase().split("(")[0].trim()) ||
        key.toLowerCase().includes(name.split("(")[0].trim())) {
      return val;
    }
  }
  return CAMPUS_CENTER;
}

// ─────────────────────────────────────────────────────────────────────────────
// CUSTOM ICONS
// ─────────────────────────────────────────────────────────────────────────────

function makeIcon(color, size = 32) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 42" width="${size}" height="${size*1.3}">
      <path d="M16 0C9.37 0 4 5.37 4 12c0 9 12 30 12 30s12-21 12-30C28 5.37 22.63 0 16 0z"
            fill="${color}" stroke="white" stroke-width="2"/>
      <circle cx="16" cy="12" r="5" fill="white"/>
    </svg>`;
  return L.divIcon({
    html: svg,
    iconSize:   [size, size * 1.3],
    iconAnchor: [size / 2, size * 1.3],
    popupAnchor:[0, -size],
    className:  "",
  });
}

function makePulsingIcon(color) {
  return L.divIcon({
    html: `
      <div style="position:relative;width:40px;height:40px">
        <div style="
          position:absolute;inset:0;border-radius:50%;
          background:${color};opacity:0.3;
          animation:pulse 1.5s infinite;
        "></div>
        <div style="
          position:absolute;top:8px;left:8px;width:24px;height:24px;
          border-radius:50%;background:${color};border:3px solid white;
          box-shadow:0 2px 8px rgba(0,0,0,0.4);
        "></div>
      </div>
      <style>
        @keyframes pulse {
          0%  { transform:scale(1);   opacity:0.3; }
          50% { transform:scale(1.8); opacity:0.1; }
          100%{ transform:scale(1);   opacity:0.3; }
        }
      </style>`,
    iconSize:   [40, 40],
    iconAnchor: [20, 20],
    popupAnchor:[0, -22],
    className:  "",
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// MAP AUTO-PAN when selected report changes
// ─────────────────────────────────────────────────────────────────────────────

function MapController({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo([center.lat, center.lng], zoom || 18, { duration: 1.2 });
    }
  }, [center, zoom]);
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function DetectionMap() {
  const [reports,      setReports]      = useState([]);
  const [selected,     setSelected]     = useState(null);
  const [detections,   setDetections]   = useState([]);
  const [mapCenter,    setMapCenter]    = useState(CAMPUS_CENTER);
  const [mapZoom,      setMapZoom]      = useState(17);
  const [running,      setRunning]      = useState(false);
  const [runMsg,       setRunMsg]       = useState("");
  const [loading,      setLoading]      = useState(true);

  useEffect(() => {
    fetchReports();
    fetchDetections();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/admin/get-reports/`);
      const active = (res.data || []).filter(
        r => !["Detected","Found","Completed"].includes(r.status)
      );
      setReports(active);
    } catch (e) {
      console.error("fetchReports:", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchDetections = async () => {
    try {
      const res = await axios.get(`${API}/admin/detections/`);
      setDetections(res.data || []);
    } catch (e) {
      console.error("fetchDetections:", e);
    }
  };

  // When a report card is clicked, pan map to their last seen location
  const handleSelectReport = (report) => {
    setSelected(report);
    setRunMsg("");
    const coords = getLocationCoords(report.last_seen_location);
    setMapCenter(coords);
    setMapZoom(19);
  };

  // Run detection for selected report
  const handleRunDetection = async () => {
    if (!selected) return;
    setRunning(true);
    setRunMsg("🔍 Scanning CCTV footage...");
    try {
      const res = await axios.post(`${API}/admin/run-detection/`, {
        report_id:   selected.reference_id,
        location_id: selected.last_seen_location_id,
        cctv_id:     selected.last_seen_location_id,
      });
      const data  = res.data;
      const found = data.detections_count > 0;
      if (found) {
        const det = data.detections[0];
        setRunMsg(`✅ FOUND at ${det.location} — ${det.confidence}% confidence`);
        setMapCenter({ lat: det.latitude || mapCenter.lat, lng: det.longitude || mapCenter.lng });
        setMapZoom(19);
      } else {
        setRunMsg(`❌ Not found in scanned footage. ${data.message || ""}`);
      }
      fetchReports();
      fetchDetections();
    } catch (err) {
      const msg = err.response?.data?.error || err.message;
      setRunMsg(`❌ Error: ${msg}`);
    } finally {
      setRunning(false);
    }
  };

  const selectedCoords = selected
    ? getLocationCoords(selected.last_seen_location)
    : null;

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0f172a",
      padding: "24px",
      fontFamily: "'Segoe UI', system-ui, sans-serif",
      color: "#fff",
    }}>

      {/* Header */}
      <div style={{ marginBottom: "20px" }}>
        <h1 style={{ margin: "0 0 4px", fontSize: "24px", fontWeight: "800" }}>
          🗺️ AI Detection & Campus Map
        </h1>
        <p style={{ margin: 0, color: "rgba(255,255,255,0.4)", fontSize: "13px" }}>
          Amal Jyothi College of Engineering — Real-time CCTV tracking
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "340px 1fr", gap: "20px" }}>

        {/* ══════════ LEFT PANEL ══════════ */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

          {/* Active reports */}
          <div style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "14px", overflow: "hidden",
          }}>
            <div style={{
              padding: "14px 18px",
              borderBottom: "1px solid rgba(255,255,255,0.07)",
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <h2 style={{ margin: 0, fontSize: "14px", fontWeight: "700" }}>
                Active Reports
              </h2>
              <span style={{
                background: "rgba(59,130,246,0.2)", color: "#60a5fa",
                padding: "2px 10px", borderRadius: "10px", fontSize: "11px", fontWeight: "700",
              }}>
                {reports.length} reports
              </span>
            </div>

            <div style={{ padding: "12px", maxHeight: "380px", overflowY: "auto" }}>
              {loading ? (
                <p style={{ color: "rgba(255,255,255,0.3)", textAlign: "center", padding: "20px" }}>
                  Loading...
                </p>
              ) : reports.length === 0 ? (
                <p style={{ color: "rgba(255,255,255,0.3)", textAlign: "center", padding: "20px" }}>
                  No active reports
                </p>
              ) : reports.map(r => {
                const coords   = getLocationCoords(r.last_seen_location);
                const isActive = selected?.reference_id === r.reference_id;
                return (
                  <div
                    key={r.reference_id}
                    onClick={() => handleSelectReport(r)}
                    style={{
                      padding: "12px",
                      borderRadius: "10px",
                      cursor: "pointer",
                      marginBottom: "8px",
                      border: `1px solid ${isActive ? "#3b82f6" : "rgba(255,255,255,0.06)"}`,
                      background: isActive ? "rgba(59,130,246,0.12)" : "rgba(255,255,255,0.02)",
                      transition: "all 0.2s",
                    }}
                  >
                    <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                      {r.photo && (
                        <img
                          src={`http://localhost:8000${r.photo}`}
                          alt={r.name}
                          style={{
                            width: "40px", height: "40px",
                            borderRadius: "50%", objectFit: "cover",
                            border: "2px solid rgba(255,255,255,0.15)",
                          }}
                        />
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: "0 0 2px", fontWeight: "700", fontSize: "13px" }}>
                          {r.name}
                        </p>
                        <p style={{ margin: "0 0 2px", color: "rgba(255,255,255,0.4)", fontSize: "11px" }}>
                          {r.reference_id?.slice(0,12)}...
                        </p>
                        <p style={{ margin: 0, color: "#f97316", fontSize: "11px" }}>
                          📍 {r.last_seen_location}
                        </p>
                      </div>
                      <span style={{
                        padding: "2px 8px", borderRadius: "8px", fontSize: "10px", fontWeight: "700",
                        background: r.status === "Processing" ? "rgba(147,51,234,0.2)" : "rgba(234,179,8,0.2)",
                        color:      r.status === "Processing" ? "#a78bfa"              : "#fbbf24",
                        whiteSpace: "nowrap",
                      }}>
                        {r.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected person + Run Detection */}
          {selected && (
            <div style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(59,130,246,0.3)",
              borderRadius: "14px", padding: "16px",
            }}>
              <h3 style={{ margin: "0 0 12px", fontSize: "13px", fontWeight: "700", color: "#60a5fa" }}>
                SELECTED FOR DETECTION
              </h3>
              <div style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "12px" }}>
                {selected.photo && (
                  <img
                    src={`http://localhost:8000${selected.photo}`}
                    alt={selected.name}
                    style={{
                      width: "50px", height: "50px",
                      borderRadius: "50%", objectFit: "cover",
                      border: "2px solid #3b82f6",
                    }}
                  />
                )}
                <div>
                  <p style={{ margin: "0 0 2px", fontWeight: "700" }}>{selected.name}</p>
                  <p style={{ margin: "0 0 2px", color: "rgba(255,255,255,0.4)", fontSize: "12px" }}>
                    {selected.department}
                  </p>
                  <p style={{ margin: 0, color: "#f97316", fontSize: "12px" }}>
                    📍 {selected.last_seen_location}
                  </p>
                </div>
              </div>

              {/* Location pin info */}
              {selectedCoords && (
                <div style={{
                  padding: "8px 12px", borderRadius: "8px", fontSize: "12px", marginBottom: "12px",
                  background: "rgba(255,255,255,0.05)",
                  color: "rgba(255,255,255,0.6)",
                }}>
                  🌐 {selectedCoords.lat.toFixed(6)}, {selectedCoords.lng.toFixed(6)}
                  <br/>
                  📹 Map centered on: <strong style={{ color: "#fff" }}>{selected.last_seen_location}</strong>
                </div>
              )}

              {/* Run detection button */}
              <button
                onClick={handleRunDetection}
                disabled={running}
                style={{
                  width: "100%", padding: "11px",
                  background: running
                    ? "rgba(147,51,234,0.3)"
                    : "linear-gradient(135deg,#7c3aed,#1a56db)",
                  border: "none", borderRadius: "8px",
                  color: "#fff", fontWeight: "700", fontSize: "13px",
                  cursor: running ? "not-allowed" : "pointer",
                  fontFamily: "inherit",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                }}
              >
                {running ? "⏳ Scanning CCTV..." : "🤖 Run AI Detection"}
              </button>

              {runMsg && (
                <div style={{
                  marginTop: "10px", padding: "10px 12px",
                  borderRadius: "8px", fontSize: "12px",
                  background: runMsg.startsWith("✅")
                    ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.12)",
                  border: `1px solid ${runMsg.startsWith("✅") ? "#10b981" : "#ef4444"}`,
                  color:  runMsg.startsWith("✅") ? "#34d399" : "#fca5a5",
                  lineHeight: "1.5",
                }}>
                  {runMsg}
                </div>
              )}
            </div>
          )}

          {/* Campus location legend */}
          <div style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "14px", padding: "16px",
          }}>
            <h3 style={{ margin: "0 0 12px", fontSize: "13px", fontWeight: "700" }}>
              📍 Campus Locations
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {Object.entries(CAMPUS_LOCATIONS).map(([name, info]) => (
                <div
                  key={name}
                  onClick={() => {
                    setMapCenter({ lat: info.lat, lng: info.lng });
                    setMapZoom(19);
                  }}
                  style={{
                    display: "flex", alignItems: "center", gap: "8px",
                    padding: "6px 8px", borderRadius: "6px",
                    cursor: "pointer",
                    background: "rgba(255,255,255,0.02)",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.06)"}
                  onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.02)"}
                >
                  <div style={{
                    width: "10px", height: "10px", borderRadius: "50%",
                    background: info.color, flexShrink: 0,
                  }} />
                  <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.7)" }}>{name}</span>
                  <span style={{ marginLeft: "auto", fontSize: "10px", color: "rgba(255,255,255,0.3)" }}>
                    {info.lat.toFixed(4)}, {info.lng.toFixed(4)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ══════════ MAP ══════════ */}
        <div style={{
          borderRadius: "16px", overflow: "hidden",
          border: "1px solid rgba(255,255,255,0.08)",
          minHeight: "600px",
        }}>
          <MapContainer
            center={[CAMPUS_CENTER.lat, CAMPUS_CENTER.lng]}
            zoom={17}
            style={{ height: "700px", width: "100%" }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='© OpenStreetMap contributors'
            />

            <MapController center={mapCenter} zoom={mapZoom} />

            {/* All campus location markers */}
            {Object.entries(CAMPUS_LOCATIONS).map(([name, info]) => (
              <Marker
                key={name}
                position={[info.lat, info.lng]}
                icon={makeIcon(info.color)}
              >
                <Popup>
                  <div style={{ minWidth: "160px" }}>
                    <strong style={{ fontSize: "14px" }}>{name}</strong>
                    <br />
                    <span style={{ color: "#666", fontSize: "12px" }}>
                      Amal Jyothi College
                    </span>
                    <br />
                    <span style={{ color: "#888", fontSize: "11px" }}>
                      {info.lat.toFixed(6)}, {info.lng.toFixed(6)}
                    </span>

                    {/* Show any active reports at this location */}
                    {reports
                      .filter(r =>
                        r.last_seen_location?.toLowerCase().includes(
                          name.toLowerCase().split("(")[0].trim()
                        )
                      )
                      .map(r => (
                        <div key={r.reference_id} style={{
                          marginTop: "8px",
                          padding: "6px 8px",
                          background: "#fff3cd",
                          borderRadius: "4px",
                          fontSize: "12px",
                        }}>
                          ⚠️ <strong>{r.name}</strong> — last seen here
                        </div>
                      ))
                    }
                  </div>
                </Popup>
              </Marker>
            ))}

            {/* Pulsing marker for selected person's last seen location */}
            {selected && selectedCoords && (
              <>
                <Marker
                  position={[selectedCoords.lat, selectedCoords.lng]}
                  icon={makePulsingIcon("#ef4444")}
                >
                  <Popup>
                    <div style={{ minWidth: "180px" }}>
                      <strong>⚠️ Last Seen: {selected.name}</strong>
                      <br />
                      <span style={{ color: "#666", fontSize: "12px" }}>
                        {selected.last_seen_location}
                      </span>
                      <br />
                      <span style={{ color: "#888", fontSize: "11px" }}>
                        Status: {selected.status}
                      </span>
                    </div>
                  </Popup>
                </Marker>

                {/* Search radius circle */}
                <Circle
                  center={[selectedCoords.lat, selectedCoords.lng]}
                  radius={100}
                  pathOptions={{
                    color: "#ef4444", fillColor: "#ef4444",
                    fillOpacity: 0.08, weight: 2, dashArray: "6,4",
                  }}
                />
              </>
            )}

            {/* Detection result markers */}
            {detections.map(d => (
              d.latitude && d.longitude && (
                <Marker
                  key={d.id}
                  position={[d.latitude, d.longitude]}
                  icon={makeIcon("#10b981", 28)}
                >
                  <Popup>
                    <div style={{ minWidth: "180px" }}>
                      <strong style={{ color: "#10b981" }}>✅ Detected</strong>
                      <br />
                      <strong>{d.name}</strong>
                      <br />
                      <span style={{ color: "#666", fontSize: "12px" }}>
                        📍 {d.location}
                      </span>
                      <br />
                      <span style={{ color: "#666", fontSize: "12px" }}>
                        🎯 Confidence: {d.confidence}%
                      </span>
                      <br />
                      <span style={{ color: "#888", fontSize: "11px" }}>
                        🕒 {d.timestamp ? new Date(d.timestamp).toLocaleString() : "—"}
                      </span>
                      {d.frame && (
                        <div style={{ marginTop: "8px" }}>
                          <img
                            src={d.frame} alt="Detected"
                            style={{ width: "100%", borderRadius: "4px" }}
                          />
                        </div>
                      )}
                    </div>
                  </Popup>
                </Marker>
              )
            ))}
          </MapContainer>
        </div>
      </div>
    </div>
  );
}