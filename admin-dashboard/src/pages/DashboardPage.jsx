import { useQuery, useMutation, useQueryClient } from 'react-query';
import { analytics, portals as portalsApi, tasks as tasksApi, clients } from '../lib/api';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const STAGE_COLORS = { lead: '#6B7280', proposal: '#3B82F6', active: '#10B981', revision: '#F59E0B', delivered: '#8B5CF6' };
const STATUS_COLORS = { active: '#10B981', draft: '#9CA3AF', expired: '#EF4444' };
const STATUS_BG = { active: '#D1FAE5', draft: '#F3F4F6', expired: '#FEE2E2' };

function StatCard({ label, value, color, sub, onClick }) {
  return (
    <div onClick={onClick} style={{
      background: '#fff', borderRadius: 12, padding: '20px 24px',
      border: '1px solid #E5E7EB', cursor: onClick ? 'pointer' : 'default',
      transition: 'box-shadow .15s, transform .15s',
    }}
      onMouseOver={e => { if (onClick) { e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,.08)'; e.currentTarget.style.transform = 'translateY(-1px)'; } }}
      onMouseOut={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none'; }}>
      <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: '#9CA3AF', marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 30, fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 6 }}>{sub}</div>}
    </div>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: overview } = useQuery('overview', analytics.overview);
  const { data: portalsData = [] } = useQuery('portals', portalsApi.list);
  const { data: tasksData = [] } = useQuery('tasks', () => tasksApi?.list?.() || Promise.resolve([]));
  const { data: allClients = [] } = useQuery('clients', () => clients.list());
  const [note, setNote] = useState('');
  const [notes, setNotes] = useState([]);
  const [showAddClient, setShowAddClient] = useState(false);
  const [clientForm, setClientForm] = useState({ name: '', company: '', email: '', stage: 'lead', budget: '' });
  const [saving, setSaving] = useState(false);

  const activeClients = overview?.clientsByStage?.find(c => c.stage === 'active')?.count
    ?? allClients.filter(c => c.stage === 'active').length;
  const openTasks = overview?.tasksByStatus?.find(t => t.status === 'todo')?.count
    ?? tasksData.filter(t => t.status === 'todo').length;
  const livePortals = overview?.portalsByStatus?.find(p => p.status === 'active')?.count
    ?? portalsData.filter(p => p.status === 'active').length;
  const revenue = Number(overview?.totalRevenue || allClients.reduce((s, c) => s + Number(c.revenue || 0), 0));

  const clientsByStage = overview?.clientsByStage?.length
    ? overview.clientsByStage
    : Object.entries(
        allClients.reduce((acc, c) => { acc[c.stage] = (acc[c.stage] || 0) + 1; return acc; }, {})
      ).map(([stage, count]) => ({ stage, count }));

  // Recent portal activity feed
  const recentPortals = [...portalsData]
    .sort((a, b) => new Date(b.updated_at || 0) - new Date(a.updated_at || 0))
    .slice(0, 6);

  const addNote = () => {
    if (!note.trim()) return;
    setNotes(prev => [{ text: note, ts: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }, ...prev]);
    setNote('');
  };

  const saveClient = async () => {
    if (!clientForm.name.trim()) return;
    setSaving(true);
    try {
      await clients.create({ ...clientForm, budget: clientForm.budget ? Number(clientForm.budget) : null });
      qc.invalidateQueries('clients');
      qc.invalidateQueries('overview');
      setShowAddClient(false);
      setClientForm({ name: '', company: '', email: '', stage: 'lead', budget: '' });
    } catch (e) { console.error(e); }
    setSaving(false);
  };

  return (
    <div style={{ padding: 32, fontFamily: 'Inter, sans-serif', maxWidth: 1200 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#111827', margin: 0 }}>Dashboard</h1>
          <p style={{ fontSize: 13, color: '#9CA3AF', margin: '3px 0 0' }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setShowAddClient(true)} style={{
            padding: '8px 16px', borderRadius: 8, border: '1px solid #E5E7EB', background: '#fff',
            fontSize: 13, fontWeight: 600, color: '#374151', cursor: 'pointer',
          }}>+ Add client</button>
          <button onClick={() => navigate('/portals')} style={{
            padding: '8px 16px', borderRadius: 8, border: 'none', background: '#111827',
            fontSize: 13, fontWeight: 600, color: '#fff', cursor: 'pointer',
          }}>+ Create portal</button>
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
        <StatCard label="Active clients" value={activeClients} color="#10B981" sub={`${allClients.length} total`} onClick={() => navigate('/pipeline')} />
        <StatCard label="Open tasks" value={openTasks} color="#3B82F6" sub={tasksData.length ? `${tasksData.filter(t=>t.status==='done').length} done` : null} onClick={() => navigate('/tasks')} />
        <StatCard label="Live portals" value={livePortals} color="#8B5CF6" sub={`${portalsData.length} total`} onClick={() => navigate('/portals')} />
        <StatCard label="Pipeline revenue" value={`$${revenue.toLocaleString()}`} color="#F59E0B" sub="all stages" onClick={() => navigate('/pipeline')} />
      </div>

      {/* Main grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16, marginBottom: 16 }}>
        {/* Portal activity feed */}
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB', padding: 22 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>Client portals</div>
            <button onClick={() => navigate('/portals')} style={{ fontSize: 12, color: '#6B7280', background: 'none', border: 'none', cursor: 'pointer' }}>View all →</button>
          </div>
          {recentPortals.length ? recentPortals.map(p => (
            <div key={p.id} onClick={() => navigate('/portals')} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '10px 0', borderBottom: '1px solid #F9FAFB', cursor: 'pointer',
            }}
              onMouseOver={e => e.currentTarget.style.background = '#FAFAFA'}
              onMouseOut={e => e.currentTarget.style.background = 'none'}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8, background: '#F3F4F6',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 700, color: '#6B7280', flexShrink: 0,
                }}>
                  {(p.client_name || p.slug || '?')[0].toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{p.client_name || p.slug}</div>
                  <div style={{ fontSize: 11, color: '#9CA3AF' }}>{p.slug} · {p.event_count || 0} views</div>
                </div>
              </div>
              <span style={{
                fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 20,
                background: STATUS_BG[p.status] || '#F3F4F6',
                color: STATUS_COLORS[p.status] || '#6B7280',
              }}>{p.status || 'draft'}</span>
            </div>
          )) : <div style={{ fontSize: 13, color: '#9CA3AF', paddingTop: 8 }}>No portals yet — <span onClick={() => navigate('/portals')} style={{ color: '#111827', cursor: 'pointer', fontWeight: 600 }}>create one</span></div>}
        </div>

        {/* Open tasks */}
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB', padding: 22 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>Open tasks</div>
            <button onClick={() => navigate('/tasks')} style={{ fontSize: 12, color: '#6B7280', background: 'none', border: 'none', cursor: 'pointer' }}>View all →</button>
          </div>
          {tasksData.filter(t => t.status !== 'done').slice(0, 6).length ? tasksData.filter(t => t.status !== 'done').slice(0, 6).map(t => (
            <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: '1px solid #F9FAFB' }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: t.priority === 'high' ? '#EF4444' : t.priority === 'medium' ? '#F59E0B' : '#3B82F6', flexShrink: 0 }} />
              <div style={{ fontSize: 13, color: '#111827', flex: 1 }}>{t.title}</div>
              {t.due_date && <div style={{ fontSize: 11, color: '#9CA3AF' }}>{new Date(t.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>}
            </div>
          )) : <div style={{ fontSize: 13, color: '#9CA3AF', paddingTop: 8 }}>No open tasks</div>}
        </div>
      </div>

      {/* Bottom grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Pipeline by stage */}
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB', padding: 22 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>Pipeline by stage</div>
            <button onClick={() => navigate('/pipeline')} style={{ fontSize: 12, color: '#6B7280', background: 'none', border: 'none', cursor: 'pointer' }}>View pipeline →</button>
          </div>
          {clientsByStage.length ? (
            <div style={{ display: 'flex', gap: 8 }}>
              {clientsByStage.map(({ stage, count }) => (
                <div key={stage} onClick={() => navigate('/pipeline')} style={{
                  flex: 1, background: '#F9FAFB', borderRadius: 8, padding: '12px 14px',
                  borderTop: `3px solid ${STAGE_COLORS[stage] || '#E5E7EB'}`, cursor: 'pointer',
                  transition: 'box-shadow .15s',
                }}
                  onMouseOver={e => e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,.06)'}
                  onMouseOut={e => e.currentTarget.style.boxShadow = 'none'}>
                  <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: '#9CA3AF', marginBottom: 4 }}>{stage}</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: '#111827' }}>{count}</div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: 13, color: '#9CA3AF' }}>No clients yet — <span onClick={() => setShowAddClient(true)} style={{ color: '#111827', fontWeight: 600, cursor: 'pointer' }}>add one</span></div>
          )}
        </div>

        {/* Internal notes */}
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB', padding: 22 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 14 }}>Internal notes</div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <input value={note} onChange={e => setNote(e.target.value)} onKeyDown={e => e.key === 'Enter' && addNote()}
              placeholder="Add a note..." style={{
                flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid #E5E7EB',
                fontSize: 13, outline: 'none', fontFamily: 'Inter, sans-serif',
              }} />
            <button onClick={addNote} style={{
              padding: '8px 16px', background: '#111827', color: '#fff', border: 'none',
              borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}>Add</button>
          </div>
          <div style={{ maxHeight: 140, overflowY: 'auto' }}>
            {notes.length ? notes.map((n, i) => (
              <div key={i} style={{ fontSize: 13, color: '#374151', padding: '7px 0', borderBottom: '1px solid #F9FAFB' }}>
                <span style={{ color: '#9CA3AF', fontSize: 11, marginRight: 8 }}>{n.ts}</span>{n.text}
              </div>
            )) : <div style={{ fontSize: 13, color: '#9CA3AF' }}>No notes yet — add one above</div>}
          </div>
        </div>
      </div>

      {/* Add Client Modal */}
      {showAddClient && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }} onClick={e => { if (e.target === e.currentTarget) setShowAddClient(false); }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 28, width: 440, boxShadow: '0 20px 60px rgba(0,0,0,.15)' }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#111827', marginBottom: 20 }}>Add client</div>
            {[
              { key: 'name', label: 'Name *', placeholder: 'e.g. Sarah Johnson' },
              { key: 'company', label: 'Company', placeholder: 'e.g. Jazz Club St. Louis' },
              { key: 'email', label: 'Email', placeholder: 'sarah@example.com' },
              { key: 'budget', label: 'Budget ($)', placeholder: '5000' },
            ].map(({ key, label, placeholder }) => (
              <div key={key} style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>{label}</div>
                <input
                  value={clientForm[key]} onChange={e => setClientForm(f => ({ ...f, [key]: e.target.value }))}
                  placeholder={placeholder}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 13, outline: 'none', boxSizing: 'border-box', fontFamily: 'Inter, sans-serif' }} />
              </div>
            ))}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Stage</div>
              <select value={clientForm.stage} onChange={e => setClientForm(f => ({ ...f, stage: e.target.value }))}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 13, background: '#fff', fontFamily: 'Inter, sans-serif' }}>
                {['lead','proposal','active','revision','delivered'].map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowAddClient(false)} style={{ padding: '9px 18px', borderRadius: 8, border: '1px solid #E5E7EB', background: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', color: '#374151' }}>Cancel</button>
              <button onClick={saveClient} disabled={saving} style={{ padding: '9px 18px', borderRadius: 8, border: 'none', background: '#111827', fontSize: 13, fontWeight: 600, cursor: 'pointer', color: '#fff' }}>
                {saving ? 'Saving...' : 'Add client'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
