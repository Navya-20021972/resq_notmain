import { useState } from "react";

const API = "http://localhost:8000/api";

// ── Design tokens ──────────────────────────────────────────
const C = {
  navy:    "#0a1628",
  navyMid: "#0f2040",
  blue:    "#1a56db",
  teal:    "#0891b2",
  text:    "#0f172a",
  textSub: "#475569",
  muted:   "#64748b",
  border:  "#e2e8f0",
  slate:   "#f8fafc",
};

const S = {
  inputEl: {
    width: "100%", padding: "11px 14px",
    background: "#f8fafc", border: "1px solid #e2e8f0",
    borderRadius: "8px", color: C.text, fontSize: "14px",
    outline: "none", boxSizing: "border-box",
    fontFamily: "inherit", transition: "border-color 0.15s, box-shadow 0.15s",
  },
  label: {
    display: "block", color: "#334155", fontSize: "12px",
    fontWeight: "700", marginBottom: "6px", letterSpacing: "0.06em",
  },
  card: {
    background: "#ffffff", borderRadius: "12px",
    border: "1px solid #e2e8f0",
    boxShadow: "0 1px 4px rgba(0,0,0,0.06), 0 4px 20px rgba(0,0,0,0.04)",
    overflow: "hidden",
  },
  btn: {
    width: "100%", padding: "13px 20px",
    background: `linear-gradient(135deg, #1a56db, #0891b2)`,
    border: "none", borderRadius: "8px", color: "#fff",
    fontWeight: "700", fontSize: "14px", cursor: "pointer",
    fontFamily: "inherit", boxShadow: "0 2px 8px rgba(26,86,219,0.3)",
  },
  btnOutline: {
    width: "100%", padding: "11px 20px",
    background: "transparent", border: "1px solid #e2e8f0",
    borderRadius: "8px", color: C.textSub,
    fontWeight: "600", fontSize: "13px", cursor: "pointer",
    fontFamily: "inherit",
  },
};

const focus = (e) => { e.target.style.borderColor = C.blue; e.target.style.boxShadow = "0 0 0 3px rgba(26,86,219,0.08)"; };
const blur  = (e) => { e.target.style.borderColor = "#e2e8f0"; e.target.style.boxShadow = "none"; };

const Field = ({ label, children }) => (
  <div style={{ marginBottom: "16px" }}>
    <label style={S.label}>{label}</label>
    {children}
  </div>
);

