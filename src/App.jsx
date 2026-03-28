import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ToastProvider } from './context/ToastContext';
import { AppProvider } from './context/AppContext';
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

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AppProvider>
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
            </Routes>
          </Layout>
        </AppProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
