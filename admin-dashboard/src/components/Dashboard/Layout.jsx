import { useEffect, useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../lib/store';

const NAV_GROUPS = [
  {
    label: 'Workspace',
    items: [
      { to: '/',         label: 'Dashboard',     icon: '⬡' },
      { to: '/pipeline', label: 'Pipeline',      icon: '◈' },
      { to: '/tasks',    label: 'Tasks',         icon: '✓' },
      { to: '/calendar', label: 'Calendar',      icon: '▦' },
      { to: '/finance',  label: 'Finance',       icon: '$' },
    ],
  },
  {
    label: 'Portals',
    items: [
      { to: '/portals',        label: 'Client Portals',     icon: '⬡' },
      { to: '/portal-editor',  label: 'Experience Builder', icon: '◎' },
    ],
  },
  {
    label: 'Intelligence',
    items: [
      { to: '/agents', label: 'AI Agents', icon: '◎' },
    ],
  },
];

export default function Layout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [viewportWidth, setViewportWidth] = useState(() => (typeof window === 'undefined' ? 1440 : window.innerWidth));
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem('envision-admin-sidebar-collapsed') === 'true';
  });
  const handleLogout = () => { logout(); navigate('/login'); };

  useEffect(() => {
    window.localStorage.setItem('envision-admin-sidebar-collapsed', String(isCollapsed));
  }, [isCollapsed]);

  useEffect(() => {
    const handleResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isAutoCollapsed = viewportWidth < 1024;
  const sidebarCollapsed = isCollapsed || isAutoCollapsed;

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#F0F2F5', fontFamily: 'Inter, sans-serif', minWidth: 0 }}>
      <aside style={{
        width: sidebarCollapsed ? 72 : 232, background: '#fff', borderRight: '1px solid #E5E7EB',
        display: 'flex', flexDirection: 'column', flexShrink: 0, transition: 'width .18s ease',
      }}>
        <div style={{ padding: sidebarCollapsed ? '16px 10px 14px' : '18px 20px 14px', borderBottom: '1px solid #F3F4F6' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: '#9CA3AF', marginBottom: 3, textAlign: sidebarCollapsed ? 'center' : 'left' }}>
                {sidebarCollapsed ? 'EV' : 'Envision'}
              </div>
              {!sidebarCollapsed ? (
                <div style={{ fontSize: 16, fontWeight: 800, color: '#111827', letterSpacing: '-.01em' }}>Envision Creative</div>
              ) : null}
            </div>
            <button
              onClick={() => setIsCollapsed((current) => !current)}
              title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              style={{
                width: 28,
                height: 28,
                borderRadius: 10,
                border: '1px solid #E5E7EB',
                background: '#F9FAFB',
                color: '#6B7280',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                flexShrink: 0,
                opacity: isAutoCollapsed ? 0.7 : 1,
              }}
            >
              {sidebarCollapsed ? '→' : '←'}
            </button>
          </div>
        </div>

        <nav style={{ flex: 1, padding: '10px 0', overflowY: 'auto' }}>
          {NAV_GROUPS.map(group => (
            <div key={group.label} style={{ marginBottom: 4 }}>
              {!sidebarCollapsed ? (
                <div style={{
                  fontSize: 10, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase',
                  color: '#D1D5DB', padding: '10px 20px 4px',
                }}>{group.label}</div>
              ) : null}
              {group.items.map(({ to, label, icon }) => (
                <NavLink key={to} to={to} end={to === '/'} style={({ isActive }) => ({
                  display: 'flex', alignItems: 'center', gap: 10, padding: sidebarCollapsed ? '10px 0' : '8px 20px',
                  justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                  fontSize: 13, fontWeight: isActive ? 600 : 500, textDecoration: 'none',
                  color: isActive ? '#111827' : '#6B7280',
                  background: isActive ? '#F3F4F6' : 'transparent',
                  borderRight: isActive ? '2px solid #111827' : '2px solid transparent',
                  transition: 'all .1s',
                })} title={sidebarCollapsed ? label : undefined}>
                  <span style={{ fontSize: 13, width: 16, textAlign: 'center', opacity: .7 }}>{icon}</span>
                  {!sidebarCollapsed ? label : null}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div style={{ padding: sidebarCollapsed ? '14px 10px' : '14px 20px', borderTop: '1px solid #F3F4F6' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: sidebarCollapsed ? 0 : 8, justifyContent: sidebarCollapsed ? 'center' : 'flex-start' }}>
            <div style={{
              width: 30, height: 30, borderRadius: '50%', background: '#111827',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0,
            }}>
              {(user?.name || user?.email || 'B')[0].toUpperCase()}
            </div>
            {!sidebarCollapsed ? (
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user?.name || 'Bradly'}
                </div>
                <div style={{ fontSize: 11, color: '#9CA3AF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user?.email}
                </div>
              </div>
            ) : null}
          </div>
          {!sidebarCollapsed ? (
            <button onClick={handleLogout} style={{ fontSize: 12, color: '#9CA3AF', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              onMouseOver={e => e.currentTarget.style.color = '#111827'}
              onMouseOut={e => e.currentTarget.style.color = '#9CA3AF'}>
              Sign out
            </button>
          ) : (
            <button
              onClick={handleLogout}
              title="Sign out"
              aria-label="Sign out"
              style={{
                display: 'block',
                margin: '10px auto 0',
                width: 30,
                height: 30,
                borderRadius: 999,
                border: '1px solid #E5E7EB',
                background: '#F9FAFB',
                color: '#9CA3AF',
                cursor: 'pointer',
              }}
            >
              ↗
            </button>
          )}
        </div>
      </aside>

      <main style={{ flex: 1, minWidth: 0, overflow: 'auto' }}>
        <Outlet />
      </main>
    </div>
  );
}