// ── SUBMIT FORM — defined OUTSIDE App ──────────────────────
function SubmitView({ formData, setFormData, onSubmit, onEmailSearch, onViewDetails, searchEmail, setSearchEmail, searchRefId, setSearchRefId, loading, error }) {

  const handleField = (name) => (e) => {
    const { type, checked, value } = e.target;
    if (name === "isOutsider") {
      setFormData(p => ({ ...p, isOutsider: checked, department: checked ? "" : p.department }));
    } else {
      setFormData(p => ({ ...p, [name]: value }));
    }
  };

  const handlePhoto = (e) => {
    const f = e.target.files[0];
    if (f) setFormData(p => ({ ...p, photo: f, photoPreview: URL.createObjectURL(f) }));
  };

  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "32px 24px", display: "grid", gridTemplateColumns: "1fr 300px", gap: "24px", alignItems: "start" }}>

      {/* Main Form */}
      <div style={S.card}>
        <div style={{ padding: "22px 28px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: "14px" }}>
          <div style={{ width: "40px", height: "40px", background: "linear-gradient(135deg,#1a56db,#0891b2)", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", flexShrink: 0 }}>🔍</div>
          <div>
            <h2 style={{ margin: 0, fontSize: "17px", fontWeight: "800", color: C.text }}>Report a Missing Person</h2>
            <p style={{ margin: 0, color: C.muted, fontSize: "13px" }}>Provide accurate information to speed up the search</p>
          </div>
        </div>

        <form onSubmit={onSubmit} style={{ padding: "24px 28px" }}>
          {/* Photo */}
          <Field label="PHOTOGRAPH *">
            <input type="file" accept="image/*" onChange={handlePhoto} required id="photo-up" style={{ display: "none" }} />
            <label htmlFor="photo-up" style={{ display: "flex", alignItems: "center", gap: "16px", padding: "14px 18px", border: "2px dashed #cbd5e1", borderRadius: "10px", cursor: "pointer", background: "#f8fafc" }}>
              <div style={{ width: "64px", height: "64px", borderRadius: "10px", overflow: "hidden", background: "#e2e8f0", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {formData.photoPreview
                  ? <img src={formData.photoPreview} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="preview" />
                  : <span style={{ fontSize: "24px" }}>📷</span>}
              </div>
              <div>
                <p style={{ margin: "0 0 2px", color: formData.photo ? C.text : C.blue, fontWeight: "600", fontSize: "14px" }}>
                  {formData.photo ? formData.photo.name : "Click to upload photo"}
                </p>
                <p style={{ margin: 0, color: C.muted, fontSize: "12px" }}>PNG, JPG up to 10MB</p>
              </div>
            </label>
          </Field>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <Field label="FULL NAME *">
              <input
                type="text" value={formData.name} onChange={handleField("name")}
                required placeholder="Enter full name" style={S.inputEl}
                onFocus={focus} onBlur={blur}
              />
            </Field>
            <Field label={`DEPARTMENT${formData.isOutsider ? " (N/A)" : " *"}`}>
              <select
                value={formData.department} onChange={handleField("department")}
                required={!formData.isOutsider} disabled={formData.isOutsider}
                style={{ ...S.inputEl, opacity: formData.isOutsider ? 0.5 : 1, cursor: formData.isOutsider ? "not-allowed" : "pointer" }}
                onFocus={focus} onBlur={blur}>
                <option value="">Select department</option>
                {["Computer Science","Information Technology","Electronics","Mechanical","Civil","Electrical","MBA","MCA"].map(d =>
                  <option key={d} value={d}>{d}</option>)}
              </select>
            </Field>
          </div>

          <Field label="DRESS DESCRIPTION *">
            <textarea
              value={formData.dressCode} onChange={handleField("dressCode")}
              required rows={3}
              placeholder="e.g. Blue shirt, black jeans, white sneakers, red backpack..."
              style={{ ...S.inputEl, resize: "vertical" }}
              onFocus={focus} onBlur={blur}
            />
          </Field>

          <Field label="LAST SEEN LOCATION *">
            <input
              type="text" value={formData.lastSeenLocation} onChange={handleField("lastSeenLocation")}
              required placeholder="e.g. Main Building, Library, Cafeteria..."
              style={S.inputEl} onFocus={focus} onBlur={blur}
            />
          </Field>

          <Field label="YOUR EMAIL ADDRESS *">
            <input
              type="email" value={formData.submitterEmail} onChange={handleField("submitterEmail")}
              required placeholder="your.email@gmail.com"
              style={S.inputEl} onFocus={focus} onBlur={blur}
            />
          </Field>

          {/* Outsider toggle */}
          <div
            style={{ display: "flex", alignItems: "center", gap: "12px", padding: "13px 16px", background: "#f8fafc", borderRadius: "8px", marginBottom: "20px", border: "1px solid #e2e8f0", cursor: "pointer" }}
            onClick={() => setFormData(p => ({ ...p, isOutsider: !p.isOutsider, department: !p.isOutsider ? "" : p.department }))}>
            <div style={{
              width: "18px", height: "18px", borderRadius: "4px",
              border: `2px solid ${formData.isOutsider ? C.blue : "#cbd5e1"}`,
              background: formData.isOutsider ? C.blue : "#fff",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              {formData.isOutsider && <span style={{ color: "#fff", fontSize: "11px" }}>✓</span>}
            </div>
            <div>
              <p style={{ margin: 0, color: C.text, fontSize: "13px", fontWeight: "600" }}>Person is not affiliated with this institution</p>
              <p style={{ margin: 0, color: C.muted, fontSize: "12px" }}>Outsider — department not required</p>
            </div>
          </div>

          {error && (
            <div style={{ padding: "11px 16px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", color: "#dc2626", fontSize: "13px", marginBottom: "16px" }}>
              ⚠️ {error}
            </div>
          )}

          <button type="submit" disabled={loading} style={{ ...S.btn, opacity: loading ? 0.7 : 1 }}>
            {loading ? "⏳ Submitting Report..." : "Submit Missing Person Report →"}
          </button>
        </form>
      </div>

      {/* Sidebar */}
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

        {/* Find by email */}
        <div style={S.card}>
          <div style={{ padding: "14px 20px", borderBottom: "1px solid #f1f5f9", background: "#fafbfc" }}>
            <h3 style={{ margin: 0, fontSize: "13px", fontWeight: "700", color: C.text }}>📧 Find Your Reports</h3>
            <p style={{ margin: "2px 0 0", color: C.muted, fontSize: "12px" }}>Retrieve Reference IDs by email</p>
          </div>
          <form onSubmit={onEmailSearch} style={{ padding: "16px 20px" }}>
            <Field label="EMAIL ADDRESS">
              <input type="email" value={searchEmail} onChange={e => setSearchEmail(e.target.value)}
                required placeholder="your.email@institution.edu"
                style={S.inputEl} onFocus={focus} onBlur={blur} />
            </Field>
            <button type="submit" disabled={loading} style={S.btnOutline}>
              {loading ? "Searching..." : "Get Reference IDs"}
            </button>
          </form>
        </div>

        {/* Track by ref ID */}
        <div style={S.card}>
          <div style={{ padding: "14px 20px", borderBottom: "1px solid #f1f5f9", background: "#fafbfc" }}>
            <h3 style={{ margin: 0, fontSize: "13px", fontWeight: "700", color: C.text }}>🔎 Track Report Status</h3>
            <p style={{ margin: "2px 0 0", color: C.muted, fontSize: "12px" }}>View details by Reference ID</p>
          </div>
          <form onSubmit={onViewDetails} style={{ padding: "16px 20px" }}>
            <Field label="REFERENCE ID">
              <input value={searchRefId} onChange={e => setSearchRefId(e.target.value)}
                required placeholder="Paste your Reference ID"
                style={{ ...S.inputEl, fontFamily: "monospace", fontSize: "13px" }}
                onFocus={focus} onBlur={blur} />
            </Field>
            <button type="submit" disabled={loading} style={S.btn}>
              {loading ? "Loading..." : "View Details"}
            </button>
          </form>
        </div>

        {/* How it works */}
        <div style={S.card}>
          <div style={{ padding: "14px 20px", borderBottom: "1px solid #f1f5f9", background: "#fafbfc" }}>
            <h3 style={{ margin: 0, fontSize: "13px", fontWeight: "700", color: C.text }}>ℹ️ How It Works</h3>
          </div>
          <div style={{ padding: "14px 20px" }}>
            {[
              ["1", "Submit a report with a clear photo"],
              ["2", "Receive a unique Reference ID by entering the email you used to submit the report (keep this ID safe)"],
              ["3", "AI scans CCTV footage automatically"],
              ["4", "Get notified when person is located"],
            ].map(([n, txt]) => (
              <div key={n} style={{ display: "flex", gap: "12px", alignItems: "flex-start", marginBottom: "10px" }}>
                <div style={{ width: "22px", height: "22px", borderRadius: "50%", background: "linear-gradient(135deg,#1a56db,#0891b2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ color: "#fff", fontSize: "11px", fontWeight: "800" }}>{n}</span>
                </div>
                <p style={{ margin: 0, color: C.textSub, fontSize: "12.5px", paddingTop: "3px" }}>{txt}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Emergency */}
        <div style={{ background: "#fff5f5", borderRadius: "12px", border: "1px solid #fecaca", overflow: "hidden" }}>
          <div style={{ padding: "10px 20px", background: "#b91c1c", display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "13px" }}>🚨</span>
            <h3 style={{ margin: 0, fontSize: "12px", fontWeight: "700", color: "#fff", letterSpacing: "0.05em" }}>EMERGENCY CONTACTS</h3>
          </div>
          <div style={{ padding: "12px 20px" }}>
            {[["Campus Security", "+91 9876543210"], ["Police Helpline", "100"], ["Admin Office", "+91 9876543211"]].map(([label, num]) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", marginBottom: "7px" }}>
                <span style={{ color: "#64748b", fontSize: "12px" }}>{label}</span>
                <span style={{ color: "#b91c1c", fontWeight: "700", fontSize: "13px", fontFamily: "monospace" }}>{num}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── DETAILS VIEW — defined OUTSIDE App ─────────────────────
function DetailsView({ submittedData, statusData, onCheckStatus, onBack, loading }) {
  if (!submittedData) return null;
  const d = submittedData;
  const refId = d.reference_id || d.id || "N/A";
  const photo = d.photo;

  return (
    <div style={{ maxWidth: "700px", margin: "0 auto", padding: "32px 24px" }}>
      <div style={S.card}>
        <div style={{ padding: "22px 28px", background: "linear-gradient(135deg,#059669,#0891b2)", display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{ width: "44px", height: "44px", background: "rgba(255,255,255,0.2)", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px" }}>✅</div>
          <div>
            <h2 style={{ margin: 0, fontSize: "18px", fontWeight: "800", color: "#fff" }}>Report Submitted Successfully</h2>
            <p style={{ margin: "3px 0 0", color: "rgba(255,255,255,0.8)", fontSize: "13px" }}>Your case is now under active processing</p>
          </div>
        </div>

        <div style={{ padding: "24px 28px" }}>
          {/* Reference ID */}
          <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "10px", padding: "16px 20px", marginBottom: "22px" }}>
            <p style={{ margin: "0 0 4px", color: C.blue, fontSize: "11px", fontWeight: "700", letterSpacing: "0.08em" }}>YOUR REFERENCE ID</p>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
              <p style={{ margin: 0, fontFamily: "monospace", fontSize: "15px", fontWeight: "800", color: C.text, wordBreak: "break-all" }}>{String(refId)}</p>
              <button
                onClick={() => { navigator.clipboard.writeText(String(refId)); alert("Reference ID copied!"); }}
                style={{ padding: "7px 14px", background: C.blue, border: "none", borderRadius: "6px", color: "#fff", cursor: "pointer", fontWeight: "600", fontSize: "12px", whiteSpace: "nowrap", fontFamily: "inherit" }}>
                Copy
              </button>
            </div>
            <p style={{ margin: "8px 0 0", color: C.muted, fontSize: "12px" }}>⚠️ Save this ID to check detection status later</p>
          </div>

          {photo && (
            <div style={{ marginBottom: "20px" }}>
              <p style={S.label}>UPLOADED PHOTO</p>
              <img src={photo.startsWith("http") ? photo : `http://localhost:8000${photo}`}
                alt={d.name} style={{ width: "100%", maxHeight: "200px", objectFit: "contain", borderRadius: "10px", background: "#f1f5f9", border: "1px solid #e2e8f0" }} />
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "22px" }}>
            {[
              ["NAME",         d.name,                                  false],
              ["DEPARTMENT",   d.department || "Outsider",              false],
              ["CASE STATUS",  d.status || "Processing",                false],
              ["PERSON TYPE",  d.is_outsider ? "Outsider" : "Student",  false],
              ["LAST SEEN",    d.last_seen_location,                    true],
              ["DRESS CODE",   d.dress_code,                            true],
              ["EMAIL",        d.email || d.submitter_email,            true],
              ["SUBMITTED AT", (d.created_at || d.submitted_at) ? new Date(d.created_at || d.submitted_at).toLocaleString() : "Just now", true],
            ].map(([label, value, full]) => value ? (
              <div key={label} style={{ gridColumn: full ? "1/-1" : "auto", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "10px 14px" }}>
                <p style={{ margin: "0 0 2px", color: "#94a3b8", fontSize: "10px", fontWeight: "700", letterSpacing: "0.08em" }}>{label}</p>
                <p style={{ margin: 0, color: C.text, fontSize: "13px", fontWeight: "500" }}>{value}</p>
              </div>
            ) : null)}
          </div>

          <button onClick={onCheckStatus} disabled={loading} style={{ ...S.btn, marginBottom: "10px", opacity: loading ? 0.7 : 1 }}>
            {loading ? "⏳ Checking..." : "📡 Check Detection Status"}
          </button>

          {statusData && (
            <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "10px", padding: "16px 20px", marginBottom: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                <h3 style={{ margin: 0, fontSize: "14px", fontWeight: "700", color: C.text }}>Detection Results</h3>
                <span style={{ padding: "3px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "700", background: statusData.status === "found" ? "#dcfce7" : "#dbeafe", color: statusData.status === "found" ? "#15803d" : C.blue }}>{statusData.status}</span>
              </div>
              {statusData.message && <p style={{ margin: "0 0 10px", color: C.textSub, fontSize: "13px" }}>{statusData.message}</p>}
              {statusData.detected_locations?.map((loc, i) => (
                <div key={i} style={{ background: "#fff", border: "1px solid #bbf7d0", borderRadius: "8px", padding: "10px 14px", marginBottom: "6px" }}>
                  <p style={{ margin: "0 0 2px", color: "#15803d", fontWeight: "700", fontSize: "13px" }}>📍 {loc.location}</p>
                  <p style={{ margin: "0 0 2px", color: C.muted, fontSize: "12px" }}>🕒 {new Date(loc.timestamp).toLocaleString()}</p>
                  <p style={{ margin: 0, color: C.muted, fontSize: "12px" }}>Confidence: {(loc.confidence * 100).toFixed(1)}%</p>
                </div>
              ))}
            </div>
          )}

          <button onClick={onBack} style={S.btnOutline}>← Submit Another Report</button>
        </div>
      </div>
    </div>
  );
}

// ── MAIN APP ───────────────────────────────────────────────
export default function App() {
  const [view, setView]           = useState("submit");
  const [formData, setFormData]   = useState({ name: "", dressCode: "", department: "", isOutsider: false, lastSeenLocation: "", submitterEmail: "", photo: null, photoPreview: null });
  const [searchEmail, setSearchEmail] = useState("");
  const [searchRefId, setSearchRefId] = useState("");
  const [submittedData, setSubmittedData] = useState(null);
  const [statusData, setStatusData]       = useState(null);
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true); setError("");
    const fd = new FormData();
    fd.append("name",             formData.name);
    fd.append("dressCode",        formData.dressCode);
    fd.append("department",       formData.department);
    fd.append("isOutsider",       formData.isOutsider ? "true" : "false");
    fd.append("lastSeenLocation", formData.lastSeenLocation);
    fd.append("submitterEmail",   formData.submitterEmail);
    if (formData.photo) fd.append("photo", formData.photo);
    try {
      const res = await fetch(`${API}/submit-missing-person/`, { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok) { setSubmittedData(data); setStatusData(null); setView("details"); }
      else setError(data.error || "Submission failed.");
    } catch { setError("Cannot connect to server. Is the backend running?"); }
    finally { setLoading(false); }
  };

  const handleEmailSearch = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      const res = await fetch(`${API}/get-reference-by-email/${encodeURIComponent(searchEmail)}/`);
      const data = await res.json();
      if (res.ok && data.references?.length > 0) alert(`Your Reference IDs:\n\n${data.references.join("\n")}`);
      else alert("No submissions found for this email.");
    } catch { alert("Cannot connect to backend."); }
    finally { setLoading(false); }
  };

  const handleViewDetails = async (e) => {
    e.preventDefault();
    if (!searchRefId.trim()) { alert("Please enter a Reference ID"); return; }
    setLoading(true); setError("");
    try {
      let res = await fetch(`${API}/reports/${encodeURIComponent(searchRefId.trim())}/`);
      if (!res.ok) res = await fetch(`${API}/check-status/${encodeURIComponent(searchRefId.trim())}/`);
      const data = await res.json();
      if (res.ok) { setSubmittedData(data); setStatusData(null); setView("details"); }
      else setError("Reference ID not found.");
    } catch { setError("Cannot connect to backend."); }
    finally { setLoading(false); }
  };

  const handleCheckStatus = async () => {
    const refId = submittedData?.reference_id || searchRefId;
    if (!refId) return; setLoading(true);
    try {
      const res = await fetch(`${API}/check-status/${encodeURIComponent(refId)}/`);
      const data = await res.json();
      if (res.ok) setStatusData(data); else alert("Could not fetch status.");
    } catch { alert("Cannot connect to backend."); }
    finally { setLoading(false); }
  };

  const resetToSubmit = () => { setView("submit"); setSubmittedData(null); setStatusData(null); setError(""); };

  return (
    <div style={{ minHeight: "100vh", background: "#f1f5f9", fontFamily: "'Segoe UI', system-ui, sans-serif" }}>

      {/* Alert bar */}
      <div style={{ background: C.navyMid, padding: "7px 24px", textAlign: "center" }}>
        <p style={{ margin: 0, color: "rgba(255,255,255,0.75)", fontSize: "12px" }}>
          Emergency? Call <strong style={{ color: "#fbbf24" }}>Campus Security: +91 9400895289</strong> or <strong style={{ color: "#fbbf24" }}>Police: 100</strong>
        </p>
      </div>

      {/* Header */}
      <header style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 24px", height: "62px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ width: "38px", height: "38px", background: "linear-gradient(135deg,#1a56db,#0891b2)", borderRadius: "9px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px" }}>🔍</div>
            <div>
              <h1 style={{ margin: 0, fontSize: "17px", fontWeight: "800", color: C.navy }}>ResQ</h1>
              <p style={{ margin: 0, fontSize: "11px", color: C.muted }}>Student Safety Network</p>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <div style={{ width: "7px", height: "7px", background: "#22c55e", borderRadius: "50%" }}></div>
              <span style={{ color: C.muted, fontSize: "12px" }}>System Online</span>
            </div>
            <button onClick={resetToSubmit} style={{ padding: "8px 18px", background: "linear-gradient(135deg,#1a56db,#0891b2)", border: "none", borderRadius: "8px", color: "#fff", fontWeight: "700", cursor: "pointer", fontSize: "13px", fontFamily: "inherit" }}>
              + New Report
            </button>
          </div>
        </div>
      </header>

      {/* Breadcrumb */}
      <div style={{ background: "#fff", borderBottom: "1px solid #f1f5f9" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "10px 24px", display: "flex", gap: "6px", alignItems: "center" }}>
          <span style={{ color: C.muted, fontSize: "12px" }}>Home</span>
          <span style={{ color: "#cbd5e1" }}>›</span>
          <span style={{ color: C.blue, fontSize: "12px", fontWeight: "600" }}>{view === "submit" ? "Submit Report" : "Report Details"}</span>
        </div>
      </div>

      {/* Content */}
      {view === "submit" && (
        <SubmitView
          formData={formData} setFormData={setFormData}
          onSubmit={handleSubmit}
          onEmailSearch={handleEmailSearch}
          onViewDetails={handleViewDetails}
          searchEmail={searchEmail} setSearchEmail={setSearchEmail}
          searchRefId={searchRefId} setSearchRefId={setSearchRefId}
          loading={loading} error={error}
        />
      )}
      {view === "details" && (
        <DetailsView
          submittedData={submittedData} statusData={statusData}
          onCheckStatus={handleCheckStatus}
          onBack={resetToSubmit}
          loading={loading}
        />
      )}

      {/* Footer */}
      <footer style={{ background: C.navy, marginTop: "48px" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "36px 24px", display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr", gap: "40px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
              <div style={{ width: "28px", height: "28px", background: "linear-gradient(135deg,#1a56db,#0891b2)", borderRadius: "7px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px" }}>🔍</div>
              <span style={{ color: "#fff", fontWeight: "800" }}>ResQ</span>
            </div>
            <p style={{ margin: 0, color: "#475569", fontSize: "12.5px", lineHeight: "1.7" }}>AI-powered missing person tracking for campus safety.</p>
          </div>
          <div>
            <h4 style={{ margin: "0 0 10px", color: "#64748b", fontSize: "11px", fontWeight: "700", letterSpacing: "0.08em" }}>PLATFORM</h4>
            {["Submit Report","Track by Email","View Status","How It Works"].map(l => <p key={l} style={{ margin: "0 0 7px", color: "#475569", fontSize: "13px" }}>{l}</p>)}
          </div>
          <div>
            <h4 style={{ margin: "0 0 10px", color: "#64748b", fontSize: "11px", fontWeight: "700", letterSpacing: "0.08em" }}>EMERGENCY</h4>
            {[["Campus Security","+91 9876543210"],["Police","100"],["Admin","+91 9876543211"]].map(([l,n]) =>
              <p key={l} style={{ margin: "0 0 7px", color: "#475569", fontSize: "13px" }}>{l}: <strong style={{ color: "#94a3b8" }}>{n}</strong></p>)}
          </div>
        </div>
        <div style={{ borderTop: "1px solid #1e293b", padding: "14px 24px", textAlign: "center" }}>
          <p style={{ margin: 0, color: "#334155", fontSize: "12px" }}>© 2026 MissingLink — Student Safety Network. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}