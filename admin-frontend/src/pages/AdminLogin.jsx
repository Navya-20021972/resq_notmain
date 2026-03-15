import { useState } from "react";
import axios from "axios";

export default function AdminLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await axios.post(
        "http://localhost:8000/api/admin/login/",
        { username, password },
        { headers: { "Content-Type": "application/json" } }
      );

      if (response.data.success) {
        localStorage.setItem("admin", "true");
        localStorage.setItem("adminUser", response.data.username);
        window.location.href = "/admin/dashboard";
      } else {
        setError("Invalid admin credentials");
      }
    } catch (err) {
      if (err.response?.status === 401) {
        setError("Invalid admin credentials");
      } else {
        setError("Cannot connect to server. Is backend running?");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center",
      justifyContent: "center", background: "#f8f9fa"
    }}>
      <div style={{
        background: "white", padding: "40px", borderRadius: "8px",
        boxShadow: "0 2px 10px rgba(0,0,0,0.1)", width: "350px"
      }}>
        <h2 style={{ marginBottom: "24px", textAlign: "center" }}>Admin Login</h2>

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", marginBottom: "6px", fontWeight: "bold" }}>
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              style={{
                width: "100%", padding: "10px", border: "1px solid #ddd",
                borderRadius: "4px", fontSize: "14px", boxSizing: "border-box"
              }}
              placeholder="Enter username"
            />
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", marginBottom: "6px", fontWeight: "bold" }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: "100%", padding: "10px", border: "1px solid #ddd",
                borderRadius: "4px", fontSize: "14px", boxSizing: "border-box"
              }}
              placeholder="Enter password"
            />
          </div>

          {error && (
            <p style={{ color: "red", marginBottom: "16px", textAlign: "center" }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%", padding: "12px", background: loading ? "#6c757d" : "#007bff",
              color: "white", border: "none", borderRadius: "4px",
              fontSize: "16px", cursor: loading ? "not-allowed" : "pointer", fontWeight: "bold"
            }}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}