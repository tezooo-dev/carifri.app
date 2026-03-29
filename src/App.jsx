import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ToastProvider } from './context/ToastContext';
import { AppProvider } from './context/AppContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import Layout         from './components/Layout';
import Dashboard      from './pages/Dashboard';
import LoadBoard      from './pages/LoadBoard';
import PostLoad       from './pages/PostLoad';
import Carriers       from './pages/Carriers';
import Shippers       from './pages/Shippers';
import Tracking       from './pages/Tracking';
import Finance        from './pages/Finance';
import Reports        from './pages/Reports';
import Settings       from './pages/Settings';
import AIDispatch     from './pages/AIDispatch';
import KnowledgeBase  from './pages/KnowledgeBase';
import UserManagement from './pages/UserManagement';
import Login          from './pages/Login';

function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-slate-100">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"/>
        <p className="text-slate-500 text-sm">Restoring session…</p>
      </div>
    </div>
  );
  if (!user) return <Navigate to="/login" state={{ from: location }} replace/>;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login/>}/>
      <Route path="/*" element={
        <RequireAuth>
          <Layout>
            <Routes>
              <Route path="/"          element={<Dashboard/>}/>
              <Route path="/loads"     element={<LoadBoard/>}/>
              <Route path="/post"      element={<PostLoad/>}/>
              <Route path="/carriers"  element={<Carriers/>}/>
              <Route path="/shippers"  element={<Shippers/>}/>
              <Route path="/tracking"  element={<Tracking/>}/>
              <Route path="/finance"   element={<Finance/>}/>
              <Route path="/reports"   element={<Reports/>}/>
              <Route path="/settings"  element={<Settings/>}/>
              <Route path="/ai"        element={<AIDispatch/>}/>
              <Route path="/help"      element={<KnowledgeBase/>}/>
              <Route path="/users"     element={<UserManagement/>}/>
            </Routes>
          </Layout>
        </RequireAuth>
      }/>
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
              <AppRoutes/>
            </AppProvider>
          </ToastProvider>
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
