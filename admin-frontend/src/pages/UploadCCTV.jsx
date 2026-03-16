// LOCATION: admin-frontend/src/pages/UploadCCTV.jsx
import { useState, useEffect } from "react";
import axios from "axios";

const API = "http://localhost:8000/api";

// ── Styles ──────────────────────────────────────────────────────────────────
const S = {
  page: {
    minHeight: "100vh",
    background: "#0f172a",
    padding: "32px",
    fontFamily: "'Segoe UI', system-ui, sans-serif",
    color: "#fff",
  },
  card: {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "16px",
    overflow: "hidden",
  },
  cardHeader: {
    padding: "20px 24px",
    borderBottom: "1px solid rgba(255,255,255,0.07)",
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  label: {
    display: "block",
    color: "#93c5fd",
    fontSize: "11px",
    fontWeight: "700",
    letterSpacing: "0.08em",
    marginBottom: "7px",
  },
  input: {
    width: "100%",
    padding: "11px 14px",
    background: "rgba(255,255,255,0.07)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: "8px",
    color: "#fff",
    fontSize: "14px",
    outline: "none",
    boxSizing: "border-box",
    fontFamily: "inherit",
  },
};

// ── Campus locations — must match user form ──────────────────────────────────
const CAMPUS_LOCATIONS = [
  "Main Gate",
  "Canteen",
  "Central Complex (CC)",
  "RB Lawn",
  "Library",
  "Auditorium",
  "Sports Complex",
  "Hostel Block A",
  "Hostel Block B",
  "Parking Area",
];

// ── Status badge ─────────────────────────────────────────────────────────────
function Badge({ status }) {
  const s = (status || "").toLowerCase();
  const cfg = s.includes("detect") || s.includes("found")
    ? { bg: "rgba(16,185,129,0.2)", color: "#34d399", label: "Detected" }
    : s.includes("processing")
    ? { bg: "rgba(147,51,234,0.2)", color: "#a78bfa", label: "Processing" }
    : { bg: "rgba(234,179,8,0.2)", color: "#fbbf24", label: "Pending" };

  return (
    <span style={{
      padding: "3px 12px", borderRadius: "12px",
      fontSize: "11px", fontWeight: "700",
      background: cfg.bg, color: cfg.color,
    }}>
      {cfg.label}
    </span>
  );
}

// ── Progress bar ─────────────────────────────────────────────────────────────
function ProgressBar({ value, label }) {
  return (
    <div style={{ marginBottom: "12px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
        <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)" }}>{label}</span>
        <span style={{ fontSize: "12px", color: "#60a5fa", fontWeight: "700" }}>{value}%</span>
      </div>
      <div style={{ height: "8px", background: "rgba(255,255,255,0.08)", borderRadius: "10px", overflow: "hidden" }}>
        <div style={{
          height: "100%", width: `${value}%`,
          background: "linear-gradient(90deg, #3b82f6, #8b5cf6)",
          borderRadius: "10px", transition: "width 0.4s ease",
        }} />
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
export default function UploadCCTV() {

  // Upload form
  const [videoFile,       setVideoFile]       = useState(null);
  const [location,        setLocation]        = useState("");
  const [latitude,        setLatitude]        = useState("");
  const [longitude,       setLongitude]       = useState("");
  const [uploading,       setUploading]       = useState(false);
  const [uploadProgress,  setUploadProgress]  = useState(0);
  const [uploadMsg,       setUploadMsg]       = useState(null);

  // Videos + reports
  const [videos,          setVideos]          = useState([]);
  const [reports,         setReports]         = useState([]);
  const [loadingVideos,   setLoadingVideos]   = useState(true);

  // Detection state per video  { [videoId]: { running, progress, message, found, result } }
  const [detState,        setDetState]        = useState({});

  // Selected report per video  { [videoId]: referenceId }
  const [selReport,       setSelReport]       = useState({});

  useEffect(() => {
    fetchVideos();
    fetchReports();
  }, []);

  const fetchVideos = async () => {
    setLoadingVideos(true);
    try {
      const res = await axios.get(`${API}/admin/get-cctv-videos/`);
      setVideos(res.data || []);
    } catch (e) {
      console.error("fetchVideos:", e);
    } finally {
      setLoadingVideos(false);
    }
  };

  const fetchReports = async () => {
    try {
      const res = await axios.get(`${API}/admin/get-reports/`);
      setReports(res.data || []);
    } catch (e) {
      console.error("fetchReports:", e);
    }
  };

  // ── Upload ────────────────────────────────────────────────────────────────
  const handleUpload = async (e) => {
    e.preventDefault();
    if (!videoFile) return setUploadMsg({ type: "error", text: "Please select a video file." });
    if (!location)  return setUploadMsg({ type: "error", text: "Please select a camera location." });

    setUploading(true);
    setUploadMsg(null);
    setUploadProgress(0);

    const fd = new FormData();
    fd.append("video",    videoFile);
    fd.append("location", location);
    if (latitude)  fd.append("latitude",  latitude);
    if (longitude) fd.append("longitude", longitude);

    try {
      const res = await axios.post(`${API}/admin/upload-cctv/`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (ev) => setUploadProgress(Math.round((ev.loaded * 100) / ev.total)),
      });
      setUploadMsg({ type: "success", text: `✅ Uploaded for "${res.data.location}" (ID: ${res.data.id})` });
      setVideoFile(null);
      setLocation("");
      setLatitude("");
      setLongitude("");
      setUploadProgress(0);
      document.getElementById("vid-input").value = "";
      fetchVideos();
    } catch (err) {
      const msg = err.response?.data?.error || err.message || "Upload failed";
      setUploadMsg({ type: "error", text: `❌ ${msg}` });
    } finally {
      setUploading(false);
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = async (videoId) => {
    if (!window.confirm("Delete this CCTV footage?")) return;
    try {
      await axios.delete(`${API}/admin/delete-cctv/${videoId}/`);
      setVideos(v => v.filter(x => x.id !== videoId));
    } catch (e) {
      alert("Delete failed: " + (e.response?.data?.error || e.message));
    }
  };

  // ── Run Detection ─────────────────────────────────────────────────────────
  const handleRunDetection = async (video) => {
    const reportId = selReport[video.id];
    if (!reportId) {
      alert("Please select a missing person first.");
      return;
    }

    // Find the selected report object to get their last_seen_location
    const report = reports.find(r => r.reference_id === reportId);

    // Check: does the CCTV location match the person's last seen location?
    const cctvLoc   = (video.location || "").toLowerCase().trim();
    const personLoc = (report?.last_seen_location || "").toLowerCase().trim();
    const locationMatch = cctvLoc.includes(personLoc.split("(")[0].trim()) ||
                          personLoc.includes(cctvLoc.split("(")[0].trim()) ||
                          cctvLoc === personLoc;

    // Set running state
    setDetState(prev => ({
      ...prev,
      [video.id]: {
        running: true, progress: 5,
        message: locationMatch
          ? `🔍 Scanning ${video.location} — matches last seen location...`
          : `⚠️ Note: CCTV is at "${video.location}", person last seen at "${report?.last_seen_location}". Scanning anyway...`,
        found: false, result: null,
      },
    }));

    // Fake progress ticker while backend works
    let tick = 5;
    const timer = setInterval(() => {
      tick = Math.min(tick + 2, 90);
      setDetState(prev => ({
        ...prev,
        [video.id]: { ...prev[video.id], progress: tick },
      }));
    }, 1000);

    try {
      // ── The actual API call ────────────────────────────────────────────────
      console.log(`[Detection] Calling POST ${API}/admin/run-detection/`);
      console.log(`[Detection] Payload: report_id=${reportId}, video_id=${video.id}`);

      const res = await axios.post(
        `${API}/admin/run-detection/`,
        { report_id: reportId, video_id: video.id },
        { headers: { "Content-Type": "application/json" } }
      );

      clearInterval(timer);
      const data  = res.data;
      const found = (data.detections_count > 0) || data.status === "Detected";

      console.log("[Detection] Response:", data);

      let resultMsg = "";
      if (found) {
        const det = data.detections?.[0];
        resultMsg = `✅ MATCH FOUND at "${det?.location || video.location}"`;
        if (det?.confidence) resultMsg += ` — ${det.confidence}% confidence`;
        if (det?.latitude)   resultMsg += ` | 📍 ${det.latitude}, ${det.longitude}`;
      } else {
        resultMsg = `❌ No match found in "${video.location}". ${data.message || ""}`;
      }

      setDetState(prev => ({
        ...prev,
        [video.id]: {
          running: false, progress: 100,
          message: resultMsg,
          found, result: data,
        },
      }));

      // Refresh reports to show updated status
      fetchReports();

    } catch (err) {
      clearInterval(timer);

      // Show the REAL error from backend
      const status  = err.response?.status || "network";
      const data    = err.response?.data   || {};
      const errMsg  = data.error || data.detail || err.message || "Unknown error";
      const trace   = data.trace ? `\n\nDetails: ${data.trace.split("\n").slice(-3).join(" | ")}` : "";

      console.error("[Detection] FAILED:", status, data);

      setDetState(prev => ({
        ...prev,
        [video.id]: {
          running: false, progress: 0,
          message: `❌ HTTP ${status}: ${errMsg}${trace}`,
          found: false, result: null,
        },
      }));
    }
  };

  // ────────────────────────────────────────────────────────────────────────
  return (
    <div style={S.page}>

      {/* Header */}
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ fontSize: "26px", fontWeight: "800", margin: "0 0 4px" }}>
          📹 Upload & Manage CCTV Footage
        </h1>
        <p style={{ color: "rgba(255,255,255,0.4)", margin: 0, fontSize: "14px" }}>
          Upload and manage CCTV footage for AI detection
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "400px 1fr", gap: "24px", alignItems: "start" }}>

        {/* ═══════════════════════ LEFT — Upload Form ═══════════════════════ */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

          {/* Upload card */}
          <div style={S.card}>
            <div style={{ ...S.cardHeader, background: "linear-gradient(135deg,#1a56db,#0891b2)" }}>
              <span style={{ fontSize: "22px" }}>⬆️</span>
              <div>
                <h2 style={{ margin: 0, fontSize: "16px", fontWeight: "800" }}>Upload New Footage</h2>
                <p style={{ margin: 0, fontSize: "12px", color: "rgba(255,255,255,0.7)" }}>MP4, AVI, MOV, MKV supported</p>
              </div>
            </div>

            <form onSubmit={handleUpload} style={{ padding: "22px" }}>

              {/* Video file picker */}
              <div style={{ marginBottom: "16px" }}>
                <label style={S.label}>VIDEO FILE *</label>
                <div
                  onClick={() => document.getElementById("vid-input").click()}
                  style={{
                    border: "2px dashed rgba(255,255,255,0.15)",
                    borderRadius: "10px", padding: "20px", textAlign: "center",
                    cursor: "pointer",
                    background: videoFile ? "rgba(26,86,219,0.1)" : "rgba(255,255,255,0.02)",
                  }}
                >
                  <input
                    id="vid-input" type="file"
                    accept="video/mp4,video/avi,video/quicktime,video/x-msvideo,video/mkv,video/webm,.mp4,.avi,.mov,.mkv"
                    style={{ display: "none" }}
                    onChange={e => { setVideoFile(e.target.files[0] || null); setUploadMsg(null); }}
                  />
                  {videoFile ? (
                    <div>
                      <p style={{ margin: "0 0 4px", color: "#60a5fa", fontWeight: "700", fontSize: "14px" }}>🎬 {videoFile.name}</p>
                      <p style={{ margin: 0, color: "rgba(255,255,255,0.4)", fontSize: "12px" }}>{(videoFile.size / (1024 * 1024)).toFixed(1)} MB</p>
                    </div>
                  ) : (
                    <div>
                      <p style={{ margin: "0 0 4px", fontSize: "28px" }}>🎥</p>
                      <p style={{ margin: "0 0 2px", color: "rgba(255,255,255,0.6)", fontSize: "13px", fontWeight: "600" }}>Click to browse video file</p>
                      <p style={{ margin: 0, color: "rgba(255,255,255,0.3)", fontSize: "11px" }}>MP4, AVI, MOV, MKV up to 500MB</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Location dropdown */}
              <div style={{ marginBottom: "16px" }}>
                <label style={S.label}>CAMERA LOCATION *</label>
                <select
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  style={{ ...S.input, cursor: "pointer" }}
                  required
                >
                  <option value="">-- Select Campus Location --</option>
                  {CAMPUS_LOCATIONS.map(loc => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
                <p style={{ margin: "5px 0 0", color: "#f97316", fontSize: "11px" }}>
                  ⚠️ Must match the location selected by the user when reporting
                </p>
              </div>

              {/* Lat / Lng */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "20px" }}>
                <div>
                  <label style={S.label}>LATITUDE (optional)</label>
                  <input type="number" step="any" value={latitude}
                    onChange={e => setLatitude(e.target.value)}
                    placeholder="e.g. 10.8505" style={S.input} />
                </div>
                <div>
                  <label style={S.label}>LONGITUDE (optional)</label>
                  <input type="number" step="any" value={longitude}
                    onChange={e => setLongitude(e.target.value)}
                    placeholder="e.g. 76.2711" style={S.input} />
                </div>
              </div>

              {/* Upload progress */}
              {uploading && uploadProgress > 0 && (
                <ProgressBar value={uploadProgress} label="Uploading..." />
              )}

              {/* Upload message */}
              {uploadMsg && (
                <div style={{
                  padding: "11px 16px", borderRadius: "8px", fontSize: "13px", marginBottom: "14px",
                  background: uploadMsg.type === "success" ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)",
                  border: `1px solid ${uploadMsg.type === "success" ? "#10b981" : "#ef4444"}`,
                  color: uploadMsg.type === "success" ? "#34d399" : "#fca5a5",
                }}>
                  {uploadMsg.text}
                </div>
              )}

              <button
                type="submit" disabled={uploading}
                style={{
                  width: "100%", padding: "13px",
                  background: uploading ? "rgba(255,255,255,0.1)" : "linear-gradient(135deg,#1a56db,#0891b2)",
                  border: "none", borderRadius: "10px", color: "#fff",
                  fontWeight: "700", fontSize: "14px", cursor: uploading ? "not-allowed" : "pointer",
                  fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                }}
              >
                {uploading ? "⏳ Uploading..." : "⬆️ Upload CCTV Video"}
              </button>
            </form>
          </div>

          {/* How it works */}
          <div style={S.card}>
            <div style={S.cardHeader}>
              <span style={{ fontSize: "18px" }}>🤖</span>
              <h3 style={{ margin: 0, fontSize: "14px", fontWeight: "700" }}>HOW AI DETECTION WORKS</h3>
            </div>
            <div style={{ padding: "18px 22px" }}>
              {[
                "Upload CCTV video with location tag",
                "Go to Reports → select a missing person",
                "Click 'Run Detection' — AI scans every frame",
                "DeepFace compares faces against missing person photo",
                "If matched → status updates to 'Detected'",
                "Location & timestamp saved automatically",
                "Reporter gets updated status on their portal",
              ].map((step, i) => (
                <div key={i} style={{ display: "flex", gap: "12px", marginBottom: "10px", alignItems: "flex-start" }}>
                  <div style={{
                    minWidth: "22px", height: "22px", borderRadius: "50%",
                    background: "linear-gradient(135deg,#1a56db,#0891b2)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "11px", fontWeight: "800", flexShrink: 0,
                  }}>{i + 1}</div>
                  <p style={{ margin: 0, color: "rgba(255,255,255,0.65)", fontSize: "13px", paddingTop: "3px" }}>{step}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ═══════════════════════ RIGHT — Videos ═══════════════════════════ */}
        <div style={S.card}>
          <div style={{ ...S.cardHeader, justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "20px" }}>🎬</span>
              <h2 style={{ margin: 0, fontSize: "16px", fontWeight: "800" }}>Uploaded Footage</h2>
              <span style={{
                background: "rgba(59,130,246,0.2)", color: "#60a5fa",
                padding: "3px 10px", borderRadius: "12px", fontSize: "12px", fontWeight: "700",
              }}>
                {videos.length} video{videos.length !== 1 ? "s" : ""}
              </span>
            </div>
            <button onClick={fetchVideos} style={{
              padding: "7px 16px", background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px",
              color: "#fff", cursor: "pointer", fontSize: "13px", fontFamily: "inherit",
            }}>
              ↻ Refresh
            </button>
          </div>

          <div style={{ padding: "20px" }}>
            {loadingVideos ? (
              <p style={{ color: "rgba(255,255,255,0.3)", textAlign: "center", padding: "40px" }}>Loading...</p>
            ) : videos.length === 0 ? (
              <div style={{ textAlign: "center", padding: "48px" }}>
                <p style={{ fontSize: "36px", margin: "0 0 10px" }}>📭</p>
                <p style={{ color: "rgba(255,255,255,0.3)", margin: 0 }}>No CCTV footage uploaded yet</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                {videos.map(video => {
                  const ds     = detState[video.id] || {};
                  const selRef = selReport[video.id] || "";
                  const report = reports.find(r => r.reference_id === selRef);

                  // Location match indicator
                  const locationMatches = selRef && report
                    ? (video.location || "").toLowerCase().includes(
                        (report.last_seen_location || "").split("(")[0].trim().toLowerCase()
                      ) ||
                      (report.last_seen_location || "").toLowerCase().includes(
                        (video.location || "").split("(")[0].trim().toLowerCase()
                      )
                    : null;

                  return (
                    <div key={video.id} style={{
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: "14px", overflow: "hidden",
                    }}>
                      {/* Video player */}
                      <div style={{ background: "#000" }}>
                        {video.video ? (
                          <video controls style={{ width: "100%", maxHeight: "220px", display: "block" }}
                            src={video.video.startsWith("http") ? video.video : `http://localhost:8000${video.video}`}>
                            Your browser does not support video.
                          </video>
                        ) : (
                          <div style={{ height: "120px", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.2)" }}>
                            No video file
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div style={{ padding: "16px 20px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px" }}>
                          <div>
                            <p style={{ margin: "0 0 3px", fontWeight: "700", fontSize: "15px" }}>📍 {video.location}</p>
                            <p style={{ margin: "0 0 2px", color: "rgba(255,255,255,0.4)", fontSize: "12px" }}>
                              ID: {video.id} · {video.uploaded_at ? new Date(video.uploaded_at).toLocaleString() : "—"}
                            </p>
                            {video.latitude && (
                              <p style={{ margin: 0, color: "rgba(255,255,255,0.3)", fontSize: "11px" }}>
                                🌐 {video.latitude}, {video.longitude}
                              </p>
                            )}
                          </div>
                          <Badge status={video.processed ? "Detected" : "Pending"} />
                        </div>

                        {/* Select missing person */}
                        <div style={{ marginBottom: "10px" }}>
                          <label style={S.label}>SELECT MISSING PERSON TO DETECT</label>
                          <select
                            value={selRef}
                            onChange={e => setSelReport(prev => ({ ...prev, [video.id]: e.target.value }))}
                            style={{ ...S.input, cursor: "pointer", fontSize: "13px" }}
                          >
                            <option value="">-- Select Person --</option>
                            {reports.map(r => (
                              <option key={r.reference_id} value={r.reference_id}>
                                {r.name} — {r.last_seen_location} [{r.status}]
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Location match indicator */}
                        {selRef && report && (
                          <div style={{
                            padding: "8px 12px", borderRadius: "8px", fontSize: "12px", marginBottom: "10px",
                            background: locationMatches ? "rgba(16,185,129,0.1)" : "rgba(234,179,8,0.1)",
                            border: `1px solid ${locationMatches ? "rgba(16,185,129,0.3)" : "rgba(234,179,8,0.3)"}`,
                            color: locationMatches ? "#34d399" : "#fbbf24",
                          }}>
                            {locationMatches
                              ? `✅ Location match — CCTV at "${video.location}" matches last seen "${report.last_seen_location}"`
                              : `⚠️ Location mismatch — CCTV: "${video.location}" | Last seen: "${report.last_seen_location}" — will scan anyway`
                            }
                          </div>
                        )}

                        {/* Detection progress */}
                        {ds.running && (
                          <ProgressBar value={ds.progress || 0} label={ds.message || "Scanning..."} />
                        )}

                        {/* Detection result */}
                        {!ds.running && ds.message && (
                          <div style={{
                            padding: "12px 14px", borderRadius: "8px", fontSize: "13px",
                            marginBottom: "12px", lineHeight: "1.6",
                            background: ds.found ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.12)",
                            border: `1px solid ${ds.found ? "#10b981" : "#ef4444"}`,
                            color: ds.found ? "#34d399" : "#fca5a5",
                            wordBreak: "break-word",
                          }}>
                            {ds.message}

                            {/* Show detection details if found */}
                            {ds.found && ds.result?.detections?.length > 0 && (
                              <div style={{ marginTop: "10px", borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: "10px" }}>
                                {ds.result.detections.map((d, i) => (
                                  <div key={i}>
                                    <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.6)", marginBottom: "10px" }}>
                                      📍 {d.location} &nbsp;·&nbsp;
                                      🎯 {d.confidence}% &nbsp;·&nbsp;
                                      🕒 {new Date(d.timestamp).toLocaleString()}
                                      {d.latitude && ` · 🌐 ${d.latitude}, ${d.longitude}`}
                                    </div>
                                    
                                    {/* Display detected frame and face images */}
                                    {(d.frame_b64 || d.face_b64) && (
                                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "12px" }}>
                                        {d.frame_b64 && (
                                          <div style={{ borderRadius: "8px", overflow: "hidden", background: "#000" }}>
                                            <img src={d.frame_b64} alt="Detected frame" style={{ width: "100%", display: "block", maxHeight: "150px", objectFit: "contain" }} />
                                            <p style={{ margin: "4px 0 0", fontSize: "10px", color: "rgba(255,255,255,0.5)", textAlign: "center" }}>↖️ Frame with detection box</p>
                                          </div>
                                        )}
                                        {d.face_b64 && (
                                          <div style={{ borderRadius: "8px", overflow: "hidden", background: "#000" }}>
                                            <img src={d.face_b64} alt="Detected face" style={{ width: "100%", display: "block", maxHeight: "150px", objectFit: "contain" }} />
                                            <p style={{ margin: "4px 0 0", fontSize: "10px", color: "rgba(255,255,255,0.5)", textAlign: "center" }}>👤 Cropped face</p>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Action buttons */}
                        <div style={{ display: "flex", gap: "10px" }}>
                          <button
                            onClick={() => handleRunDetection(video)}
                            disabled={ds.running || !selRef}
                            style={{
                              flex: 1, padding: "11px",
                              background: ds.running
                                ? "rgba(147,51,234,0.3)"
                                : selRef
                                ? "linear-gradient(135deg,#7c3aed,#1a56db)"
                                : "rgba(255,255,255,0.06)",
                              border: "none", borderRadius: "8px",
                              color: selRef ? "#fff" : "rgba(255,255,255,0.3)",
                              fontWeight: "700", fontSize: "13px",
                              cursor: ds.running || !selRef ? "not-allowed" : "pointer",
                              fontFamily: "inherit",
                              display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
                            }}
                          >
                            {ds.running ? "⏳ Scanning..." : "🤖 Run Detection"}
                          </button>

                          <button
                            onClick={() => handleDelete(video.id)}
                            disabled={ds.running}
                            style={{
                              padding: "11px 16px",
                              background: "rgba(239,68,68,0.1)",
                              border: "1px solid rgba(239,68,68,0.3)",
                              borderRadius: "8px", color: "#fca5a5",
                              cursor: "pointer", fontFamily: "inherit", fontSize: "14px",
                            }}
                          >
                            🗑️
                          </button>
                        </div>

                        {!selRef && (
                          <p style={{ margin: "8px 0 0", color: "#f97316", fontSize: "11px", textAlign: "center" }}>
                            ⚠️ Select a missing person above to enable detection
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}