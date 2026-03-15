import { useEffect, useState } from "react";
import axios from "axios";

const API = "http://localhost:8000/api";

const StatusBadge = ({ status }) => {
  const colors = {
    pending:    { bg: "rgba(234,179,8,0.15)",  color: "#fbbf24" },
    processing: { bg: "rgba(59,130,246,0.15)", color: "#60a5fa" },
    completed:  { bg: "rgba(34,197,94,0.15)",  color: "#4ade80" },
    found:      { bg: "rgba(16,185,129,0.15)", color: "#34d399" },
  };
  const s = colors[status] || colors.pending;
  return (
    <span style={{ padding: "3px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: "700", background: s.bg, color: s.color }}>
      {status}
    </span>
  );
};

export default function DetectionList() {
  const [tab, setTab]           = useState("reports");
  const [reports, setReports]   = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading]   = useState(false);
  const [search, setSearch]     = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [processingId, setProcessingId] = useState("");
  const [processResult, setProcessResult] = useState(null);
  const [detailModal, setDetailModal] = useState(null);

  // Student form
  const [studentForm, setStudentForm] = useState({ student_id: "", full_name: "", department: "", photo: null, preview: null });
  const [addingStudent, setAddingStudent] = useState(false);

  const loadReports = () => {
    setLoading(true);
    axios.get(`${API}/admin/get-reports/`)
      .then(res => setReports(res.data || []))
      .catch(err => console.error("Reports error:", err))
      .finally(() => setLoading(false));
  };

  const loadStudents = () => {
    setLoading(true);
    axios.get(`${API}/admin/get-students/`)
      .then(res => { console.log("Students loaded:", res.data); setStudents(res.data || []); })
      .catch(err => console.error("Students error:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadReports();
    loadStudents();
  }, []);

  useEffect(() => {
    if (tab === "reports") loadReports();
    if (tab === "students") loadStudents();
  }, [tab]);

  const handleAddStudent = async (e) => {
    e.preventDefault();
    setAddingStudent(true);
    const fd = new FormData();
    fd.append("student_id", studentForm.student_id);
    fd.append("full_name",  studentForm.full_name);
    fd.append("department", studentForm.department);
    if (studentForm.photo) fd.append("photo", studentForm.photo);
    try {
      await axios.post(`${API}/admin/add-student/`, fd);
      alert("✅ Student added!");
      setStudentForm({ student_id: "", full_name: "", department: "", photo: null, preview: null });
      loadStudents();
    } catch { alert("Failed to add student"); }
    finally { setAddingStudent(false); }
  };

  const handleRunDetection = async () => {
    if (!processingId) { alert("Select or enter a Reference ID first"); return; }
    setLoading(true); setProcessResult(null);
    try {
      const res = await axios.post(`${API}/admin/process-detection/${processingId}/`);
      setProcessResult(res.data);
      loadReports(); // Refresh to show updated status
    } catch (err) {
      const msg = err.response?.data?.error || "Detection failed. Check backend is running.";
      alert("❌ " + msg);
    } finally { setLoading(false); }
  };

  const handleStatusUpdate = async (refId, newStatus) => {
    try {
      await axios.post(`${API}/admin/update-status/${refId}/`, { status: newStatus });
      loadReports();
    } catch { alert("Failed to update status"); }
  };

  const filtered = reports.filter(r => {
    const q = search.toLowerCase();
    const matchSearch = r.name?.toLowerCase().includes(q) || r.reference_id?.toLowerCase().includes(q);
    const matchStatus = filterStatus === "all" || r.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const base = {
    minHeight: "100vh", background: "#0f172a", padding: "32px",
    fontFamily: "'Segoe UI', sans-serif", color: "#fff"
  };

  const tabBtn = (id, label, icon) => (
    <button key={id} onClick={() => setTab(id)} style={{
      padding: "10px 20px", borderRadius: "10px", border: "none", cursor: "pointer",
      background: tab === id ? "linear-gradient(135deg,#3b82f6,#06b6d4)" : "rgba(255,255,255,0.07)",
      color: tab === id ? "#fff" : "rgba(255,255,255,0.5)",
      fontWeight: tab === id ? "700" : "400", fontSize: "14px",
      display: "flex", alignItems: "center", gap: "8px"
    }}><span>{icon}</span>{label}</button>
  );

  return (
    <div style={base}>
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ fontSize: "28px", fontWeight: "800", margin: "0 0 4px" }}>Management</h1>
        <p style={{ color: "rgba(255,255,255,0.4)", margin: 0, fontSize: "14px" }}>Reports, Students & Detection</p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "28px", flexWrap: "wrap" }}>
        {tabBtn("reports",   "Reports",   "📋")}
        {tabBtn("students",  "Students",  "👥")}
        {tabBtn("detection", "Detection", "🎯")}
      </div>

      {/* ─── REPORTS TAB ─────────────────────────────────────── */}
      {tab === "reports" && (
        <div>
          {/* Search & Filter */}
          <div style={{ display: "flex", gap: "12px", marginBottom: "20px", flexWrap: "wrap" }}>
            <input
              placeholder="Search by name or reference ID..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                flex: 1, minWidth: "220px", padding: "12px 16px",
                background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "10px", color: "#fff", fontSize: "14px", outline: "none"
              }}
            />
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              style={{
                padding: "12px 16px", background: "rgba(255,255,255,0.07)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "10px", color: "#fff", outline: "none", cursor: "pointer"
              }}
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="completed">Completed</option>
              <option value="found">Found</option>
            </select>
            <button onClick={loadReports} style={{
              padding: "12px 20px", background: "rgba(59,130,246,0.2)",
              border: "1px solid rgba(59,130,246,0.3)", borderRadius: "10px",
              color: "#60a5fa", cursor: "pointer", fontWeight: "600"
            }}>↺ Refresh</button>
          </div>

          {/* Cards Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "16px" }}>
            {filtered.map((r, i) => (
              <div key={r.reference_id || i} style={{
                background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "14px", overflow: "hidden",
                transition: "border-color 0.2s"
              }}
                onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(59,130,246,0.4)"}
                onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"}
              >
                {r.photo ? (
                  <img src={`http://localhost:8000${r.photo}`} alt={r.name}
                    style={{ width: "100%", height: "140px", objectFit: "cover" }} />
                ) : (
                  <div style={{
                    height: "140px", background: "rgba(59,130,246,0.1)",
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: "48px"
                  }}>👤</div>
                )}
                <div style={{ padding: "16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                    <div>
                      <h3 style={{ margin: "0 0 2px", fontSize: "15px", fontWeight: "700" }}>{r.name}</h3>
                      <p style={{ margin: 0, fontFamily: "monospace", fontSize: "12px", color: "#60a5fa" }}>{r.reference_id}</p>
                    </div>
                    <StatusBadge status={r.status} />
                  </div>
                  <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "13px", margin: "0 0 12px" }}>
                    {r.department || <span style={{ color: "#f97316" }}>Outsider</span>}
                  </p>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button onClick={() => setDetailModal(r)} style={{
                      flex: 1, padding: "8px", background: "rgba(59,130,246,0.15)",
                      border: "1px solid rgba(59,130,246,0.3)", borderRadius: "8px",
                      color: "#60a5fa", cursor: "pointer", fontSize: "12px", fontWeight: "600"
                    }}>View Details</button>
                    <select
                      value={r.status}
                      onChange={e => handleStatusUpdate(r.reference_id, e.target.value)}
                      style={{
                        padding: "8px", background: "rgba(255,255,255,0.07)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "8px", color: "#fff", cursor: "pointer", fontSize: "12px"
                      }}
                    >
                      <option value="pending">Pending</option>
                      <option value="processing">Processing</option>
                      <option value="completed">Completed</option>
                      <option value="found">Found</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div style={{ gridColumn: "1/-1", padding: "48px", textAlign: "center" }}>
                <p style={{ fontSize: "36px", margin: "0 0 12px" }}>🔎</p>
                <p style={{ color: "rgba(255,255,255,0.3)" }}>No reports found</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── STUDENTS TAB ────────────────────────────────────── */}
      {tab === "students" && (
        <div style={{ display: "grid", gridTemplateColumns: "340px 1fr", gap: "24px" }}>
          {/* Add Form */}
          <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px", overflow: "hidden" }}>
            <div style={{ padding: "18px 20px", background: "linear-gradient(135deg,#1d4ed8,#0e7490)", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700" }}>➕ Add Student</h3>
            </div>
            <form onSubmit={handleAddStudent} style={{ padding: "20px" }}>
              {[
                { label: "Student ID", key: "student_id", placeholder: "e.g. CS2024001" },
                { label: "Full Name",  key: "full_name",  placeholder: "Enter full name" },
              ].map(({ label, key, placeholder }) => (
                <div key={key} style={{ marginBottom: "16px" }}>
                  <label style={{ display: "block", color: "#93c5fd", fontSize: "12px", fontWeight: "600", marginBottom: "6px" }}>{label} *</label>
                  <input
                    value={studentForm[key]}
                    onChange={e => setStudentForm(p => ({ ...p, [key]: e.target.value }))}
                    placeholder={placeholder} required
                    style={{ width: "100%", padding: "10px 12px", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#fff", outline: "none", boxSizing: "border-box", fontSize: "14px" }}
                  />
                </div>
              ))}
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", color: "#93c5fd", fontSize: "12px", fontWeight: "600", marginBottom: "6px" }}>Department *</label>
                <select
                  value={studentForm.department}
                  onChange={e => setStudentForm(p => ({ ...p, department: e.target.value }))}
                  required
                  style={{ width: "100%", padding: "10px 12px", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#fff", outline: "none", boxSizing: "border-box", fontSize: "14px" }}
                >
                  <option value="">Select</option>
                  {["Computer Science","Electronics","Mechanical","Civil","Electrical","MBA","MCA"].map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", color: "#93c5fd", fontSize: "12px", fontWeight: "600", marginBottom: "6px" }}>Photo *</label>
                <input
                  type="file" accept="image/*" required
                  onChange={e => {
                    const f = e.target.files[0];
                    if (f) setStudentForm(p => ({ ...p, photo: f, preview: URL.createObjectURL(f) }));
                  }}
                  style={{ width: "100%", fontSize: "13px", color: "rgba(255,255,255,0.6)" }}
                />
                {studentForm.preview && (
                  <img src={studentForm.preview} alt="preview" style={{ width: "100%", height: "120px", objectFit: "cover", borderRadius: "8px", marginTop: "8px" }} />
                )}
              </div>
              <button type="submit" disabled={addingStudent} style={{
                width: "100%", padding: "12px",
                background: addingStudent ? "rgba(59,130,246,0.3)" : "linear-gradient(135deg,#3b82f6,#06b6d4)",
                border: "none", borderRadius: "10px", color: "#fff",
                fontWeight: "700", cursor: addingStudent ? "not-allowed" : "pointer", fontSize: "14px"
              }}>
                {addingStudent ? "Adding..." : "Add Student"}
              </button>
            </form>
          </div>

          {/* Student Grid */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "700" }}>Student Database ({students.length})</h3>
              <button onClick={loadStudents} style={{ padding: "8px 16px", background: "rgba(59,130,246,0.2)", border: "1px solid rgba(59,130,246,0.3)", borderRadius: "8px", color: "#60a5fa", cursor: "pointer", fontSize: "13px" }}>↺ Refresh</button>
            </div>
            {students.length === 0 ? (
              <div style={{ padding: "48px", textAlign: "center", background: "rgba(255,255,255,0.03)", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.07)" }}>
                <p style={{ fontSize: "36px", margin: "0 0 12px" }}>👥</p>
                <p style={{ color: "rgba(255,255,255,0.3)" }}>No students added yet</p>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "14px" }}>
                {students.map(s => (
                  <div key={s.id} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", overflow: "hidden" }}>
                    <img src={`http://localhost:8000${s.photo}`} alt={s.full_name} style={{ width: "100%", height: "120px", objectFit: "cover" }} />
                    <div style={{ padding: "12px" }}>
                      <p style={{ margin: "0 0 2px", fontWeight: "700", fontSize: "14px" }}>{s.full_name}</p>
                      <p style={{ margin: "0 0 2px", fontFamily: "monospace", fontSize: "12px", color: "#60a5fa" }}>{s.student_id}</p>
                      <p style={{ margin: 0, color: "rgba(255,255,255,0.4)", fontSize: "12px" }}>{s.department}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── DETECTION TAB ───────────────────────────────────── */}
      {tab === "detection" && (
        <div style={{ maxWidth: "600px" }}>
          <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px", overflow: "hidden" }}>
            <div style={{ padding: "18px 24px", background: "linear-gradient(135deg,#1d4ed8,#0e7490)", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700" }}>🎯 Run AI Detection</h3>
              <p style={{ margin: "4px 0 0", color: "rgba(255,255,255,0.6)", fontSize: "13px" }}>Match a missing person against CCTV footage</p>
            </div>
            <div style={{ padding: "24px" }}>
              <label style={{ display: "block", color: "#93c5fd", fontSize: "12px", fontWeight: "600", marginBottom: "8px" }}>REFERENCE ID</label>
              <input
                value={processingId}
                onChange={e => setProcessingId(e.target.value)}
                placeholder="e.g. MP1A2B3C4D"
                style={{
                  width: "100%", padding: "14px 16px",
                  background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "10px", color: "#fff", fontSize: "14px", fontFamily: "monospace",
                  outline: "none", boxSizing: "border-box", marginBottom: "8px"
                }}
              />

              {/* Quick pick */}
              {reports.length > 0 && (
                <div style={{ marginBottom: "20px" }}>
                  <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px", marginBottom: "8px" }}>Or pick a recent report:</p>
                  <div style={{ maxHeight: "160px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "6px" }}>
                    {reports.slice(0, 8).map(r => (
                      <button key={r.reference_id} onClick={() => setProcessingId(r.reference_id)} style={{
                        padding: "8px 12px", textAlign: "left",
                        background: processingId === r.reference_id ? "rgba(59,130,246,0.2)" : "rgba(255,255,255,0.05)",
                        border: processingId === r.reference_id ? "1px solid rgba(59,130,246,0.4)" : "1px solid rgba(255,255,255,0.08)",
                        borderRadius: "8px", cursor: "pointer", color: "#fff",
                        display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "13px"
                      }}>
                        <span><span style={{ fontFamily: "monospace", color: "#60a5fa" }}>{r.reference_id}</span> — {r.name}</span>
                        <StatusBadge status={r.status} />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <button onClick={handleRunDetection} disabled={loading || !processingId} style={{
                width: "100%", padding: "14px",
                background: loading ? "rgba(59,130,246,0.3)" : "linear-gradient(135deg,#3b82f6,#06b6d4)",
                border: "none", borderRadius: "10px", color: "#fff",
                fontWeight: "700", cursor: loading ? "not-allowed" : "pointer",
                fontSize: "15px", marginBottom: "16px"
              }}>
                {loading ? "⏳ Processing..." : "🎯 Start Detection"}
              </button>

              {processResult && (
                <div style={{ borderRadius: "12px", overflow: "hidden", border: `1px solid ${processResult.detections_count > 0 ? "rgba(16,185,129,0.4)" : "rgba(59,130,246,0.3)"}` }}>
                  <div style={{ padding: "14px 18px", background: processResult.detections_count > 0 ? "rgba(16,185,129,0.15)" : "rgba(59,130,246,0.1)", display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{ fontSize: "20px" }}>{processResult.detections_count > 0 ? "✅" : "🔍"}</span>
                    <div>
                      <p style={{ margin: 0, fontWeight: "800", fontSize: "15px", color: processResult.detections_count > 0 ? "#34d399" : "#60a5fa" }}>
                        {processResult.detections_count > 0 ? `PERSON FOUND — ${processResult.detections_count} match(es)` : "No match found yet"}
                      </p>
                      <p style={{ margin: "2px 0 0", color: "rgba(255,255,255,0.5)", fontSize: "12px" }}>{processResult.message}</p>
                    </div>
                  </div>
                  {processResult.detections?.length > 0 && (
                    <div style={{ padding: "12px 18px", background: "rgba(0,0,0,0.2)" }}>
                      <p style={{ margin: "0 0 10px", color: "#93c5fd", fontSize: "12px", fontWeight: "700" }}>DETECTION LOCATIONS:</p>
                      {processResult.detections.map((d, i) => (
                        <div key={i} style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: "8px", padding: "10px 14px", marginBottom: "8px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                            <p style={{ margin: 0, color: "#4ade80", fontWeight: "700", fontSize: "14px" }}>📍 {d.location}</p>
                            {d.total_sightings > 0 && (
                              <span style={{ padding: "2px 8px", borderRadius: "12px", fontSize: "11px", fontWeight: "700", background: "rgba(251,191,36,0.2)", color: "#fbbf24" }}>
                                Sighting {d.sighting_number}/{d.total_sightings}
                              </span>
                            )}
                          </div>
                          {d.matched_person && (
                            <p style={{ margin: "0 0 3px", color: "#34d399", fontSize: "13px", fontWeight: "600" }}>👤 Matched: {d.matched_person}</p>
                          )}
                          <p style={{ margin: "0 0 3px", color: "rgba(255,255,255,0.5)", fontSize: "12px" }}>🕒 {d.timestamp ? new Date(d.timestamp).toLocaleString() : "—"}</p>
                          <p style={{ margin: "0 0 8px", color: "rgba(255,255,255,0.5)", fontSize: "12px" }}>Confidence: {(d.confidence * 100).toFixed(1)}%</p>
                          {(d.snapshot || d.face_crop) && (
                            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                              {d.face_crop && (
                                <div style={{ flex: "0 0 auto" }}>
                                  <p style={{ margin: "0 0 4px", color: "rgba(255,255,255,0.3)", fontSize: "10px", fontWeight: "700", letterSpacing: "0.06em" }}>FACE DETECTED</p>
                                  <img src={d.face_crop} alt="Face" style={{ width: "72px", height: "72px", objectFit: "cover", borderRadius: "8px", border: "2px solid #f59e0b", background: "rgba(0,0,0,0.3)" }} />
                                </div>
                              )}
                              {d.snapshot && (
                                <div style={{ flex: 1, minWidth: "120px" }}>
                                  <p style={{ margin: "0 0 4px", color: "rgba(255,255,255,0.3)", fontSize: "10px", fontWeight: "700", letterSpacing: "0.06em" }}>CCTV FRAME</p>
                                  <img src={d.snapshot} alt="CCTV" style={{ width: "100%", maxHeight: "160px", objectFit: "contain", borderRadius: "8px", border: "2px solid #4ade80", background: "rgba(0,0,0,0.3)" }} />
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  {processResult.status === "no_videos" && (
                    <div style={{ padding: "12px 18px", background: "rgba(234,179,8,0.08)" }}>
                      <p style={{ margin: 0, color: "#fbbf24", fontSize: "13px" }}>⚠️ No CCTV videos uploaded yet. Go to <strong>Upload CCTV</strong> tab to add footage first.</p>
                    </div>
                  )}
                </div>
              )}

              {/* How it works */}
              <div style={{ marginTop: "20px", padding: "16px", background: "rgba(255,255,255,0.03)", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.07)" }}>
                <p style={{ margin: "0 0 10px", fontWeight: "600", fontSize: "14px", color: "rgba(255,255,255,0.7)" }}>How it works:</p>
                {[
                  "GA selects 10 most diverse keyframes from CCTV video",
                  "YOLOv8 (best.pt) detects faces in each keyframe",
                  "ArcFace extracts embeddings from detected faces",
                  "Compares against ALL student database photos",
                  "Identifies the missing person & returns all sightings",
                ].map((step, i) => (
                  <p key={i} style={{ margin: "0 0 6px", color: "rgba(255,255,255,0.4)", fontSize: "13px" }}>
                    <span style={{ color: "#3b82f6", marginRight: "8px" }}>▸</span>{step}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {detailModal && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)",
          backdropFilter: "blur(4px)", zIndex: 999,
          display: "flex", alignItems: "center", justifyContent: "center", padding: "20px"
        }}>
          <div style={{
            background: "#1e293b", border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "20px", width: "100%", maxWidth: "480px",
            maxHeight: "90vh", overflowY: "auto", boxShadow: "0 25px 60px rgba(0,0,0,0.6)"
          }}>
            <div style={{ padding: "20px 24px", background: "linear-gradient(135deg,#1d4ed8,#0e7490)", display: "flex", justifyContent: "space-between", alignItems: "center", borderRadius: "20px 20px 0 0" }}>
              <h3 style={{ margin: 0 }}>Report Details</h3>
              <button onClick={() => setDetailModal(null)} style={{ background: "none", border: "none", color: "#fff", fontSize: "20px", cursor: "pointer", lineHeight: 1 }}>✕</button>
            </div>
            <div style={{ padding: "24px" }}>
              {detailModal.photo && (
                <img src={`http://localhost:8000${detailModal.photo}`} alt={detailModal.name}
                  style={{ width: "100%", height: "200px", objectFit: "cover", borderRadius: "12px", marginBottom: "20px" }} />
              )}
              <div style={{
                background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.25)",
                borderRadius: "12px", padding: "14px 18px", marginBottom: "16px"
              }}>
                <p style={{ margin: "0 0 4px", color: "#93c5fd", fontSize: "12px", fontWeight: "600" }}>REFERENCE ID</p>
                <p style={{ margin: 0, fontFamily: "monospace", fontSize: "22px", fontWeight: "800", color: "#fff", letterSpacing: "0.05em" }}>
                  {detailModal.reference_id}
                </p>
              </div>
              {[
                ["Name",          detailModal.name],
                ["Student ID",    detailModal.student_id || (detailModal.is_outsider ? "Outsider" : "—")],
                ["Department",    detailModal.department || "Outsider"],
                ["Dress Code",    detailModal.dress_code],
                ["Last Seen",     detailModal.last_seen_location],
                ["Reporter Email",detailModal.email || detailModal.submitter_email],
                ["Status",        detailModal.status],
              ].map(([label, value]) => (
                <div key={label} style={{ background: "rgba(255,255,255,0.04)", borderRadius: "10px", padding: "12px 16px", marginBottom: "8px" }}>
                  <p style={{ margin: "0 0 2px", color: "rgba(255,255,255,0.4)", fontSize: "11px", fontWeight: "600", letterSpacing: "0.08em" }}>{label.toUpperCase()}</p>
                  <p style={{ margin: 0, color: "#fff", fontSize: "14px" }}>{value}</p>
                </div>
              ))}
              <button
                onClick={() => { setDetailModal(null); setProcessingId(detailModal.reference_id); setTab("detection"); }}
                style={{
                  width: "100%", marginTop: "8px", padding: "12px",
                  background: "linear-gradient(135deg,#3b82f6,#06b6d4)",
                  border: "none", borderRadius: "10px", color: "#fff",
                  fontWeight: "700", cursor: "pointer", fontSize: "14px"
                }}
              >
                🎯 Run Detection for This Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}