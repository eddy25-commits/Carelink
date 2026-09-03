import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./routes/ProtectedRoute";
import PwaUpdateToast from "./components/PwaUpdateToast";
import OfflineBanner from "./components/OfflineBanner";

import Landing from "./pages/Landing";
import ReportForm from "./pages/ReportForm";
import TrackStatus from "./pages/TrackStatus";
import Login from "./pages/Login";
import TriageDashboard from "./pages/TriageDashboard";
import ReportDetail from "./pages/ReportDetail";
import Incidents from "./pages/Incidents";
import IncidentDetail from "./pages/IncidentDetail";
import NotFound from "./pages/NotFound";

export default function App() {
  return (
    <>
      <div className="ambient-backdrop" aria-hidden="true" />
      <OfflineBanner />
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/report" element={<ReportForm />} />
          <Route path="/track" element={<TrackStatus />} />
          <Route path="/login" element={<Login />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <TriageDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports/:id"
            element={
              <ProtectedRoute>
                <ReportDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/incidents"
            element={
              <ProtectedRoute>
                <Incidents />
              </ProtectedRoute>
            }
          />
          <Route
            path="/incidents/:id"
            element={
              <ProtectedRoute>
                <IncidentDetail />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <PwaUpdateToast />
    </>
  );
}
