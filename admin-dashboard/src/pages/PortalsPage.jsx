import { useQuery, useMutation, useQueryClient } from 'react-query';
import { portals, clients } from '../lib/api';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const PORTAL_URL = import.meta.env.VITE_PORTAL_URL || 'https://envision-portal.netlify.app';
const API_URL = import.meta.env.VITE_API_URL || 'https://envision-platform-production.up.railway.app/api';
const STATUS_COLOR = { draft: '#9CA3AF', active: '#10B981', expired: '#EF4444', archived: '#6B7280' };
const STATUS_BG = { draft: '#F3F4F6', active: '#D1FAE5', expired: '#FEE2E2', archived: '#F3F4F6' };

function AnalyticsPanel({ portal, analytics, loading, outreachDraft, outreachLoading, onGenerateEmail, onClose }) {
  if (!portal) return null;

  // Fix: normalize session time from ms to minutes
  const avgSessionMs = Number(analytics?.avgSessionMs || analytics?.avgSession || 0);
  const avgSessionMin = avgSessionMs > 1000 ? Math.round(avgSessionMs / 60000) : Math.round(avgSessionMs);
  const maxScroll = Math.min(100, Number(analytics?.maxScroll || 0));

  return (
    <div style={{ background: '#0F172A', borderRadius: 12, padding: 22, marginTop: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#F8FAFC' }}>Analytics — {portal.client_name}</div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: 18, lineHeight: 1 }}>×</button>
      </div>

      {loading ? (
        <div style={{ color: '#475569', fontSize: 13 }}>Loading analytics...</div>
      ) : (
        <>
          {/* Stat grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 18 }}>
            {[
              { label: 'Total visits', value: analytics?.totalVisits || 0, color: '#60A5FA' },
              { label: 'Avg session', value: `${avgSessionMin}m`, color: '#34D399' },
              { label: 'Max scroll', value: `${maxScroll}%`, color: '#FBBF24' },
              { label: 'Decision', value: analytics?.approved ? 'Approved ✓' : analytics?.revisionRequested ? 'Revision' : 'Pending', color: analytics?.approved ? '#34D399' : analytics?.revisionRequested ? '#FBBF24' : '#9CA3AF' },
            ].map(s => (
              <div key={s.label} style={{ background: '#1E293B', borderRadius: 8, padding: '12px 14px' }}>
                <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: '#475569', marginBottom: 6 }}>{s.label}</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Scroll depth bar */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: '#475569', fontWeight: 600, marginBottom: 6 }}>Scroll depth</div>
            <div style={{ background: '#1E293B', borderRadius: 4, height: 6, overflow: 'hidden' }}>
              <div style={{ width: `${maxScroll}%`, height: '100%', background: 'linear-gradient(90deg, #3B82F6, #8B5CF6)', borderRadius: 4, transition: 'width .6s ease' }} />
            </div>
            <div style={{ fontSize: 11, color: '#475569', marginTop: 4 }}>{maxScroll}% reached</div>
          </div>

          {/* Sections viewed */}
          {analytics?.sectionsViewed?.length > 0 && (
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 11, color: '#475569', fontWeight: 600, marginBottom: 8 }}>Sections viewed</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {analytics.sectionsViewed.map(s => (
                  <span key={s} style={{ fontSize: 11, background: '#1E293B', color: '#94A3B8', borderRadius: 20, padding: '3px 10px' }}>{s}</span>
                ))}
              </div>
            </div>
          )}

          {/* AI outreach */}
          <div style={{ background: '#1E293B', borderRadius: 8, padding: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: outreachDraft ? 10 : 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#64748B' }}>AI Client Outreach Agent</div>
              <button onClick={onGenerateEmail} disabled={outreachLoading} style={{
                fontSize: 11, fontWeight: 700, padding: '5px 12px', borderRadius: 6,
                border: 'none', background: '#3B82F6', color: '#fff', cursor: 'pointer',
              }}>
                {outreachLoading ? '...' : outreachDraft ? '↺ Regenerate' : 'Generate email ↗'}
              </button>
            </div>
            {outreachDraft && (
              <div style={{ fontSize: 12, color: '#94A3B8', lineHeight: 1.7, whiteSpace: 'pre-wrap', marginTop: 10, maxHeight: 180, overflowY: 'auto' }}>
                {outreachDraft}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default function PortalsPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data: allPortals = [], isLoading } = useQuery('portals', portals.list);
  const { data: allClients = [] } = useQuery('clients', () => clients.list());
  const [selectedPortal, setSelectedPortal] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [copied, setCopied] = useState(null);
  const [showPassword, setShowPassword] = useState({});
  const [form, setForm] = useState({ client_id: '', password: '', template_id: 'brand-reveal-v1' });
  const [outreachLoading, setOutreachLoading] = useState(false);
  const [outreachDraft, setOutreachDraft] = useState('');

  const createMutation = useMutation(portals.create, {
    onSuccess: () => { qc.invalidateQueries('portals'); setShowCreate(false); setForm({ client_id: '', password: '', template_id: 'brand-reveal-v1' }); }
  });

  const deleteMutation = useMutation(id => portals.update(id, { status: 'archived' }), {
    onSuccess: () => qc.invalidateQueries('portals'),
  });

  const loadAnalytics = async (portal) => {
    if (selectedPortal?.id === portal.id) { setSelectedPortal(null); setAnalyticsData(null); setOutreachDraft(''); return; }
    setSelectedPortal(portal);
    setAnalyticsLoading(true);
    setOutreachDraft('');
    try {
      const data = await portals.analytics(portal.id);
      setAnalyticsData(data);
    } catch { setAnalyticsData(null); }
    setAnalyticsLoading(false);
  };

  const copyURL = (portal) => {
    navigator.clipboard.writeText(`${PORTAL_URL}/${portal.slug}`).then(() => {
      setCopied(portal.id);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  const sendToClient = (portal) => {
    const url = `${PORTAL_URL}/${portal.slug}`;
    const subject = encodeURIComponent(`Your Brand Reveal is Ready — ${portal.client_name}`);
    const body = encodeURIComponent(`Hi ${portal.client_name},\n\nYour brand presentation is ready to view.\n\nPortal: ${url}\nPresentation code: ${portal.slug}\nPassword: ${portal.plain_password || '(see your notes)'}\n\nLooking forward to your thoughts.\n\nBradley Robert Creative`);
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
  };

  const runOutreachAgent = async (portal) => {
    setOutreachLoading(true);
    setOutreachDraft('');
    try {
      const token = (() => { try { return JSON.parse(localStorage.getItem('envision-auth'))?.state?.token || ''; } catch { return ''; } })();
      const res = await fetch(`${API_URL}/agents/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          agent: 'client-outreach',
          context: {
            agencyName: 'Bradley Robert Creative',
            client: { name: portal.client_name, company: portal.company },
            portalUrl: `${PORTAL_URL}/${portal.slug}`,
            status: analyticsData?.approved ? 'approved' : analyticsData?.revisionRequested ? 'revision' : 'pending',
          }
        })
      });
      const data = await res.json();
      setOutreachDraft(data.result || 'Could not generate draft.');
    } catch (err) {
      setOutreachDraft('Error: ' + err.message);
    }
    setOutreachLoading(false);
  };

  return (
    <div style={{ padding: 32, fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#111827', margin: 0 }}>Client portals</h1>
          <div style={{ fontSize: 13, color: '#9CA3AF', marginTop: 3 }}>
            {allPortals.filter(p => p.status === 'active').length} live · {allPortals.length} total
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => navigate('/portal-editor')} style={{
            padding: '8px 16px', borderRadius: 8, border: '1px solid #E5E7EB', background: '#fff',
            fontSize: 13, fontWeight: 600, color: '#374151', cursor: 'pointer',
          }}>✦ Portal Editor</button>
          <button onClick={() => setShowCreate(true)} style={{
            padding: '8px 16px', borderRadius: 8, border: 'none', background: '#111827',
            fontSize: 13, fontWeight: 600, color: '#fff', cursor: 'pointer',
          }}>+ Generate portal</button>
        </div>
      </div>

      {/* Portal list */}
      {isLoading ? (
        <div style={{ color: '#9CA3AF', fontSize: 13 }}>Loading portals...</div>
      ) : allPortals.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: 12, border: '2px dashed #E5E7EB', padding: 48, textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>✦</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 6 }}>No portals yet</div>
          <div style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 20 }}>Create your first client portal to get started</div>
          <button onClick={() => setShowCreate(true)} style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: '#111827', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>+ Generate portal</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {allPortals.map(portal => (
            <div key={portal.id} style={{ background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB', marginBottom: 10, overflow: 'hidden' }}>
              {/* Portal card row */}
              <div style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
                {/* Avatar */}
                <div style={{
                  width: 40, height: 40, borderRadius: 10, background: portal.status === 'active' ? '#111827' : '#F3F4F6',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 15, fontWeight: 800, color: portal.status === 'active' ? '#fff' : '#9CA3AF', flexShrink: 0,
                }}>
                  {(portal.client_name || portal.slug || '?')[0].toUpperCase()}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 3 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{portal.client_name || portal.slug}</span>
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                      background: STATUS_BG[portal.status] || '#F3F4F6',
                      color: STATUS_COLOR[portal.status] || '#9CA3AF',
                    }}>{portal.status || 'draft'}</span>
                  </div>
                  <div style={{ fontSize: 12, color: '#9CA3AF', display: 'flex', gap: 12 }}>
                    <span>/{portal.slug}</span>
                    {portal.event_count > 0 && <span>{portal.event_count} views</span>}
                    {portal.template_id && <span>{portal.template_id}</span>}
                  </div>
                </div>

                {/* Password */}
                <div style={{ fontSize: 12, color: '#9CA3AF', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ letterSpacing: 2 }}>{showPassword[portal.id] ? (portal.plain_password || '—') : '••••••••'}</span>
                  <button onClick={() => setShowPassword(p => ({ ...p, [portal.id]: !p[portal.id] }))}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: '#9CA3AF' }}>
                    {showPassword[portal.id] ? 'hide' : 'show'}
                  </button>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <button onClick={() => navigate('/portal-editor')} style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #E5E7EB', background: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', color: '#374151' }}>Edit</button>
                  <button onClick={() => sendToClient(portal)} style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #E5E7EB', background: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', color: '#374151' }}>Send ↗</button>
                  <button onClick={() => loadAnalytics(portal)} style={{
                    padding: '6px 12px', borderRadius: 6, border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    background: selectedPortal?.id === portal.id ? '#111827' : '#F3F4F6',
                    color: selectedPortal?.id === portal.id ? '#fff' : '#374151',
                  }}>Analytics</button>
                  <button onClick={() => copyURL(portal)} style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #E5E7EB', background: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', color: copied === portal.id ? '#10B981' : '#374151' }}>
                    {copied === portal.id ? 'Copied!' : 'Copy URL'}
                  </button>
                  <a href={`${PORTAL_URL}/${portal.slug}`} target="_blank" rel="noreferrer" style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #E5E7EB', background: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', color: '#374151', textDecoration: 'none' }}>Open ↗</a>
                </div>
              </div>

              {/* Analytics panel */}
              {selectedPortal?.id === portal.id && (
                <div style={{ padding: '0 20px 20px' }}>
                  <AnalyticsPanel
                    portal={portal}
                    analytics={analyticsData}
                    loading={analyticsLoading}
                    outreachDraft={outreachDraft}
                    outreachLoading={outreachLoading}
                    onGenerateEmail={() => runOutreachAgent(portal)}
                    onClose={() => { setSelectedPortal(null); setAnalyticsData(null); setOutreachDraft(''); }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create Portal Modal */}
      {showCreate && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={e => { if (e.target === e.currentTarget) setShowCreate(false); }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 28, width: 420, boxShadow: '0 20px 60px rgba(0,0,0,.15)' }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#111827', marginBottom: 20 }}>Generate portal</div>

            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5 }}>Client</div>
              <select value={form.client_id} onChange={e => setForm(f => ({ ...f, client_id: e.target.value }))}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 13, background: '#fff', fontFamily: 'Inter, sans-serif' }}>
                <option value="">Select client...</option>
                {allClients.map(c => <option key={c.id} value={c.id}>{c.name}{c.company ? ` — ${c.company}` : ''}</option>)}
              </select>
            </div>

            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5 }}>Password</div>
              <input value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                placeholder="Portal access password"
                style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 13, outline: 'none', boxSizing: 'border-box', fontFamily: 'Inter, sans-serif' }} />
            </div>

            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5 }}>Template</div>
              <select value={form.template_id} onChange={e => setForm(f => ({ ...f, template_id: e.target.value }))}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 13, background: '#fff', fontFamily: 'Inter, sans-serif' }}>
                <option value="brand-reveal-v1">Brand Reveal v1</option>
                <option value="cinematic">Cinematic</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowCreate(false)} style={{ padding: '9px 18px', borderRadius: 8, border: '1px solid #E5E7EB', background: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', color: '#374151' }}>Cancel</button>
              <button onClick={() => createMutation.mutate(form)} disabled={!form.client_id || createMutation.isLoading}
                style={{ padding: '9px 18px', borderRadius: 8, border: 'none', background: '#111827', fontSize: 13, fontWeight: 600, cursor: 'pointer', color: '#fff' }}>
                {createMutation.isLoading ? 'Creating...' : 'Generate portal'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
