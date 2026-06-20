import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { usePortalStore } from './lib/store';
import { portalAuth } from './lib/api';
import LoginPage from './pages/LoginPage';
import PresentationPage from './pages/PresentationPage';

function PortalRoute({ children }) {
  const token = usePortalStore(s => s.token);
  const portal = usePortalStore(s => s.portal);
  const setPortalAuth = usePortalStore(s => s.setPortalAuth);
  const logout = usePortalStore(s => s.logout);
  const [loading, setLoading] = useState(false);
  const needsContentRefresh = !!token && (!portal || portal.content == null);

  useEffect(() => {
    let active = true;
    if (!needsContentRefresh) return undefined;

    setLoading(true);
    portalAuth.currentSession()
      .then((currentPortal) => {
        if (!active) return;
        setPortalAuth(token, currentPortal);
      })
      .catch(() => {
        if (!active) return;
        logout();
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [logout, needsContentRefresh, setPortalAuth, token]);

  if (!token) return <Navigate to="/login" />;
  if (loading || needsContentRefresh) return null;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/:slug" element={<LoginPage />} />
        <Route path="/present" element={<PortalRoute><PresentationPage /></PortalRoute>} />
      </Routes>
    </BrowserRouter>
  );
}
