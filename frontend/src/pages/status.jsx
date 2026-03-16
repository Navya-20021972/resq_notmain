import axios from 'axios';
import { useState } from 'react';

export default function Status() {
  const [ref, setRef] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const check = async () => {
    if (!ref.trim()) return alert('Please enter a reference ID');
    setLoading(true);
    try {
      const res = await axios.get(
        `http://localhost:8000/api/check-status/${ref}/`
      );
      setData(res.data);
    } catch (error) {
      alert('Error: ' + (error.response?.data?.error || error.message));
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const s = (status || '').toLowerCase();
    if (s.includes('found') || s.includes('detected')) return '#10b981';
    if (s.includes('processing')) return '#8b5cf6';
    return '#f97316';
  };

  const getStatusBg = (status) => {
    const s = (status || '').toLowerCase();
    if (s.includes('found') || s.includes('detected')) return 'rgba(16,185,129,0.1)';
    if (s.includes('processing')) return 'rgba(139,92,246,0.1)';
    return 'rgba(249,115,22,0.1)';
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', padding: '32px', fontFamily: "'Segoe UI', sans-serif", color: '#fff' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '32px', textAlign: 'center' }}>
          <h1 style={{ fontSize: '32px', fontWeight: '800', margin: '0 0 8px' }}>🔍 Check Report Status</h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', margin: 0, fontSize: '14px' }}>
            Enter your reference ID to check the latest updates on your missing person report
          </p>
        </div>

        {/* Input Card */}
        <div style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '24px',
          display: 'flex',
          gap: '12px',
          alignItems: 'flex-end',
        }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', color: '#93c5fd', fontSize: '12px', fontWeight: '700', marginBottom: '8px', letterSpacing: '0.08em' }}>
              REFERENCE ID
            </label>
            <input
              type="text"
              placeholder="Enter your 36-character UUID..."
              value={ref}
              onChange={e => setRef(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && check()}
              style={{
                width: '100%',
                padding: '12px 16px',
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '14px',
                outline: 'none',
                fontFamily: 'inherit',
                boxSizing: 'border-box',
              }}
            />
          </div>
          <button
            onClick={check}
            disabled={loading}
            style={{
              padding: '12px 32px',
              background: loading ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #1a56db, #0891b2)',
              border: 'none',
              borderRadius: '8px',
              color: '#fff',
              fontWeight: '700',
              fontSize: '14px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
            }}
          >
            {loading ? '⏳ Checking...' : '🔍 Check Status'}
          </button>
        </div>

        {/* Status Display */}
        {data && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Main Status Card */}
            <div style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '16px',
              overflow: 'hidden',
            }}>
              <div style={{
                background: getStatusBg(data.status),
                borderBottom: `2px solid ${getStatusColor(data.status)}`,
                padding: '20px 24px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
                  <div>
                    <p style={{ margin: '0 0 4px', fontSize: '14px', color: 'rgba(255,255,255,0.6)' }}>Missing Person</p>
                    <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '800' }}>{data.name}</h2>
                  </div>
                  <div style={{
                    padding: '8px 16px',
                    background: getStatusColor(data.status),
                    borderRadius: '12px',
                    fontWeight: '700',
                    fontSize: '14px',
                    color: '#0f172a',
                  }}>
                    {data.status}
                  </div>
                </div>
              </div>

              {/* Details */}
              <div style={{ padding: '24px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                  {data.student_id && (
                    <div>
                      <p style={{ margin: '0 0 4px', color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}>Student ID</p>
                      <p style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>{data.student_id}</p>
                    </div>
                  )}
                  {data.last_seen_location && (
                    <div>
                      <p style={{ margin: '0 0 4px', color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}>Last Seen Location</p>
                      <p style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>📍 {data.last_seen_location}</p>
                    </div>
                  )}
                </div>

                {/* Found Information */}
                {data.found_location && (
                  <div style={{
                    padding: '16px',
                    background: 'rgba(16,185,129,0.1)',
                    border: '1px solid rgba(16,185,129,0.3)',
                    borderRadius: '8px',
                    marginBottom: '20px',
                  }}>
                    <p style={{ margin: '0 0 8px', fontSize: '12px', color: '#10b981', fontWeight: '700' }}>✅ FOUND LOCATION</p>
                    <p style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: '600' }}>📍 {data.found_location}</p>
                    {data.found_at && (
                      <p style={{ margin: 0, fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
                        🕒 {new Date(data.found_at).toLocaleString()}
                      </p>
                    )}
                  </div>
                )}

                <p style={{ margin: 0, color: 'rgba(255,255,255,0.6)', fontSize: '14px', lineHeight: '1.6' }}>
                  {data.message}
                </p>
              </div>
            </div>

            {/* Detection Results */}
            {data.detected_locations && data.detected_locations.length > 0 && (
              <div style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '16px',
                overflow: 'hidden',
              }}>
                <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800' }}>📍 Detection Results ({data.detected_locations.length})</h3>
                </div>

                <div style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {data.detected_locations.map((det, i) => (
                      <div key={i} style={{
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '12px',
                        padding: '16px',
                      }}>
                        {/* Detection Meta */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                          <div>
                            <p style={{ margin: '0 0 4px', color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}>Location</p>
                            <p style={{ margin: 0, fontSize: '15px', fontWeight: '600' }}>📍 {det.location}</p>
                          </div>
                          <div>
                            <p style={{ margin: '0 0 4px', color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}>Confidence</p>
                            <p style={{ margin: 0, fontSize: '15px', fontWeight: '600' }}>🎯 {det.confidence.toFixed(1)}%</p>
                          </div>
                          {det.latitude && (
                            <div>
                              <p style={{ margin: '0 0 4px', color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}>Coordinates</p>
                              <p style={{ margin: 0, fontSize: '12px', color: '#60a5fa' }}>🌐 {det.latitude}, {det.longitude}</p>
                            </div>
                          )}
                          <div>
                            <p style={{ margin: '0 0 4px', color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}>Timestamp</p>
                            <p style={{ margin: 0, fontSize: '12px', color: '#60a5fa' }}>🕒 {new Date(det.timestamp).toLocaleString()}</p>
                          </div>
                        </div>

                        {/* Images */}
                        {det.face_b64 && (
                          <div style={{
                            borderTop: '1px solid rgba(255,255,255,0.08)',
                            paddingTop: '16px',
                          }}>
                            <p style={{ margin: '0 0 12px', fontSize: '12px', color: 'rgba(255,255,255,0.6)', fontWeight: '600' }}>Detected Face Image</p>
                            <img
                              src={det.face_b64}
                              alt="Detected face"
                              style={{
                                maxWidth: '200px',
                                maxHeight: '200px',
                                borderRadius: '8px',
                                display: 'block',
                              }}
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* No Detections */}
            {(!data.detected_locations || data.detected_locations.length === 0) && data.status !== 'Pending Investigation' && (
              <div style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '16px',
                padding: '40px',
                textAlign: 'center',
              }}>
                <p style={{ fontSize: '32px', margin: '0 0 12px' }}>🔍</p>
                <p style={{ margin: 0, color: 'rgba(255,255,255,0.5)' }}>No detections yet. We're still searching...</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
