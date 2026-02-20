import { useEffect, useState } from "react";
import axios from "axios";

const API = "http://localhost:8000/api";

export default function UploadCCTV() {
  const [videos, setVideos]     = useState([]);
  const [loading, setLoading]   = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [form, setForm]         = useState({ location: "", latitude: "", longitude: "", video: null });
  const [error, setError]       = useState("");
  const [success, setSuccess]   = useState("");

  const loadVideos = () => {
    setLoading(true);
    axios.get(`${API}/admin/get-cctv-videos/`)
      .then(res => setVideos(res.data || []))
      .catch(err => console.error("Load videos error:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadVideos(); }, []);

  const handleUpload = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");

    if (!form.video)    { setError("Please select a video file"); return; }
    if (!form.location) { setError("Please enter a location"); return; }

    setUploading(true); setProgress(0);

    const fd = new FormData();
    fd.append("video",    form.video);
    fd.append("location", form.location);
    if (form.latitude)  fd.append("latitude",  form.latitude);
    if (form.longitude) fd.append("longitude", form.longitude);

    try {
      await axios.post(`${API}/admin/cctv/upload/`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (e) => {
          setProgress(Math.round((e.loaded / e.total) * 100));
        }
      });
      setSuccess("✅ CCTV video uploaded successfully!");
      setForm({ location: "", latitude: "", longitude: "", video: null });
      document.getElementById("video-input").value = "";
      loadVideos();
    } catch (err) {
      setError(err.response?.data?.error || "Upload failed. Check backend is running.");
    } finally {
      setUploading(false); setProgress(0);
    }
  };

  const S = {
    input: {
      width: "100%", padding: "11px 14px",
      background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)",
      borderRadius: "8px", color: "#fff", fontSize: "14px",
      outline: "none", boxSizing: "border-box", fontFamily: "inherit",
    },
    label: { display: "block", color: "#93c5fd", fontSize: "12px", fontWeight: "700", marginBottom: "6px", letterSpacing: "0.06em" },
    card:  { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "14px", overflow: "hidden" },
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0f172a", padding: "32px", fontFamily: "'Segoe UI', sans-serif", color: "#fff" }}>
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ fontSize: "26px", fontWeight: "800", margin: "0 0 4px" }}>📹 CCTV Management</h1>
        <p style={{ color: "rgba(255,255,255,0.4)", margin: 0, fontSize: "14px" }}>Upload and manage CCTV footage for AI detection</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "380px 1fr", gap: "24px", alignItems: "start" }}>

        {/* Upload Form */}
        <div style={S.card}>
          <div style={{ padding: "18px 22px", background: "linear-gradient(135deg,#1d4ed8,#0e7490)", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700" }}>⬆️ Upload New Footage</h3>
            <p style={{ margin: "4px 0 0", color: "rgba(255,255,255,0.6)", fontSize: "12px" }}>MP4, AVI, MOV supported</p>
          </div>
          <form onSubmit={handleUpload} style={{ padding: "22px" }}>

            {/* Video file */}
            <div style={{ marginBottom: "16px" }}>
              <label style={S.label}>VIDEO FILE *</label>
              <input
                id="video-input" type="file" accept="video/*"
                onChange={e => setForm(p => ({ ...p, video: e.target.files[0] }))}
                style={{ ...S.input, padding: "10px 12px", cursor: "pointer" }}
              />
              {form.video && (
                <p style={{ margin: "6px 0 0", color: "#4ade80", fontSize: "12px" }}>
                  ✓ {form.video.name} ({(form.video.size / 1024 / 1024).toFixed(1)} MB)
                </p>
              )}
            </div>

            {/* Location */}
            <div style={{ marginBottom: "16px" }}>
              <label style={S.label}>CAMERA LOCATION *</label>
              <input
                value={form.location}
                onChange={e => setForm(p => ({ ...p, location: e.target.value }))}
                placeholder="e.g. Main Gate, Library Entrance, Corridor B"
                style={S.input} required
              />
            </div>

            {/* GPS (optional) */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "20px" }}>
              <div>
                <label style={S.label}>LATITUDE (optional)</label>
                <input value={form.latitude} onChange={e => setForm(p => ({ ...p, latitude: e.target.value }))}
                  placeholder="e.g. 10.8505" style={S.input} type="number" step="any" />
              </div>
              <div>
                <label style={S.label}>LONGITUDE (optional)</label>
                <input value={form.longitude} onChange={e => setForm(p => ({ ...p, longitude: e.target.value }))}
                  placeholder="e.g. 76.2711" style={S.input} type="number" step="any" />
              </div>
            </div>

            {/* Progress bar */}
            {uploading && (
              <div style={{ marginBottom: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                  <span style={{ color: "rgba(255,255,255,0.6)", fontSize: "13px" }}>Uploading...</span>
                  <span style={{ color: "#60a5fa", fontWeight: "700", fontSize: "13px" }}>{progress}%</span>
                </div>
                <div style={{ height: "6px", background: "rgba(255,255,255,0.1)", borderRadius: "10px", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${progress}%`, background: "linear-gradient(90deg,#3b82f6,#06b6d4)", transition: "width 0.3s" }} />
                </div>
              </div>
            )}

            {error   && <div style={{ padding: "10px 14px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "8px", color: "#fca5a5", fontSize: "13px", marginBottom: "14px" }}>⚠️ {error}</div>}
            {success && <div style={{ padding: "10px 14px", background: "rgba(34,197,94,0.1)",  border: "1px solid rgba(34,197,94,0.3)",  borderRadius: "8px", color: "#4ade80",  fontSize: "13px", marginBottom: "14px" }}>{success}</div>}

            <button type="submit" disabled={uploading} style={{
              width: "100%", padding: "13px",
              background: uploading ? "rgba(59,130,246,0.3)" : "linear-gradient(135deg,#3b82f6,#06b6d4)",
              border: "none", borderRadius: "10px", color: "#fff",
              fontWeight: "700", cursor: uploading ? "not-allowed" : "pointer", fontSize: "14px", fontFamily: "inherit"
            }}>
              {uploading ? `⏳ Uploading... ${progress}%` : "⬆️ Upload CCTV Video"}
            </button>
          </form>

          {/* How detection works */}
          <div style={{ padding: "0 22px 22px" }}>
            <div style={{ padding: "14px 16px", background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.15)", borderRadius: "10px" }}>
              <p style={{ margin: "0 0 10px", color: "#93c5fd", fontSize: "12px", fontWeight: "700" }}>🤖 HOW AI DETECTION WORKS</p>
              {[
                "Upload CCTV video with location tag",
                "Go to Reports → select a missing person",
                "Click 'Run Detection' — AI scans every frame",
                "DeepFace compares faces against missing person photo",
                "If matched → status updates to 'Detected'",
                "Location & timestamp saved automatically",
                "Reporter gets updated status on their portal",
              ].map((s, i) => (
                <p key={i} style={{ margin: "0 0 5px", color: "rgba(255,255,255,0.45)", fontSize: "12px" }}>
                  <span style={{ color: "#3b82f6", marginRight: "6px", fontWeight: "700" }}>{i + 1}.</span>{s}
                </p>
              ))}
            </div>
          </div>
        </div>

        {/* Videos List */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h3 style={{ margin: 0, fontSize: "17px", fontWeight: "700" }}>Uploaded Footage ({videos.length})</h3>
            <button onClick={loadVideos} style={{ padding: "8px 16px", background: "rgba(59,130,246,0.15)", border: "1px solid rgba(59,130,246,0.3)", borderRadius: "8px", color: "#60a5fa", cursor: "pointer", fontSize: "13px" }}>
              ↺ Refresh
            </button>
          </div>

          {loading ? (
            <div style={{ padding: "40px", textAlign: "center", color: "rgba(255,255,255,0.3)" }}>Loading...</div>
          ) : videos.length === 0 ? (
            <div style={{ ...S.card, padding: "48px", textAlign: "center" }}>
              <p style={{ fontSize: "40px", margin: "0 0 12px" }}>📹</p>
              <p style={{ color: "rgba(255,255,255,0.3)", margin: 0 }}>No CCTV videos uploaded yet</p>
              <p style={{ color: "rgba(255,255,255,0.2)", fontSize: "13px", marginTop: "6px" }}>Upload footage using the form on the left</p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "14px" }}>
              {videos.map(v => (
                <div key={v.id} style={S.card}>
                  {v.video ? (
                    <video src={`http://localhost:8000${v.video}`} controls style={{ width: "100%", height: "150px", objectFit: "cover", background: "#000" }} />
                  ) : (
                    <div style={{ height: "150px", background: "rgba(0,0,0,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "36px" }}>📹</div>
                  )}
                  <div style={{ padding: "14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                      <span style={{ fontSize: "14px" }}>📍</span>
                      <p style={{ margin: 0, fontWeight: "700", fontSize: "14px" }}>{v.location || "Unknown location"}</p>
                    </div>
                    <p style={{ margin: "0 0 8px", fontFamily: "monospace", fontSize: "11px", color: "#60a5fa" }}>ID: {v.id}</p>
                    {v.uploaded_at && (
                      <p style={{ margin: "0 0 8px", color: "rgba(255,255,255,0.4)", fontSize: "12px" }}>
                        📅 {new Date(v.uploaded_at).toLocaleString()}
                      </p>
                    )}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{
                        padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: "700",
                        background: v.processed ? "rgba(34,197,94,0.15)" : "rgba(234,179,8,0.15)",
                        color:      v.processed ? "#4ade80"              : "#fbbf24",
                      }}>
                        {v.processed ? "✓ Processed" : "⏳ Pending"}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}