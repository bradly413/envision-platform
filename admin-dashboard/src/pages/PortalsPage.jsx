import { useQuery, useMutation, useQueryClient } from 'react-query';
import { portals, clients } from '../lib/api';
import { useState } from 'react';

export default function PortalsPage() {
  const qc = useQueryClient();
  const { data: allPortals = [] } = useQuery('portals', portals.list);
  const { data: allClients = [] } = useQuery('clients', () => clients.list());
  const [selectedPortal, setSelectedPortal] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ client_id: '', password: '', template_id: 'brand-reveal-v1' });

  const createMutation = useMutation(portals.create, {
    onSuccess: () => { qc.invalidateQueries('portals'); setShowCreate(false); }
  });

  const loadAnalytics = async (portal) => {
    setSelectedPortal(portal);
    const data = await portals.analytics(portal.id);
    setAnalytics(data);
  };

  const STATUS_COLOR = { draft: '#9CA3AF', active: '#10B981', expired: '#EF4444', archived: '#6B7280' };

  return (
    <div style={{ padding: 32 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#111827', margin: 0 }}>Client portals</h1>
        <button onClick={() => setShowCreate(true)} style={{ fontSize: 13, fontWeight: 700, background: '#111827', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 18px', cursor: 'pointer' }}>
          + Generate portal
        </button>
      </div>

      {/* Create portal form */}
      {showCreate && (
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB', padding: 24, marginBottom: 24 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 16 }}>New client portal</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
            <select value={form.client_id} onChange={e => setForm(f => ({ ...f, client_id: e.target.value }))} style={{ padding: '9px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13 }}>
              <option value="">Select client...</option>
              {allClients.map(c => <option key={c.id} value={c.id}>{c.name} — {c.company}</option>)}
            </select>
            <input type="password" placeholder="Portal password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} style={{ padding: '9px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13 }} />
            <select value={form.template_id} onChange={e => setForm(f => ({ ...f, template_id: e.target.value }))} style={{ padding: '9px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13 }}>
              <option value="brand-reveal-v1">Brand reveal v1</option>
              <option value="brand-reveal-minimal">Brand reveal minimal</option>
              <option value="full-identity">Full identity system</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => createMutation.mutate(form)} style={{ fontSize: 13, fontWeight: 700, background: '#111827', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 18px', cursor: 'pointer' }}>Generate</button>
            <button onClick={() => setShowCreate(false)} style={{ fontSize: 13, color: '#6B7280', background: 'none', border: '1px solid #E5E7EB', borderRadius: 8, padding: '9px 18px', cursor: 'pointer' }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Portals list */}
      <div style={{ display: 'grid', gap: 12 }}>
        {allPortals.map(portal => (
          <div key={portal.id} style={{ background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB', padding: 20, display: 'grid', gridTemplateColumns: '1fr auto', gap: 16, alignItems: 'center' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>{portal.client_name}</span>
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: STATUS_COLOR[portal.status], letterSpacing: '.06em' }}>{portal.status}</span>
              </div>
              <div style={{ fontSize: 12, color: '#6B7280', fontFamily: 'monospace' }}>
                {import.meta.env.VITE_PORTAL_URL}/{portal.slug}
              </div>
              <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>{portal.total_events} events · Template: {portal.template_id}</div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => loadAnalytics(portal)} style={{ fontSize: 12, color: '#374151', background: '#F3F4F6', border: 'none', borderRadius: 6, padding: '6px 12px', cursor: 'pointer' }}>Analytics</button>
              <button onClick={() => navigator.clipboard.writeText(`${import.meta.env.VITE_PORTAL_URL}/${portal.slug}`)} style={{ fontSize: 12, color: '#374151', background: '#F3F4F6', border: 'none', borderRadius: 6, padding: '6px 12px', cursor: 'pointer' }}>Copy URL</button>
            </div>
          </div>
        ))}
      </div>

      {/* Analytics panel */}
      {selectedPortal && analytics && (
        <div style={{ background: '#111827', borderRadius: 12, padding: 24, marginTop: 24 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#F9FAFB', marginBottom: 20 }}>Analytics — {selectedPortal.client_name}</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            {[
              { label: 'Total visits', value: analytics.totalVisits },
              { label: 'Avg session', value: `${analytics.avgSessionMinutes}m` },
              { label: 'Max scroll', value: `${analytics.maxScrollDepth}%` },
              { label: 'Approved', value: analytics.approved ? 'Yes ✓' : 'Pending' },
            ].map(s => (
              <div key={s.label} style={{ background: '#1F2937', borderRadius: 8, padding: '14px 16px' }}>
                <div style={{ fontSize: 11, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 6 }}>{s.label}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#F9FAFB' }}>{s.value}</div>
              </div>
            ))}
          </div>
          {analytics.sectionsViewed.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 8 }}>Sections viewed</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {analytics.sectionsViewed.map(s => <span key={s} style={{ fontSize: 12, background: '#374151', color: '#D1D5DB', borderRadius: 20, padding: '3px 10px' }}>{s}</span>)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
