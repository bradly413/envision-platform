import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../lib/store';

const NAV = [
  { to: '/',         label: 'Dashboard',  icon: '◻' },
  { to: '/pipeline', label: 'Pipeline',   icon: '◈' },
  { to: '/calendar', label: 'Calendar',   icon: '◷' },
  { to: '/tasks',    label: 'Tasks',      icon: '◻' },
  { to: '/finance',  label: 'Finance',    icon: '◻' },
  { to: '/agents',   label: 'AI Agents',  icon: '◻' },
  { to: '/portals',  label: 'Portals',    icon: '◻' },
];

export default function Layout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#F0F2F5', fontFamily: 'Inter, sans-serif' }}>
      {/* Sidebar */}
      <aside style={{ width: 240, background: '#fff', borderRight: '1px solid #E5E7EB', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid #E5E7EB' }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: '#6B7280', marginBottom: 4 }}>Envision</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#111827' }}>Bradley Robert</div>
        </div>
        <nav style={{ flex: 1, padding: '12px 0', overflowY: 'auto' }}>
          {NAV.map(({ to, label, icon }) => (
            <NavLink key={to} to={to} end={to === '/'} style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 10, padding: '9px 20px',
              fontSize: 13, fontWeight: 500, textDecoration: 'none',
              color: isActive ? '#111827' : '#6B7280',
              background: isActive ? '#F3F4F6' : 'transparent',
              borderRight: isActive ? '2px solid #111827' : '2px solid transparent',
            })}>
              <span style={{ fontSize: 14 }}>{icon}</span>{label}
            </NavLink>
          ))}
        </nav>
        <div style={{ padding: '16px 20px', borderTop: '1px solid #E5E7EB' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', marginBottom: 2 }}>{user?.name}</div>
          <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 10 }}>{user?.email}</div>
          <button onClick={handleLogout} style={{ fontSize: 12, color: '#6B7280', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>Sign out</button>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, overflow: 'auto' }}>
        <Outlet />
      </main>
    </div>
  );
}
