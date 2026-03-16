// pages/DetectionList.jsx
import { useEffect, useState } from "react";
import axios from "axios";
import { getLocationById, getAllLocations } from '../config/cctvLocations';
import StatusBadge from '../components/StatusBadge';

const API = "http://localhost:8000/api";

export default function DetectionList() {
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');

  useEffect(() => {
    fetchReports();
    const interval = setInterval(fetchReports, 5000); // Auto-refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    applyFilters();
  }, [reports, filter, locationFilter]);

  const fetchReports = async () => {
    try {
      const response = await axios.get(`${API}/admin/get-reports/`);
      setReports(response.data || []);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...reports];

    if (filter !== 'all') {
      filtered = filtered.filter(r => {
        const status = (r.status || '').toLowerCase();
        return status.includes(filter);
      });
    }

    if (locationFilter !== 'all') {
      filtered = filtered.filter(r => {
        const locationId = r.last_seen_location_id || r.lastSeenLocationId;
        return locationId === locationFilter;
      });
    }

    setFilteredReports(filtered);
  };

  const getLocationFromReport = (report) => {
    const locationId = report.last_seen_location_id || report.lastSeenLocationId;
    const location = getLocationById(locationId);
    return location?.name || report.last_seen_location || 'Unknown';
  };

  const stats = {
    total: reports.length,
    pending: reports.filter(r => (r.status || '').toLowerCase().includes('pending')).length,
    processing: reports.filter(r => (r.status || '').toLowerCase().includes('processing')).length,
    found: reports.filter(r => (r.status || '').toLowerCase().includes('found')).length,
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0f172a", padding: "32px", fontFamily: "'Segoe UI', sans-serif", color: "#fff" }}>
      
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ fontSize: "28px", fontWeight: "800", margin: "0 0 4px" }}>📋 Missing Person Reports</h1>
       <p style={{ color: "rgba(255,255,255,0.4)", margin: 0, fontSize: "14px" }}>
          Real-time tracking and management
        </p>
      </div>

      {/* Stats Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "28px" }}>
        <div style={{ padding: "20px", borderRadius: "16px", background: "linear-gradient(135deg, #1d4ed8, #1e40af)", border: "1px solid rgba(29,78,216,0.3)", boxShadow: "0 8px 24px rgba(29,78,216,0.3)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{ fontSize: "32px", background: "rgba(255,255,255,0.2)", borderRadius: "12px", width: "56px", height: "56px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>📋</div>
            <div>
              <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "13px", margin: "0 0 4px", fontWeight: "600" }}>Total Reports</p>
              <p style={{ color: "#fff", fontSize: "32px", fontWeight: "800", margin: 0, lineHeight: 1 }}>{stats.total}</p>
            </div>
          </div>
        </div>

        <div style={{ padding: "20px", borderRadius: "16px", background: "linear-gradient(135deg, #d97706, #b45309)", border: "1px solid rgba(217,119,6,0.3)", boxShadow: "0 8px 24px rgba(217,119,6,0.3)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{ fontSize: "32px", background: "rgba(255,255,255,0.2)", borderRadius: "12px", width: "56px", height: "56px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>⏳</div>
            <div>
              <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "13px", margin: "0 0 4px", fontWeight: "600" }}>Pending</p>
              <p style={{ color: "#fff", fontSize: "32px", fontWeight: "800", margin: 0, lineHeight: 1 }}>{stats.pending}</p>
            </div>
          </div>
        </div>

        <div style={{ padding: "20px", borderRadius: "16px", background: "linear-gradient(135deg, #7c3aed, #6d28d9)", border: "1px solid rgba(124,58,237,0.3)", boxShadow: "0 8px 24px rgba(124,58,237,0.3)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{ fontSize: "32px", background: "rgba(255,255,255,0.2)", borderRadius: "12px", width: "56px", height: "56px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>🔄</div>
            <div>
              <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "13px", margin: "0 0 4px", fontWeight: "600" }}>Processing</p>
              <p style={{ color: "#fff", fontSize: "32px", fontWeight: "800", margin: 0, lineHeight: 1 }}>{stats.processing}</p>
            </div>
          </div>
        </div>

        <div style={{ padding: "20px", borderRadius: "16px", background: "linear-gradient(135deg, #059669, #047857)", border: "1px solid rgba(5,150,105,0.3)", boxShadow: "0 8px 24px rgba(5,150,105,0.3)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{ fontSize: "32px", background: "rgba(255,255,255,0.2)", borderRadius: "12px", width: "56px", height: "56px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>✅</div>
            <div>
              <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "13px", margin: "0 0 4px", fontWeight: "600" }}>Found</p>
              <p style={{ color: "#fff", fontSize: "32px", fontWeight: "800", margin: 0, lineHeight: 1 }}>{stats.found}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: "12px", marginBottom: "24px", flexWrap: "wrap" }}>
        <div>
          <label style={{ display: "block", color: "#93c5fd", fontSize: "12px", fontWeight: "700", marginBottom: "6px" }}>STATUS FILTER</label>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{ padding: "10px 14px", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "8px", color: "#fff", fontSize: "14px", cursor: "pointer", fontFamily: "inherit" }}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="found">Found</option>
          </select>
        </div>

        <div>
          <label style={{ display: "block", color: "#93c5fd", fontSize: "12px", fontWeight: "700", marginBottom: "6px" }}>LOCATION FILTER</label>
          <select
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            style={{ padding: "10px 14px", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "8px", color: "#fff", fontSize: "14px", cursor: "pointer", fontFamily: "inherit" }}
          >
            <option value="all">All Locations</option>
            {getAllLocations().map(loc => (
              <option key={loc.id} value={loc.id}>{loc.name}</option>
            ))}
          </select>
        </div>

        <div style={{ marginLeft: "auto", display: "flex", alignItems: "flex-end" }}>
          <button
            onClick={fetchReports}
            style={{ padding: "10px 20px", background: "rgba(59,130,246,0.15)", border: "1px solid rgba(59,130,246,0.3)", borderRadius: "8px", color: "#60a5fa", cursor: "pointer", fontSize: "14px", fontWeight: "600", fontFamily: "inherit" }}
          >
            ↻ Refresh
          </button>
        </div>
      </div>

      {/* Reports Table */}
      <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px", overflow: "hidden" }}>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ margin: 0, fontSize: "18px", fontWeight: "700" }}>Reports</h2>
          <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px" }}>{filteredReports.length} records</span>
        </div>

        {loading ? (
          <div style={{ padding: "48px", textAlign: "center" }}>
            <p style={{ fontSize: "36px", margin: "0 0 12px" }}>⏳</p>
            <p style={{ color: "rgba(255,255,255,0.3)" }}>Loading reports...</p>
          </div>
        ) : filteredReports.length === 0 ? (
          <div style={{ padding: "48px", textAlign: "center" }}>
            <p style={{ fontSize: "36px", margin: "0 0 12px" }}>📭</p>
            <p style={{ color: "rgba(255,255,255,0.3)" }}>No reports found</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "rgba(255,255,255,0.03)" }}>
                  {["Photo", "Reference ID", "Name", "Department", "Last Seen Location", "Status", "Date"].map(h => (
                    <th key={h} style={{ padding: "12px 16px", textAlign: "left", color: "rgba(255,255,255,0.4)", fontSize: "12px", fontWeight: "600", letterSpacing: "0.08em", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                      {h.toUpperCase()}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredReports.map((report, i) => {
                  const refId = report.reference_id || report.id;
                  const locationName = getLocationFromReport(report);
                  const locationData = getLocationById(report.last_seen_location_id || report.lastSeenLocationId);

                  return (
                    <tr
                      key={String(refId) + i}
                      style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", transition: "background 0.2s" }}
                      onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.03)"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                    >
                      <td style={{ padding: "14px 16px" }}>
                        {report.photo ? (
                          <img
                            src={report.photo.startsWith("http") ? report.photo : `http://localhost:8000${report.photo}`}
                            alt={report.name}
                            style={{ width: "40px", height: "40px", borderRadius: "8px", objectFit: "cover", border: "2px solid rgba(59,130,246,0.4)" }}
                          />
                        ) : (
                          <div style={{ width: "40px", height: "40px", borderRadius: "8px", background: "rgba(59,130,246,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px" }}>👤</div>
                        )}
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <span style={{ fontFamily: "monospace", color: "#60a5fa", fontSize: "12px", fontWeight: "600" }}>
                          {String(refId).length > 12 ? String(refId).substring(0, 12) + "..." : refId}
                        </span>
                      </td>
                      <td style={{ padding: "14px 16px", color: "#fff", fontWeight: "600" }}>{report.name}</td>
                      <td style={{ padding: "14px 16px", color: "rgba(255,255,255,0.5)", fontSize: "14px" }}>
                        {report.department || <span style={{ color: "#f97316" }}>Outsider</span>}
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ fontSize: "16px" }}>📍</span>
                          <div>
                            <div style={{ color: "#fff", fontSize: "13px", fontWeight: "600" }}>{locationName}</div>
                            {locationData && (
                              <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "11px" }}>
                                {locationData.cctvCameras.length} CCTV cameras
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <StatusBadge status={report.status || 'pending'} />
                      </td>
                      <td style={{ padding: "14px 16px", color: "rgba(255,255,255,0.4)", fontSize: "13px" }}>
                        {report.created_at || report.submitted_at ? new Date(report.created_at || report.submitted_at).toLocaleString() : "—"}
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