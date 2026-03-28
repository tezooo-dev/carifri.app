import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ToastProvider } from './context/ToastContext';
import { AppProvider } from './context/AppContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import LoadBoard from './pages/LoadBoard';
import PostLoad from './pages/PostLoad';
import Carriers from './pages/Carriers';
import Shippers from './pages/Shippers';
import Tracking from './pages/Tracking';
import Finance from './pages/Finance';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import AIDispatch from './pages/AIDispatch';
import Login from './pages/Login';

function RequireAuth({ children }) {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/*"
        element={
          <RequireAuth>
            <Layout>
              <Routes>
                <Route path="/"          element={<Dashboard />} />
                <Route path="/loads"     element={<LoadBoard />} />
                <Route path="/post"      element={<PostLoad />} />
                <Route path="/carriers"  element={<Carriers />} />
                <Route path="/shippers"  element={<Shippers />} />
                <Route path="/tracking"  element={<Tracking />} />
                <Route path="/finance"   element={<Finance />} />
                <Route path="/reports"   element={<Reports />} />
                <Route path="/settings"  element={<Settings />} />
                <Route path="/ai"        element={<AIDispatch />} />
              </Routes>
            </Layout>
          </RequireAuth>
        }
      />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
          <ToastProvider>
            <AppProvider>
              <AppRoutes />
            </AppProvider>
          </ToastProvider>
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
