import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import Dashboard from "./pages/Dashboard";
import DetectionList from "./pages/DetectionList";
import DetectionMap from "./pages/DetectionMap";
import UploadCCTV from "./pages/UploadCCTV";

function ProtectedRoute({ children }) {
  return localStorage.getItem("admin")
    ? children
    : <Navigate to="/admin/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="detections" element={<DetectionList />} />
          <Route path="map" element={<DetectionMap />} />
          <Route path="upload-cctv" element={<UploadCCTV />} />
        </Route>
        <Route path="*" element={<Navigate to="/admin/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}