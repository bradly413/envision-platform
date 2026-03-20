import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { usePortalStore } from './lib/store';
import LoginPage from './pages/LoginPage';
import PresentationPage from './pages/PresentationPage';

function PortalRoute({ children }) {
  const token = usePortalStore(s => s.token);
  return token ? children : <Navigate to="/login" />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/:slug" element={<LoginPage />} />
        <Route path="/present" element={<PortalRoute><PresentationPage /></PortalRoute>} />
      </Routes>
    </BrowserRouter>
  );
}
