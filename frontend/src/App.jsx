import { useState } from "react";
import { CAMPUS_LOCATIONS } from "./config/locations";

const API = "http://localhost:8000/api";

// Add placeholder styling for dark theme
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.innerHTML = `
    input::placeholder, textarea::placeholder, select > option:not([value]) {
      color: #64748b !important;
    }
    input, textarea, select {
      color-scheme: dark;
    }
    select > option {
      background-color: #1e293b;
      color: #e0e7ff;
    }
  `;
  document.head.appendChild(style);
}

// ── Design tokens ──────────────────────────────────────────
const C = {
  navy:    "#0a1628",
  navyMid: "#0f2040",
  blue:    "#1a56db",
  teal:    "#0891b2",
  text:    "#ffffff",
  textSub: "#cbd5e1",
  muted:   "#94a3b8",
  border:  "rgba(26,86,219,0.2)",
  slate:   "#1e293b",
};

const S = {
  inputEl: {
    width: "100%", padding: "12px 16px",
    background: "rgba(30, 41, 59, 0.7)", border: "1px solid rgba(26,86,219,0.2)",
    borderRadius: "8px", color: "#ffffff", fontSize: "14px",
    outline: "none", boxSizing: "border-box",
    fontFamily: "inherit", transition: "border-color 0.15s, box-shadow 0.15s, background 0.15s",
  },
  label: {
    display: "block", color: "#e0e7ff", fontSize: "12px",
    fontWeight: "700", marginBottom: "8px", letterSpacing: "0.08em",
  },
  card: {
    background: "rgba(15, 32, 64, 0.8)", borderRadius: "12px",
    border: "1px solid rgba(26,86,219,0.2)",
    backdropFilter: "blur(10px)",
    boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
    overflow: "hidden",
  },
  btn: {
    width: "100%", padding: "14px 24px",
    background: `linear-gradient(135deg, #ff6464, #ff8a80)`,
    border: "none", borderRadius: "8px", color: "#fff",
    fontWeight: "700", fontSize: "14px", cursor: "pointer",
    fontFamily: "inherit", boxShadow: "0 8px 24px rgba(255,100,100,0.3)", transition: "all 0.2s",
  },
  btnOutline: {
    width: "100%", padding: "12px 20px",
    background: "transparent", border: "1.5px solid rgba(26,86,219,0.5)",
    borderRadius: "8px", color: "#e0e7ff",
    fontWeight: "600", fontSize: "13px", cursor: "pointer",
    fontFamily: "inherit", transition: "all 0.2s",
  },
};

const focus = (e) => { e.target.style.borderColor = "rgba(26,86,219,0.6)"; e.target.style.background = "rgba(30, 41, 59, 0.9)"; e.target.style.boxShadow = "0 0 0 3px rgba(26,86,219,0.15)"; };
const blur  = (e) => { e.target.style.borderColor = "rgba(26,86,219,0.2)"; e.target.style.background = "rgba(30, 41, 59, 0.7)"; e.target.style.boxShadow = "none"; };

const Field = ({ label, children }) => (
  <div style={{ marginBottom: "16px" }}>
    <label style={S.label}>{label}</label>
    {children}
  </div>
);

