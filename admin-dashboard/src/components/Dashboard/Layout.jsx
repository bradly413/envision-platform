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
      { to: '/portals',        label: 'Client Portals', icon: '⬡' },
      { to: '/portal-editor',  label: 'Portal Editor',  icon: '✦' },
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
  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#F0F2F5', fontFamily: 'Inter, sans-serif' }}>
      <aside style={{
        width: 232, background: '#fff', borderRight: '1px solid #E5E7EB',
        display: 'flex', flexDirection: 'column', flexShrink: 0,
      }}>
        <div style={{ padding: '18px 20px 14px', borderBottom: '1px solid #F3F4F6' }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: '#9CA3AF', marginBottom: 3 }}>Envision</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#111827', letterSpacing: '-.01em' }}>Envision Creative</div>
        </div>

        <nav style={{ flex: 1, padding: '10px 0', overflowY: 'auto' }}>
          {NAV_GROUPS.map(group => (
            <div key={group.label} style={{ marginBottom: 4 }}>
              <div style={{
                fontSize: 10, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase',
                color: '#D1D5DB', padding: '10px 20px 4px',
              }}>{group.label}</div>
              {group.items.map(({ to, label, icon }) => (
                <NavLink key={to} to={to} end={to === '/'} style={({ isActive }) => ({
                  display: 'flex', alignItems: 'center', gap: 10, padding: '8px 20px',
                  fontSize: 13, fontWeight: isActive ? 600 : 500, textDecoration: 'none',
                  color: isActive ? '#111827' : '#6B7280',
                  background: isActive ? '#F3F4F6' : 'transparent',
                  borderRight: isActive ? '2px solid #111827' : '2px solid transparent',
                  transition: 'all .1s',
                })}>
                  <span style={{ fontSize: 13, width: 16, textAlign: 'center', opacity: .7 }}>{icon}</span>
                  {label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div style={{ padding: '14px 20px', borderTop: '1px solid #F3F4F6' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <div style={{
              width: 30, height: 30, borderRadius: '50%', background: '#111827',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0,
            }}>
              {(user?.name || user?.email || 'B')[0].toUpperCase()}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.name || 'Bradly'}
              </div>
              <div style={{ fontSize: 11, color: '#9CA3AF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.email}
              </div>
            </div>
          </div>
          <button onClick={handleLogout} style={{ fontSize: 12, color: '#9CA3AF', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            onMouseOver={e => e.currentTarget.style.color = '#111827'}
            onMouseOut={e => e.currentTarget.style.color = '#9CA3AF'}>
            Sign out
          </button>
        </div>
      </aside>

      <main style={{ flex: 1, overflow: 'auto' }}>
        <Outlet />
      </main>
    </div>
  );
}
