import { useQuery, useMutation, useQueryClient } from 'react-query';
import { portals, clients, agents } from '../lib/api';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const PORTAL_URL = import.meta.env.VITE_PORTAL_URL || 'https://envision-portal.netlify.app';
const STATUS_COLOR = { draft: '#9CA3AF', active: '#10B981', expired: '#EF4444', archived: '#6B7280' };
const STATUS_BG = { draft: '#F3F4F6', active: '#D1FAE5', expired: '#FEE2E2', archived: '#F3F4F6' };

function EyeIcon({ visible }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M2 12C4.8 7.8 8.13 5.7 12 5.7C15.87 5.7 19.2 7.8 22 12C19.2 16.2 15.87 18.3 12 18.3C8.13 18.3 4.8 16.2 2 12Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="3.2" stroke="currentColor" strokeWidth="1.8" />
      {visible ? null : (
        <path
          d="M4 20L20 4"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </svg>
  );
}

function formatTemplateLabel(templateId) {
  if (!templateId) return 'Custom';
  return templateId
    .split('/')
    .pop()
    .replace(/\.[a-z0-9]+$/i, '')
    .replace(/[-_]+/g, ' ')
    .trim();
}

function AnalyticsPanel({ portal, analytics, loading, outreachDraft, outreachLoading, onGenerateEmail, onClose }) {
  if (!portal) return null;

  const rawAvgSession = analytics?.avgSessionMinutes ?? analytics?.avgSessionMs ?? analytics?.avgSession ?? 0;
  const avgSessionMin = analytics?.avgSessionMinutes !== undefined
    ? Math.round(Number(rawAvgSession) || 0)
    : Number(rawAvgSession) > 1000
      ? Math.round(Number(rawAvgSession) / 60000)
      : Math.round(Number(rawAvgSession) || 0);
  const maxScroll = Math.min(100, Number(analytics?.maxScrollDepth ?? analytics?.maxScroll ?? 0));

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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10, marginBottom: 18 }}>
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: outreachDraft ? 10 : 0 }}>
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
  const [viewportWidth, setViewportWidth] = useState(() => (typeof window === 'undefined' ? 1440 : window.innerWidth));
  const [selectedPortal, setSelectedPortal] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [copied, setCopied] = useState(null);
  const [showPassword, setShowPassword] = useState({});
  const [form, setForm] = useState({ client_id: '', password: '', template_id: 'brand-reveal-v1' });
  const [outreachLoading, setOutreachLoading] = useState(false);
  const [outreachDraft, setOutreachDraft] = useState('');
  const [showNewClient, setShowNewClient] = useState(false);
  const [newClientForm, setNewClientForm] = useState({ name: '', company: '', email: '' });
  const [savingClient, setSavingClient] = useState(false);

  useEffect(() => {
    const handleResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const createMutation = useMutation(portals.create, {
    onSuccess: () => { qc.invalidateQueries('portals'); setShowCreate(false); setForm({ client_id: '', password: '', template_id: 'brand-reveal-v1' }); setShowNewClient(false); }
  });

  const canGeneratePortal = Boolean(form.client_id) && !createMutation.isLoading && !savingClient;

  const createNewClient = async () => {
    if (!newClientForm.name.trim()) return;
    setSavingClient(true);
    try {
      const payload = {
        ...newClientForm,
        name: newClientForm.name.trim(),
        company: newClientForm.company.trim() || null,
        email: newClientForm.email.trim() || null,
        stage: 'lead',
      };
      const created = await clients.create(payload);
      qc.invalidateQueries('clients');
      let newId = created?.id || created?.client?.id || '';
      if (!newId) {
        const refreshedClients = await qc.fetchQuery('clients', () => clients.list());
        const matchedClient = (refreshedClients || []).find((client) => {
          if (payload.email && client.email && client.email === payload.email) return true;
          return client.name === payload.name && (client.company || '') === (payload.company || '');
        });
        newId = matchedClient?.id || '';
      }
      if (newId) setForm(f => ({ ...f, client_id: newId }));
      setShowNewClient(false);
      setNewClientForm({ name: '', company: '', email: '' });
    } catch (e) { console.error(e); }
    setSavingClient(false);
  };

  const deleteMutation = useMutation(id => portals.update(id, { status: 'archived' }), {
    onSuccess: () => qc.invalidateQueries('portals'),
  });

  const statusMutation = useMutation(({ id, status }) => portals.update(id, { status }), {
    onSuccess: () => qc.invalidateQueries('portals'),
  });

  const [openMenu, setOpenMenu] = useState(null);
  const isMobile = viewportWidth < 768;
  const isTablet = viewportWidth < 1024;
  const isDesktopCompact = viewportWidth < 1440;

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
      const data = await agents.run('client-outreach', {
        agencyName: 'Bradley Robert Creative',
        client: { name: portal.client_name, company: portal.company },
        portalUrl: `${PORTAL_URL}/${portal.slug}`,
        status: analyticsData?.approved ? 'approved' : analyticsData?.revisionRequested ? 'revision' : 'pending',
        approvedAt: analyticsData?.approvedAt || null,
        revisionNotes: analyticsData?.revisionNotes || null,
      });
      setOutreachDraft(data.result || 'Could not generate draft.');
    } catch {
      setOutreachDraft('Could not generate draft.');
    }
    setOutreachLoading(false);
  };

  return (
    <div
      style={{ padding: isMobile ? 16 : isTablet ? 24 : 32, fontFamily: 'Inter, sans-serif' }}
      onClick={() => setOpenMenu(null)}
    >
      <div style={{ maxWidth: 1440, margin: '0 auto' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 16,
          flexWrap: 'wrap',
          marginBottom: 24,
        }}
      >
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#111827', margin: 0 }}>Client portals</h1>
          <div style={{ fontSize: 13, color: '#9CA3AF', marginTop: 3 }}>
            {allPortals.filter(p => p.status === 'active').length} live · {allPortals.length} total
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: isMobile ? 'stretch' : 'flex-end', width: isMobile ? '100%' : 'auto' }}>
          <button onClick={() => navigate('/portal-editor')} style={{
            padding: '8px 16px', borderRadius: 8, border: '1px solid #DBEAFE', background: '#EFF6FF',
            fontSize: 13, fontWeight: 700, color: '#1D4ED8', cursor: 'pointer',
            width: isMobile ? 'calc(50% - 4px)' : 'auto',
          }}>◎ Experience Builder</button>
          <button onClick={() => setShowCreate(true)} style={{
            padding: '8px 16px', borderRadius: 8, border: 'none', background: '#111827',
            fontSize: 13, fontWeight: 600, color: '#fff', cursor: 'pointer',
            width: isMobile ? '100%' : 'auto',
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
            <div key={portal.id} style={{ background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB', marginBottom: 10, position: 'relative' }}>
              {/* Portal card row */}
              <div style={{ padding: isMobile ? 16 : 20, overflow: 'visible' }}>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: isTablet ? '1fr' : isDesktopCompact ? 'minmax(0, 1fr) auto' : 'minmax(0, 1fr) auto auto',
                    gap: 14,
                    alignItems: 'start',
                    marginBottom: 14,
                  }}
                >
                  <div style={{ display: 'flex', gap: 14, minWidth: 0 }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: 12, background: portal.status === 'active' ? '#111827' : '#F3F4F6',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 16, fontWeight: 800, color: portal.status === 'active' ? '#fff' : '#9CA3AF', flexShrink: 0,
                    }}>
                      {(portal.client_name || portal.slug || '?')[0].toUpperCase()}
                    </div>

                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 5 }}>
                        <span style={{ fontSize: 15, fontWeight: 700, color: '#111827', minWidth: 0 }}>
                          {portal.client_name || portal.slug}
                        </span>
                        <span style={{
                          fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 999,
                          background: STATUS_BG[portal.status] || '#F3F4F6',
                          color: STATUS_COLOR[portal.status] || '#9CA3AF',
                        }}>
                          {portal.status || 'draft'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 10px', fontSize: 12, color: '#9CA3AF' }}>
                        <span style={{ color: '#6B7280', fontWeight: 600 }}>/{portal.slug}</span>
                        <span>ID {portal.id}</span>
                        {portal.event_count > 0 ? <span>{portal.event_count} views</span> : null}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: isTablet ? 'flex-start' : 'flex-end', alignItems: 'center' }}>
                    <span
                      title={portal.template_id}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        maxWidth: isMobile ? '100%' : 220,
                        padding: '7px 11px',
                        borderRadius: 999,
                        background: '#F8FAFC',
                        border: '1px solid #E5E7EB',
                        fontSize: 11,
                        fontWeight: 700,
                        color: '#475569',
                        textTransform: 'uppercase',
                        letterSpacing: '.06em',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {formatTemplateLabel(portal.template_id)}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: isTablet ? 'flex-start' : 'flex-end', alignItems: 'center' }}>
                    <div style={{ fontSize: 12, color: '#9CA3AF', display: 'inline-flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                      <span style={{ letterSpacing: 2, fontWeight: 600, color: '#6B7280' }}>
                        {showPassword[portal.id] ? (portal.plain_password || '—') : '••••••••'}
                      </span>
                      <button
                        onClick={() => setShowPassword(p => ({ ...p, [portal.id]: !p[portal.id] }))}
                        title={showPassword[portal.id] ? 'Hide password' : 'Show password'}
                        aria-label={showPassword[portal.id] ? 'Hide password' : 'Show password'}
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 999,
                          border: '1px solid #E5E7EB',
                          background: '#fff',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          color: '#6B7280',
                          flexShrink: 0,
                        }}
                      >
                        <EyeIcon visible={Boolean(showPassword[portal.id])} />
                      </button>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                  {/* Status toggle */}
                  <button onClick={() => statusMutation.mutate({ id: portal.id, status: portal.status === 'active' ? 'draft' : 'active' })}
                    style={{ padding: '8px 12px', borderRadius: 8, border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                      background: portal.status === 'active' ? '#D1FAE5' : '#FEF3C7',
                      color: portal.status === 'active' ? '#065F46' : '#92400E',
                      width: isMobile ? 'calc(50% - 4px)' : 'auto',
                    }}>
                    {portal.status === 'active' ? '● Active' : '○ Set Active'}
                  </button>
                  <button onClick={() => navigate('/portal-editor')} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #E5E7EB', background: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', color: '#374151', width: isMobile ? 'calc(50% - 4px)' : 'auto' }}>Builder</button>
                  <button onClick={() => sendToClient(portal)} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #E5E7EB', background: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', color: '#374151', width: isMobile ? 'calc(50% - 4px)' : 'auto' }}>Send ↗</button>
                  <button onClick={() => loadAnalytics(portal)} style={{
                    padding: '8px 12px', borderRadius: 8, border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    background: selectedPortal?.id === portal.id ? '#111827' : '#F3F4F6',
                    color: selectedPortal?.id === portal.id ? '#fff' : '#374151',
                    width: isMobile ? 'calc(50% - 4px)' : 'auto',
                  }}>Analytics</button>
                  <button onClick={() => copyURL(portal)} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #E5E7EB', background: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', color: copied === portal.id ? '#10B981' : '#374151', width: isMobile ? 'calc(50% - 4px)' : 'auto' }}>
                    {copied === portal.id ? 'Copied!' : 'Copy URL'}
                  </button>
                  <a href={`${PORTAL_URL}/${portal.slug}`} target="_blank" rel="noreferrer" style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #E5E7EB', background: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', color: '#374151', textDecoration: 'none', width: isMobile ? 'calc(50% - 4px)' : 'auto', textAlign: 'center' }}>Open ↗</a>

                  {/* ⋯ menu */}
                  <div style={{ position: 'relative', marginLeft: isMobile ? 0 : 'auto' }}>
                    <button onClick={(e) => { e.stopPropagation(); setOpenMenu(openMenu === portal.id ? null : portal.id); }}
                      style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #E5E7EB', background: '#fff', fontSize: 16, cursor: 'pointer', color: '#6B7280', lineHeight: 1, minWidth: 42 }}>
                      ···
                    </button>
                    {openMenu === portal.id && (
                      <div onClick={e => e.stopPropagation()} style={{ position: 'absolute', right: 0, top: '100%', marginTop: 4, background: '#fff', border: '1px solid #E5E7EB', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,.12)', zIndex: 100, minWidth: 160, overflow: 'hidden' }}>
                        <button onClick={() => { statusMutation.mutate({ id: portal.id, status: portal.status === 'active' ? 'draft' : 'active' }); setOpenMenu(null); }}
                          style={{ width: '100%', padding: '10px 16px', border: 'none', background: 'none', fontSize: 13, cursor: 'pointer', textAlign: 'left', color: '#374151', display: 'block' }}
                          onMouseOver={e => e.currentTarget.style.background = '#F9FAFB'}
                          onMouseOut={e => e.currentTarget.style.background = 'none'}>
                          {portal.status === 'active' ? '○ Set as Draft' : '● Set as Active'}
                        </button>
                        <button onClick={() => { copyURL(portal); setOpenMenu(null); }}
                          style={{ width: '100%', padding: '10px 16px', border: 'none', background: 'none', fontSize: 13, cursor: 'pointer', textAlign: 'left', color: '#374151', display: 'block' }}
                          onMouseOver={e => e.currentTarget.style.background = '#F9FAFB'}
                          onMouseOut={e => e.currentTarget.style.background = 'none'}>
                          Copy URL
                        </button>
                        <div style={{ height: 1, background: '#F3F4F6', margin: '4px 0' }} />
                        <button onClick={() => { if (window.confirm('Archive this portal? It will be hidden from the list.')) { deleteMutation.mutate(portal.id); setOpenMenu(null); } }}
                          style={{ width: '100%', padding: '10px 16px', border: 'none', background: 'none', fontSize: 13, cursor: 'pointer', textAlign: 'left', color: '#F59E0B', display: 'block' }}
                          onMouseOver={e => e.currentTarget.style.background = '#FFFBEB'}
                          onMouseOut={e => e.currentTarget.style.background = 'none'}>
                          Archive portal
                        </button>
                      </div>
                    )}
                  </div>
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
          onClick={e => { if (e.target === e.currentTarget) { setShowCreate(false); setShowNewClient(false); } }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 28, width: 'min(440px, calc(100vw - 32px))', boxShadow: '0 20px 60px rgba(0,0,0,.15)' }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#111827', marginBottom: 20 }}>Generate portal</div>

            {/* Client selector */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>Client</div>
                <button onClick={() => setShowNewClient(v => !v)} style={{ fontSize: 11, fontWeight: 600, color: '#3B82F6', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                  {showNewClient ? '← Back to list' : '+ New client'}
                </button>
              </div>

              {!showNewClient ? (
                <select value={form.client_id} onChange={e => setForm(f => ({ ...f, client_id: e.target.value }))}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 13, background: '#fff', fontFamily: 'Inter, sans-serif' }}>
                  <option value="">Select client...</option>
                  {allClients.map(c => <option key={c.id} value={c.id}>{c.name}{c.company ? ` — ${c.company}` : ''}</option>)}
                </select>
              ) : (
                <div style={{ background: '#F9FAFB', borderRadius: 10, padding: 14, border: '1px solid #E5E7EB' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 10 }}>New client</div>
                  {[
                    { key: 'name', placeholder: 'Full name *', autoFocus: true },
                    { key: 'company', placeholder: 'Company' },
                    { key: 'email', placeholder: 'Email' },
                  ].map(({ key, placeholder, autoFocus }) => (
                    <input key={key} value={newClientForm[key]} onChange={e => setNewClientForm(f => ({ ...f, [key]: e.target.value }))}
                      placeholder={placeholder} autoFocus={autoFocus}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: 7, border: '1px solid #E5E7EB', fontSize: 12, outline: 'none', boxSizing: 'border-box', fontFamily: 'Inter, sans-serif', marginBottom: 8 }} />
                  ))}
                  <button onClick={createNewClient} disabled={!newClientForm.name.trim() || savingClient}
                    style={{ width: '100%', padding: '8px 0', borderRadius: 7, border: 'none', background: newClientForm.name.trim() ? '#111827' : '#E5E7EB', color: newClientForm.name.trim() ? '#fff' : '#9CA3AF', fontSize: 12, fontWeight: 700, cursor: newClientForm.name.trim() ? 'pointer' : 'default' }}>
                    {savingClient ? 'Creating...' : 'Create client & continue'}
                  </button>
                  <div style={{ fontSize: 11, color: '#6B7280', marginTop: 8, lineHeight: 1.5 }}>
                    Step 1: create the client. Step 2: generate the portal once that client is selected.
                  </div>
                </div>
              )}
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
              <button onClick={() => { setShowCreate(false); setShowNewClient(false); }} style={{ padding: '9px 18px', borderRadius: 8, border: '1px solid #E5E7EB', background: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', color: '#374151' }}>Cancel</button>
              <button onClick={() => createMutation.mutate(form)} disabled={!canGeneratePortal}
                style={{ padding: '9px 18px', borderRadius: 8, border: 'none', background: canGeneratePortal ? '#111827' : '#E5E7EB', fontSize: 13, fontWeight: 600, cursor: canGeneratePortal ? 'pointer' : 'default', color: canGeneratePortal ? '#fff' : '#9CA3AF' }}>
                {createMutation.isLoading ? 'Creating...' : 'Generate portal'}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
