import { useQuery, useMutation, useQueryClient } from 'react-query';
import { portals, clients } from '../lib/api';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const PORTAL_URL = import.meta.env.VITE_PORTAL_URL || 'https://marvelous-belekoy-63770f.netlify.app';
const STATUS_COLOR = { draft: '#9CA3AF', active: '#10B981', expired: '#EF4444', archived: '#6B7280' };

export default function PortalsPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data: allPortals = [] } = useQuery('portals', portals.list);
  const { data: allClients = [] } = useQuery('clients', () => clients.list());
  const [selectedPortal, setSelectedPortal] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [copied, setCopied] = useState(null);
  const [showPassword, setShowPassword] = useState({});
  const [form, setForm] = useState({ client_id: '', password: '', template_id: 'brand-reveal-v1' });

  const createMutation = useMutation(portals.create, {
    onSuccess: () => { qc.invalidateQueries('portals'); setShowCreate(false); setForm({ client_id: '', password: '', template_id: 'brand-reveal-v1' }); }
  });

  const loadAnalytics = async (portal) => {
    if (selectedPortal?.id === portal.id) { setSelectedPortal(null); setAnalytics(null); return; }
    setSelectedPortal(portal);
    setAnalyticsLoading(true);
    try {
      const data = await portals.analytics(portal.id);
      setAnalytics(data);
    } catch { setAnalytics(null); }
    finally { setAnalyticsLoading(false); }
  };

  const copyURL = (portal) => {
    const url = `${PORTAL_URL}/${portal.slug}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(portal.id);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  const togglePassword = (id) => setShowPassword(p => ({ ...p, [id]: !p[id] }));

  const deleteMutation = useMutation(id => portals.delete(id), {
    onSuccess: () => { qc.invalidateQueries('portals'); setSelectedPortal(null); setAnalytics(null); },
  });

  const handleDelete = (portal) => {
    if (window.confirm(`Delete portal for ${portal.client_name}? This cannot be undone.`)) {
      deleteMutation.mutate(portal.id);
    }
  };

  return (
    <div style={{ padding: 32, fontFamily: 'Inter, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#111827', margin: 0 }}>Client portals</h1>
        <button onClick={() => setShowCreate(s => !s)} style={{ fontSize: 13, fontWeight: 700, background: '#111827', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 18px', cursor: 'pointer' }}>
          {showCreate ? 'Cancel' : '+ Generate portal'}
        </button>
      </div>

      {/* Create portal form */}
      {showCreate && (
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB', padding: 24, marginBottom: 24 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 16 }}>New client portal</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
            <select value={form.client_id} onChange={e => setForm(f => ({ ...f, client_id: e.target.value }))}
              style={{ padding: '9px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, background: '#fff' }}>
              <option value="">Select client...</option>
              {allClients.map(c => <option key={c.id} value={c.id}>{c.name}{c.company ? ` — ${c.company}` : ''}</option>)}
            </select>
            <input type="text" placeholder="Portal password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              style={{ padding: '9px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13 }} />
            <select value={form.template_id} onChange={e => setForm(f => ({ ...f, template_id: e.target.value }))}
              style={{ padding: '9px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, background: '#fff' }}>
              <option value="brand-reveal-v1">Brand reveal v1</option>
              <option value="brand-reveal-minimal">Brand reveal minimal</option>
              <option value="full-identity">Full identity system</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => createMutation.mutate(form)} disabled={!form.client_id || !form.password || createMutation.isLoading}
              style={{ fontSize: 13, fontWeight: 700, background: '#111827', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 18px', cursor: 'pointer', opacity: (!form.client_id || !form.password) ? .5 : 1 }}>
              {createMutation.isLoading ? 'Generating...' : 'Generate'}
            </button>
          </div>
        </div>
      )}

      {/* Portals list */}
      <div style={{ display: 'grid', gap: 12 }}>
        {allPortals.length === 0 && (
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB', padding: 40, textAlign: 'center', color: '#9CA3AF', fontSize: 14 }}>
            No portals yet. Generate one above.
          </div>
        )}
        {allPortals.map(portal => (
          <div key={portal.id}>
            <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB', padding: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 16, alignItems: 'start' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <span style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>{portal.client_name}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: STATUS_COLOR[portal.status], letterSpacing: '.06em' }}>{portal.status}</span>
                  </div>

                  {/* Login info */}
                  <div style={{ display: 'flex', gap: 20, marginBottom: 6 }}>
                    <div>
                      <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: '#9CA3AF' }}>Code </span>
                      <span style={{ fontSize: 12, fontFamily: 'monospace', color: '#374151', background: '#F3F4F6', padding: '2px 7px', borderRadius: 4 }}>{portal.slug}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: '#9CA3AF' }}>Password </span>
                      <span style={{ fontSize: 12, fontFamily: 'monospace', color: '#374151', background: '#F3F4F6', padding: '2px 7px', borderRadius: 4 }}>
                        {showPassword[portal.id] ? (portal.plain_password || '(encrypted)') : '••••••••'}
                      </span>
                      <button onClick={() => togglePassword(portal.id)}
                        style={{ fontSize: 10, color: '#6B7280', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                        {showPassword[portal.id] ? 'hide' : 'show'}
                      </button>
                    </div>
                  </div>

                  <div style={{ fontSize: 11, color: '#9CA3AF' }}>{portal.total_events} events · Template: {portal.template_id}</div>
                </div>

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  <button onClick={() => navigate(`/portals/${portal.id}/edit`)}
                    style={{ fontSize: 12, color: '#fff', background: '#111827', border: 'none', borderRadius: 6, padding: '6px 12px', cursor: 'pointer', fontWeight: 600 }}>
                    Edit content
                  </button>
                  <button onClick={() => loadAnalytics(portal)}
                    style={{ fontSize: 12, color: selectedPortal?.id === portal.id ? '#fff' : '#374151', background: selectedPortal?.id === portal.id ? '#374151' : '#F3F4F6', border: 'none', borderRadius: 6, padding: '6px 12px', cursor: 'pointer' }}>
                    Analytics
                  </button>
                  <button onClick={() => copyURL(portal)}
                    style={{ fontSize: 12, color: copied === portal.id ? '#10B981' : '#374151', background: '#F3F4F6', border: 'none', borderRadius: 6, padding: '6px 12px', cursor: 'pointer', fontWeight: copied === portal.id ? 700 : 400 }}>
                    {copied === portal.id ? 'Copied ✓' : 'Copy URL'}
                  </button>
                  <button onClick={() => window.open(`${PORTAL_URL}/${portal.slug}`, '_blank')}
                    style={{ fontSize: 12, color: '#374151', background: '#F3F4F6', border: 'none', borderRadius: 6, padding: '6px 12px', cursor: 'pointer' }}>
                    Open ↗
                  </button>
                  <button onClick={() => handleDelete(portal)}
                    style={{ fontSize: 12, color: '#EF4444', background: '#FEF2F2', border: 'none', borderRadius: 6, padding: '6px 12px', cursor: 'pointer' }}>
                    Delete
                  </button>
                </div>
              </div>
            </div>

            {/* Analytics panel inline */}
            {selectedPortal?.id === portal.id && (
              <div style={{ background: '#111827', borderRadius: '0 0 12px 12px', padding: 24, marginTop: -4, border: '1px solid #1F2937', borderTop: 'none' }}>
                {analyticsLoading ? (
                  <div style={{ fontSize: 13, color: '#6B7280' }}>Loading analytics…</div>
                ) : analytics ? (
                  <>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#F9FAFB', marginBottom: 16 }}>Analytics — {portal.client_name}</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
                      {[
                        { label: 'Total visits', value: analytics.totalVisits ?? 0 },
                        { label: 'Avg session', value: `${analytics.avgSessionMinutes ?? 0}m` },
                        { label: 'Max scroll', value: `${analytics.maxScrollDepth ?? 0}%` },
                        { label: 'Approved', value: analytics.approved ? 'Yes ✓' : 'Pending' },
                      ].map(s => (
                        <div key={s.label} style={{ background: '#1F2937', borderRadius: 8, padding: '12px 14px' }}>
                          <div style={{ fontSize: 10, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 4 }}>{s.label}</div>
                          <div style={{ fontSize: 20, fontWeight: 800, color: '#F9FAFB' }}>{s.value}</div>
                        </div>
                      ))}
                    </div>
                    {analytics.sectionsViewed?.length > 0 && (
                      <div>
                        <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 6 }}>Sections viewed</div>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {analytics.sectionsViewed.map(s => <span key={s} style={{ fontSize: 11, background: '#374151', color: '#D1D5DB', borderRadius: 20, padding: '3px 10px' }}>{s}</span>)}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div style={{ fontSize: 13, color: '#6B7280' }}>No analytics data yet.</div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
