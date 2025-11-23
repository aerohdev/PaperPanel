import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { PermissionProvider } from './contexts/PermissionContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Console from './pages/Console';
import Plugins from './pages/Plugins';
import Players from './pages/Players';
import ServerControl from './pages/ServerControl';
import Worlds from './pages/Worlds';
import Broadcast from './pages/Broadcast';
import LogViewer from './pages/LogViewer';
import ConfigEditor from './pages/ConfigEditor';
import WhitelistOps from './pages/WhitelistOps';
import UserRoleManagement from './pages/UserRoleManagement';
import { AuditLog } from './pages/AuditLog';

function App() {
  return (
    <AuthProvider>
      <PermissionProvider>
        <Router>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />

            {/* Protected routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="console" element={<Console />} />
              <Route path="plugins" element={<Plugins />} />
              <Route path="players" element={<Players />} />
              <Route path="whitelist" element={<WhitelistOps />} />
              <Route path="server" element={<ServerControl />} />
              <Route path="worlds" element={<Worlds />} />
              <Route path="broadcast" element={<Broadcast />} />
              <Route path="users" element={<UserRoleManagement />} />
              <Route path="audit" element={<AuditLog />} />
              <Route path="logs" element={<LogViewer />} />
              <Route path="configs" element={<ConfigEditor />} />
            </Route>

            {/* Catch all - redirect to dashboard */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Router>
      </PermissionProvider>
    </AuthProvider>
  );
}

export default App;
