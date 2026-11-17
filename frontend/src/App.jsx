import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';

// Import Page Stubs (We will fill them progressively)
import Dashboard from './pages/Dashboard';
import InteractiveMap from './pages/InteractiveMap';
import Incidents from './pages/Incidents';
import Telemetry from './pages/Telemetry';
import Assets from './pages/Assets';
import Simulator from './pages/Simulator';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';


// AI Chatbot overlay
import AIChatbot from './components/AIChatbot';

function AppRoutes() {
  const { user } = useAuth();

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/map" element={<InteractiveMap />} />
        <Route path="/incidents" element={<Incidents />} />
        <Route path="/telemetry" element={<Telemetry />} />
        <Route path="/assets" element={<Assets />} />
        <Route path="/simulator" element={<Simulator />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <AIChatbot />
    </Layout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}
