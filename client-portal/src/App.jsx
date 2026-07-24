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
  const needsContentRefresh = Boolean(token && (!portal || portal.content == null));
  const [loading, setLoading] = useState(needsContentRefresh);

  useEffect(() => {
    if (!needsContentRefresh) return undefined;

    let active = true;
    setLoading(true);
    portalAuth.currentSession()
      .then((currentPortal) => {
        if (!active) return;
        setLoading(false);
        setPortalAuth(token, currentPortal);
      })
      .catch(() => {
        if (!active) return;
        setLoading(false);
        logout();
      });

    return () => {
      active = false;
    };
  }, [logout, needsContentRefresh, setPortalAuth, token]);

  if (!token) return <Navigate to="/login" />;
  if (loading) return null;
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
