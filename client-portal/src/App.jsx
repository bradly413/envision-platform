import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { portalAuth } from './lib/api';
import { usePortalStore } from './lib/store';
import LoginPage from './pages/LoginPage';
import PresentationPage from './pages/PresentationPage';

function PortalRoute({ children }) {
  const token = usePortalStore(s => s.token);
  const portal = usePortalStore(s => s.portal);
  const setPortalAuth = usePortalStore(s => s.setPortalAuth);
  const logout = usePortalStore(s => s.logout);
  const [hasHydrated, setHasHydrated] = useState(usePortalStore.persist.hasHydrated());
  const [restoringSession, setRestoringSession] = useState(
    Boolean(token && (!portal || portal.content == null))
  );

  useEffect(() => {
    const unsubscribe = usePortalStore.persist.onFinishHydration(() => setHasHydrated(true));
    setHasHydrated(usePortalStore.persist.hasHydrated());
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!hasHydrated || !token || (portal && portal.content != null)) {
      setRestoringSession(false);
      return undefined;
    }

    let active = true;
    setRestoringSession(true);
    portalAuth.session()
      .then((data) => {
        if (active) setPortalAuth(token, data.portal);
      })
      .catch(() => {
        if (active) logout();
      })
      .finally(() => {
        if (active) setRestoringSession(false);
      });

    return () => {
      active = false;
    };
  }, [hasHydrated, logout, portal, setPortalAuth, token]);

  if (!hasHydrated || restoringSession) return null;
  return token ? children : <Navigate to="/login" />;
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
