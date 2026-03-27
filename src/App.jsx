import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Layout from './components/Layout';
import LoadBoard from './pages/LoadBoard';
import PostLoad from './pages/PostLoad';
import Carriers from './pages/Carriers';
import Shippers from './pages/Shippers';
import Tracking from './pages/Tracking';
import Finance from './pages/Finance';

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<LoadBoard />} />
            <Route path="/post" element={<PostLoad />} />
            <Route path="/carriers" element={<Carriers />} />
            <Route path="/shippers" element={<Shippers />} />
            <Route path="/tracking" element={<Tracking />} />
            <Route path="/finance" element={<Finance />} />
          </Routes>
        </Layout>
      </AppProvider>
    </BrowserRouter>
  );
}