// ── HOME VIEW ────────────────────────────────────────────
function HomeView({ onFileReport }) {
  return (
    <div style={{ minHeight: "100vh", background: "#0a1628", position: "relative" }}>
      {/* Animated background elements */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, bottom: 0, pointerEvents: "none", zIndex: 0
      }}></div>

      {/* Hero Section */}
      <div style={{
        minHeight: "600px", display: "flex", alignItems: "center", justifyContent: "center",
        textAlign: "center", padding: "40px 20px", position: "relative", backgroundSize: "cover",
        backgroundPosition: "center", backgroundAttachment: "fixed",
        backgroundImage: "url('/hero-bg.png')", zIndex: 2
      }}>
        {/* Dark Overlay with Blur */}
        <div style={{
          position: "absolute", inset: 0, background: "rgba(0, 0, 0, 0.7)",
          backdropFilter: "blur(3px)", zIndex: 1
        }}></div>

        {/* Content */}
        <div style={{ maxWidth: "900px", zIndex: 2, position: "relative" }}>
          <div style={{ marginBottom: "32px" }}>
            <h2 style={{ fontSize: "68px", fontWeight: "900", color: "#ffffff", margin: "0 0 24px", lineHeight: "1.1", letterSpacing: "-1px" }}>
              Report Missing.<br/>AI Detects Instantly.<br/><span style={{ background: "linear-gradient(135deg, #ff6464, #ff8a80)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Reunite Lives.</span>
            </h2>
            <p style={{ fontSize: "18px", color: "rgba(255,255,255,0.8)", margin: "0", lineHeight: "1.7", maxWidth: "700px", fontWeight: "500" }}>
              File a report. Our AI scans every CCTV camera on campus in real-time. Get instant alerts when matches are found. Because when someone goes missing, every second counts.
            </p>
          </div>
          <button
            onClick={onFileReport}
            style={{
              padding: "14px 36px", background: "#ef4444", border: "none",
              borderRadius: "8px", color: "#ffffff", fontWeight: "700", fontSize: "16px", cursor: "pointer",
              fontFamily: "inherit", boxShadow: "0 10px 25px rgba(239,68,68,0.3)", transition: "all 0.3s ease"
            }}
            onMouseOver={(e) => { e.target.style.background = "#dc2626"; e.target.style.transform = "translateY(-3px)"; e.target.style.boxShadow = "0 15px 35px rgba(239,68,68,0.4)"; }}
            onMouseOut={(e) => { e.target.style.background = "#ef4444"; e.target.style.transform = "translateY(0)"; e.target.style.boxShadow = "0 10px 25px rgba(239,68,68,0.3)"; }}
          >
            File a Missing Person Report
          </button>
        </div>
      </div>

      {/* How ResQ Works Section */}
      <div style={{ background: "linear-gradient(180deg, rgba(15,32,64,0.6) 0%, rgba(10,22,40,0.9) 100%)", padding: "80px 24px", textAlign: "center", position: "relative", zIndex: 2, borderTop: "1px solid rgba(26,86,219,0.2)" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <h3 style={{ fontSize: "48px", fontWeight: "900", color: "#ffffff", margin: "0 0 16px" }}>
            Let's Get Your Peace <span style={{ background: "linear-gradient(135deg, #ff6464, #ff8a80)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Of Mind</span> Back
          </h3>
          <p style={{ fontSize: "16px", color: "rgba(255,255,255,0.75)", maxWidth: "800px", margin: "0 auto 60px", lineHeight: "1.8" }}>
            ResQ is an AI-powered campus surveillance system designed to identify and locate missing individuals using advanced face recognition and CCTV analysis. Our intelligent detection pipeline narrows down search areas using geofencing, analyzes camera feeds, and instantly alerts administrators — helping locate missing persons faster and more efficiently.
          </p>

          <h4 style={{ fontSize: "36px", fontWeight: "900", color: "#ffffff", margin: "60px 0 48px" }}>
            3 Easy Steps to Activate ResQ
          </h4>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "32px" }}>
            {[
              { num: "1", title: "File a Report", desc: "Upload the missing person's photo and last seen location.", icon: "📋", color: "#1a56db" },
              { num: "2", title: "AI Scans Campus", desc: "ResQ analyzes CCTV footage within the geofenced zone.", icon: "🤖", color: "#0891b2" },
              { num: "3", title: "Get Real-Time Updates", desc: "Receive alerts if the person is detected anywhere on campus.", icon: "🔔", color: "#ff6464" }
            ].map((step, idx) => (
              <div
                key={idx}
                style={{
                  background: "rgba(255,255,255,0.06)", border: "1px solid rgba(26,173,178,0.3)",
                  borderRadius: "14px", padding: "36px 28px", backdropFilter: "blur(10px)",
                  transition: "all 0.3s"
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = "rgba(26,86,219,0.2)";
                  e.currentTarget.style.borderColor = "rgba(26,86,219,0.6)";
                  e.currentTarget.style.transform = "translateY(-8px)";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                  e.currentTarget.style.borderColor = "rgba(26,173,178,0.3)";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                <div style={{ fontSize: "40px", margin: "0 0 12px" }}>{step.icon}</div>
                <div style={{
                  width: "64px", height: "64px", background: `linear-gradient(135deg, ${step.color}, ${step.color}dd)`,
                  borderRadius: "14px", display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "32px", fontWeight: "900", color: "#ffffff", margin: "0 auto 20px"
                }}>
                  {step.num}
                </div>
                <h5 style={{ fontSize: "18px", fontWeight: "800", color: "#ffffff", margin: "0 0 12px" }}>{step.title}</h5>
                <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.7)", margin: 0, lineHeight: "1.6" }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div style={{ background: "linear-gradient(135deg, rgba(26,86,219,0.2) 0%, rgba(8,145,178,0.2) 100%)", padding: "60px 24px", textAlign: "center", borderTop: "1px solid rgba(26,86,219,0.3)", position: "relative", zIndex: 2 }}>
        <h4 style={{ fontSize: "32px", fontWeight: "900", color: "#ffffff", margin: "0 0 20px" }}>
          Ready to Help Find Someone?
        </h4>
        <p style={{ fontSize: "15px", color: "rgba(255,255,255,0.8)", maxWidth: "600px", margin: "0 auto 28px" }}>
          Every report helps. File a missing person report today and let our AI-powered system assist in the search.
        </p>
        <button
          onClick={onFileReport}
          style={{
            padding: "14px 40px", background: "linear-gradient(135deg, #1a56db, #0891b2)", border: "none",
            borderRadius: "10px", color: "#ffffff", fontWeight: "800", fontSize: "14px", cursor: "pointer",
            fontFamily: "inherit", boxShadow: "0 6px 20px rgba(26,86,219,0.35)", transition: "all 0.25s"
          }}
          onMouseOver={(e) => { e.target.style.transform = "scale(1.05)"; }}
          onMouseOut={(e) => { e.target.style.transform = "scale(1)"; }}
        >
          File Missing Person Report
        </button>
      </div>

      {/* Footer */}
      <footer style={{ background: C.navy, padding: "40px 24px", position: "relative", zIndex: 2, borderTop: "1px solid #1e293b" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto", textAlign: "center", paddingTop: "20px" }}>
          <p style={{ color: "#64748b", fontSize: "13px", margin: 0 }}>ResQ © 2026. AI-powered missing person tracking for campus safety.</p>
        </div>
      </footer>
    </div>
  );
}

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
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0a1628 0%, #0f2040 100%)", fontFamily: "'Segoe UI', system-ui, sans-serif", paddingBottom: "60px", paddingTop: "40px" }}>
      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 24px", display: "grid", gridTemplateColumns: "1fr 320px", gap: "32px", alignItems: "start" }}>

      {/* Main Form */}
      <div style={{ ...S.card, background: "rgba(15, 32, 64, 0.8)", backdropFilter: "blur(10px)", border: "1px solid rgba(26,86,219,0.2)", boxShadow: "0 8px 32px rgba(0,0,0,0.3), 0 0 1px rgba(26,86,219,0.1)" }}>
        <div style={{ background: "linear-gradient(135deg, #ff6464 0%, #ff8a80 100%)", padding: "28px 32px", display: "flex", alignItems: "center", gap: "16px", color: "#ffffff", borderRadius: "12px 12px 0 0" }}>
          <div style={{ width: "48px", height: "48px", background: "rgba(255,255,255,0.2)", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px", flexShrink: 0, boxShadow: "0 4px 12px rgba(0,0,0,0.2)" }}>📝</div>
          <div>
            <h2 style={{ margin: 0, fontSize: "22px", fontWeight: "900", color: "#ffffff" }}>Report Missing Person</h2>
            <p style={{ margin: "4px 0 0", color: "rgba(255,255,255,0.9)", fontSize: "14px" }}>Fast, accurate, and secure reporting</p>
          </div>
        </div>

        <form onSubmit={onSubmit} style={{ padding: "32px 36px" }}>
          {/* Photo */}
          <Field label="PHOTOGRAPH *">
            <input type="file" accept="image/*" onChange={handlePhoto} required id="photo-up" style={{ display: "none" }} />
            <label htmlFor="photo-up" style={{ display: "flex", alignItems: "center", gap: "16px", padding: "16px 20px", border: "2px dashed rgba(26,86,219,0.5)", borderRadius: "10px", cursor: "pointer", background: "rgba(26,86,219,0.05)", transition: "all 0.2s" }} onMouseOver={(e) => { e.currentTarget.style.background = "rgba(26,86,219,0.1)"; e.currentTarget.style.borderColor = "rgba(26,86,219,0.8)"; }} onMouseOut={(e) => { e.currentTarget.style.background = "rgba(26,86,219,0.05)"; e.currentTarget.style.borderColor = "rgba(26,86,219,0.5)"; }}>
              <div style={{ width: "72px", height: "72px", borderRadius: "10px", overflow: "hidden", background: "rgba(26,86,219,0.1)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(26,86,219,0.2)" }}>
                {formData.photoPreview
                  ? <img src={formData.photoPreview} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="preview" />
                  : <span style={{ fontSize: "28px" }}>📷</span>}
              </div>
              <div>
                <p style={{ margin: "0 0 4px", color: "#e0e7ff", fontWeight: "700", fontSize: "14px" }}>
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
            <Field label={formData.isOutsider ? "STUDENT / ADMISSION NO. (N/A)" : "STUDENT / ADMISSION NO. *"}>
              <input
                type="text" value={formData.studentId} onChange={handleField("studentId")}
                required={!formData.isOutsider} disabled={formData.isOutsider}
                placeholder={formData.isOutsider ? "Not applicable" : "e.g. ann, div, nav, ish"}
                style={{ ...S.inputEl, opacity: formData.isOutsider ? 0.5 : 1, cursor: formData.isOutsider ? "not-allowed" : "text" }}
                onFocus={focus} onBlur={blur}
              />
            </Field>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
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
            <select
              value={formData.lastSeenLocation} onChange={handleField("lastSeenLocation")}
              required style={{ ...S.inputEl, cursor: "pointer" }}
              onFocus={focus} onBlur={blur}>
              <option value="">-- Select Campus Location --</option>
              {CAMPUS_LOCATIONS.map(loc =>
                <option key={loc.id} value={loc.name}>{loc.name}</option>)}
            </select>
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
            style={{ display: "flex", alignItems: "center", gap: "12px", padding: "16px 20px", background: "rgba(26,86,219,0.08)", borderRadius: "8px", marginBottom: "24px", border: "1px solid rgba(26,86,219,0.2)", cursor: "pointer", transition: "all 0.2s" }}
            onMouseOver={(e) => { e.currentTarget.style.background = "rgba(26,86,219,0.12)"; }}
            onMouseOut={(e) => { e.currentTarget.style.background = "rgba(26,86,219,0.08)"; }}
            onClick={() => setFormData(p => ({ ...p, isOutsider: !p.isOutsider, department: !p.isOutsider ? "" : p.department }))}>
            <div style={{
              width: "18px", height: "18px", borderRadius: "4px",
              border: `2px solid ${formData.isOutsider ? "#ff6464" : "rgba(26,86,219,0.4)"}`,
              background: formData.isOutsider ? "#ff6464" : "transparent",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.2s",
            }}>
              {formData.isOutsider && <span style={{ color: "#fff", fontSize: "11px", fontWeight: "bold" }}>✓</span>}
            </div>
            <div>
              <p style={{ margin: 0, color: "#e0e7ff", fontSize: "13px", fontWeight: "700" }}>Not affiliated with this institution</p>
              <p style={{ margin: 0, color: C.muted, fontSize: "12px" }}>No department required</p>
            </div>
          </div>

          {error && (
            <div style={{ padding: "14px 18px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.4)", borderRadius: "8px", color: "#fecaca", fontSize: "13px", marginBottom: "20px", fontWeight: "600" }}>
              ⚠️ {error}
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading} 
            style={{ ...S.btn, opacity: loading ? 0.6 : 1 }}
            onMouseOver={(e) => { if (!loading) { e.target.style.transform = "translateY(-3px)"; e.target.style.boxShadow = "0 12px 32px rgba(255,100,100,0.4)"; } }}
            onMouseOut={(e) => { e.target.style.transform = "translateY(0)"; e.target.style.boxShadow = "0 8px 24px rgba(255,100,100,0.3)"; }}
          >
            {loading ? "⏳ Submitting..." : "Submit Report"}
          </button>
        </form>
      </div>

      {/* Sidebar */}
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

        {/* Find by email */}
        <div style={{ ...S.card }}>
          <div style={{ padding: "18px 24px", background: "linear-gradient(135deg, rgba(8,145,178,0.15) 0%, rgba(26,86,219,0.15) 100%)", borderBottom: "1px solid rgba(26,86,219,0.2)" }}>
            <h3 style={{ margin: 0, fontSize: "14px", fontWeight: "800", color: "#e0e7ff" }}>📧 Find Reports</h3>
            <p style={{ margin: "4px 0 0", color: C.muted, fontSize: "12px" }}>By your email</p>
          </div>
          <form onSubmit={onEmailSearch} style={{ padding: "20px 24px" }}>
            <Field label="EMAIL ADDRESS">
              <input type="email" value={searchEmail} onChange={e => setSearchEmail(e.target.value)}
                required placeholder="your.email@institution.edu"
                style={{ ...S.inputEl, color: "#ffffff", "::placeholder": { color: "#64748b" } }}
                onFocus={(e) => { e.target.style.background = "rgba(30, 41, 59, 0.9)"; e.target.style.borderColor = "rgba(26,86,219,0.5)"; }}
                onBlur={(e) => { e.target.style.background = "rgba(30, 41, 59, 0.7)"; e.target.style.borderColor = "rgba(26,86,219,0.2)"; }}
              />
            </Field>
            <button type="submit" disabled={loading} style={{ ...S.btn, background: "linear-gradient(135deg, #0891b2, #06b6d4)" }} onMouseOver={(e) => { e.target.style.transform = "translateY(-2px)"; }} onMouseOut={(e) => { e.target.style.transform = "translateY(0)"; }}>
              {loading ? "Searching..." : "Get IDs"}
            </button>
          </form>
        </div>

        {/* Track by ref ID */}
        <div style={{ ...S.card }}>
          <div style={{ padding: "18px 24px", background: "linear-gradient(135deg, rgba(26,86,219,0.15) 0%, rgba(8,145,178,0.15) 100%)", borderBottom: "1px solid rgba(26,86,219,0.2)" }}>
            <h3 style={{ margin: 0, fontSize: "14px", fontWeight: "800", color: "#e0e7ff" }}>🔎 Track Status</h3>
            <p style={{ margin: "4px 0 0", color: C.muted, fontSize: "12px" }}>By Reference ID</p>
          </div>
          <form onSubmit={onViewDetails} style={{ padding: "20px 24px" }}>
            <Field label="REFERENCE ID">
              <input value={searchRefId} onChange={e => setSearchRefId(e.target.value)}
                required placeholder="Paste Reference ID"
                style={{ ...S.inputEl, fontFamily: "monospace", fontSize: "13px", color: "#ffffff" }}
                onFocus={(e) => { e.target.style.background = "rgba(30, 41, 59, 0.9)"; e.target.style.borderColor = "rgba(26,86,219,0.5)"; }}
                onBlur={(e) => { e.target.style.background = "rgba(30, 41, 59, 0.7)"; e.target.style.borderColor = "rgba(26,86,219,0.2)"; }}
              />
            </Field>
            <button type="submit" disabled={loading} style={S.btn} onMouseOver={(e) => { e.target.style.transform = "translateY(-2px)"; }} onMouseOut={(e) => { e.target.style.transform = "translateY(0)"; }}>
              {loading ? "Loading..." : "View Details"}
            </button>
          </form>
        </div>

        {/* How it works */}
        <div style={{ ...S.card }}>
          <div style={{ padding: "18px 24px", background: "linear-gradient(135deg, rgba(255,100,100,0.15) 0%, rgba(255,138,128,0.15) 100%)", borderBottom: "1px solid rgba(255,100,100,0.2)" }}>
            <h3 style={{ margin: 0, fontSize: "14px", fontWeight: "800", color: "#fecaca" }}>ℹ️ How It Works</h3>
          </div>
          <div style={{ padding: "20px 24px" }}>
            {[
              ["1", "Submit report with photo"],
              ["2", "Get Reference ID via email"],
              ["3", "AI scans campus CCTV"],
              ["4", "Real-time alerts sent"],
            ].map(([n, txt]) => (
              <div key={n} style={{ display: "flex", gap: "12px", alignItems: "flex-start", marginBottom: "12px" }}>
                <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "linear-gradient(135deg, #ff6464, #ff8a80)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 4px 12px rgba(255,100,100,0.3)" }}>
                  <span style={{ color: "#fff", fontSize: "12px", fontWeight: "900" }}>{n}</span>
                </div>
                <p style={{ margin: 0, color: C.textSub, fontSize: "13px", paddingTop: "2px", lineHeight: "1.4" }}>{txt}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Emergency */}
        <div style={{ ...S.card, background: "linear-gradient(135deg, rgba(220,38,38,0.15), rgba(239,68,68,0.1))", border: "1.5px solid rgba(239,68,68,0.4)" }}>
          <div style={{ padding: "14px 20px", background: "rgba(239,68,68,0.2)", display: "flex", alignItems: "center", gap: "10px", borderBottom: "1px solid rgba(239,68,68,0.3)" }}>
            <span style={{ fontSize: "16px" }}>🚨</span>
            <h3 style={{ margin: 0, fontSize: "13px", fontWeight: "800", color: "#fecaca", letterSpacing: "0.08em" }}>EMERGENCY</h3>
          </div>
          <div style={{ padding: "16px 20px" }}>
            {[["Campus Security", "+91 9876543210"], ["Police", "100"], ["Admin", "+91 9876543211"]].map(([label, num]) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                <span style={{ color: C.textSub, fontSize: "13px" }}>{label}</span>
                <span style={{ color: "#ff8a80", fontWeight: "800", fontSize: "13px", fontFamily: "monospace" }}>{num}</span>
              </div>
            ))}
          </div>
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
              ["STUDENT ID",   d.student_id || (d.is_outsider ? "Outsider" : "—"), false],
              ["DEPARTMENT",   d.department || "Outsider",              false],
              ["CASE STATUS",  d.status || "Processing",                false],
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
                <div key={i} style={{ background: "#fff", border: "1px solid #bbf7d0", borderRadius: "8px", padding: "10px 14px", marginBottom: "10px" }}>
                  <p style={{ margin: "0 0 2px", color: "#15803d", fontWeight: "700", fontSize: "13px" }}>📍 {loc.location}</p>
                  <p style={{ margin: "0 0 2px", color: C.muted, fontSize: "12px" }}>🕒 {new Date(loc.timestamp).toLocaleString()}</p>
                  <p style={{ margin: "0 0 8px", color: C.muted, fontSize: "12px" }}>Confidence: {(loc.confidence).toFixed(1)}%</p>
                  {(loc.face_b64 || loc.face_crop || loc.frame_b64 || loc.snapshot) && (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginTop: "12px" }}>
                      {(loc.frame_b64 || loc.snapshot) && (
                        <div>
                          <p style={{ margin: "0 0 4px", color: "#94a3b8", fontSize: "10px", fontWeight: "700", letterSpacing: "0.06em" }}>🎥 CCTV FRAME</p>
                          <img src={loc.frame_b64 || loc.snapshot} alt="CCTV frame" style={{ width: "100%", maxHeight: "150px", objectFit: "contain", borderRadius: "8px", border: "2px solid #22c55e", background: "#f1f5f9" }} />
                        </div>
                      )}
                      {(loc.face_b64 || loc.face_crop) && (
                        <div>
                          <p style={{ margin: "0 0 4px", color: "#94a3b8", fontSize: "10px", fontWeight: "700", letterSpacing: "0.06em" }}>👤 DETECTED FACE</p>
                          <img src={loc.face_b64 || loc.face_crop} alt="Detected face" style={{ width: "100%", maxHeight: "150px", objectFit: "contain", borderRadius: "8px", border: "2px solid #f59e0b", background: "#f1f5f9" }} />
                        </div>
                      )}
                    </div>
                  )}
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
  const [view, setView]           = useState("home");
  const [formData, setFormData]   = useState({ name: "", studentId: "", dressCode: "", department: "", isOutsider: false, lastSeenLocation: "", submitterEmail: "", photo: null, photoPreview: null });
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
    fd.append("studentId",        formData.studentId);
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
      else setError(`Reference ID not found: ${data.error || "Unknown error"}`);
    } catch (err) {
      console.error("Fetch error:", err);
      setError(`Cannot connect to backend: ${err.message}`);
    }
    finally { setLoading(false); }
  };

  const handleCheckStatus = async () => {
    const refId = submittedData?.reference_id || searchRefId;
    if (!refId) return; setLoading(true);
    try {
      const res = await fetch(`${API}/check-status/${encodeURIComponent(refId)}/`);
      const data = await res.json();
      console.log("✅ Status data received:", data);
      console.log("Detected locations:", data.detected_locations);
      if (data.detected_locations?.length > 0) {
        console.log("First detection:", data.detected_locations[0]);
        console.log("Has face_b64?", !!data.detected_locations[0].face_b64);
      }
      if (res.ok) {
        setStatusData(data);
      } else {
        alert(`Error: ${data.error || "Could not fetch status"}`);
      }
    } catch (err) {
      console.error("Fetch error:", err);
      alert(`Cannot connect to backend: ${err.message}`);
    }
    finally { setLoading(false); }
  };

  const resetToSubmit = () => { setView("submit"); setSubmittedData(null); setStatusData(null); setError(""); };
  const goToHome = () => { setView("home"); setSubmittedData(null); setStatusData(null); setError(""); };

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
          <div style={{ display: "flex", alignItems: "center", gap: "12px", cursor: "pointer" }} onClick={goToHome}>
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
      {view !== "home" && (
        <div style={{ background: "#fff", borderBottom: "1px solid #f1f5f9" }}>
          <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "10px 24px", display: "flex", gap: "6px", alignItems: "center" }}>
            <span style={{ color: C.muted, fontSize: "12px", cursor: "pointer" }} onClick={goToHome}>Home</span>
            <span style={{ color: "#cbd5e1" }}>›</span>
            <span style={{ color: C.blue, fontSize: "12px", fontWeight: "600" }}>{view === "submit" ? "Submit Report" : "Report Details"}</span>
          </div>
        </div>
      )}

      {/* Content */}
      {view === "home" && (
        <HomeView onFileReport={() => setView("submit")} />
      )}
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