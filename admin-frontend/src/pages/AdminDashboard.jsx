import { useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";

const NAV = [
  { to: "/admin/dashboard",  icon: "📊", label: "Dashboard"    },
  { to: "/admin/detections", icon: "🔍", label: "Reports"      },
  { to: "/admin/map",        icon: "🗺️",  label: "Detection Map"},
  { to: "/admin/upload-cctv",icon: "📹", label: "Upload CCTV"  },
];

const sidebarStyle = {
  width: "240px",
  minHeight: "100vh",
  background: "linear-gradient(180deg, #0f172a 0%, #1e293b 100%)",
  borderRight: "1px solid rgba(255,255,255,0.07)",
  display: "flex",
  flexDirection: "column",
  fontFamily: "'Segoe UI', sans-serif",
  flexShrink: 0
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const adminUser = localStorage.getItem("adminUser") || "Admin";

  const handleLogout = () => {
    localStorage.removeItem("admin");
    localStorage.removeItem("adminUser");
    navigate("/admin/login");
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#0f172a" }}>
      {/* Sidebar */}
      <aside style={sidebarStyle}>
        {/* Logo */}
        <div style={{ padding: "28px 20px 20px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{
              width: "40px", height: "40px",
              background: "linear-gradient(135deg, #3b82f6, #06b6d4)",
              borderRadius: "10px",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "20px", flexShrink: 0
            }}>🔍</div>
            <div>
              <p style={{ color: "#fff", fontWeight: "700", fontSize: "15px", margin: 0 }}>MissingLink</p>
              <p style={{ color: "#64748b", fontSize: "11px", margin: 0 }}>Admin Panel</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "16px 12px" }}>
          {NAV.map(({ to, icon, label }) => (
            <NavLink
              key={to}
              to={to}
              style={({ isActive }) => ({
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "12px 14px",
                borderRadius: "10px",
                marginBottom: "4px",
                textDecoration: "none",
                color: isActive ? "#fff" : "rgba(255,255,255,0.5)",
                background: isActive ? "linear-gradient(135deg,rgba(59,130,246,0.3),rgba(6,182,212,0.2))" : "transparent",
                border: isActive ? "1px solid rgba(59,130,246,0.3)" : "1px solid transparent",
                fontWeight: isActive ? "600" : "400",
                fontSize: "14px",
                transition: "all 0.15s"
              })}
            >
              <span style={{ fontSize: "18px" }}>{icon}</span>
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User + Logout */}
        <div style={{ padding: "16px 12px 24px", borderTop: "1px solid rgba(255,255,255,0.07)" }}>
          <div style={{
            display: "flex", alignItems: "center", gap: "10px",
            padding: "10px 14px", marginBottom: "8px"
          }}>
            <div style={{
              width: "32px", height: "32px",
              background: "linear-gradient(135deg,#3b82f6,#06b6d4)",
              borderRadius: "50%",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#fff", fontWeight: "700", fontSize: "13px"
            }}>
              {adminUser[0].toUpperCase()}
            </div>
            <div>
              <p style={{ color: "#fff", fontSize: "13px", fontWeight: "600", margin: 0 }}>{adminUser}</p>
              <p style={{ color: "#64748b", fontSize: "11px", margin: 0 }}>Administrator</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            style={{
              width: "100%", padding: "10px 14px",
              background: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.25)",
              borderRadius: "10px",
              color: "#f87171", fontSize: "13px", fontWeight: "600",
              cursor: "pointer", textAlign: "left",
              display: "flex", alignItems: "center", gap: "8px"
            }}
          >
            🚪 Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, overflow: "auto" }}>
        <Outlet />
      </main>
    </div>
  );
}