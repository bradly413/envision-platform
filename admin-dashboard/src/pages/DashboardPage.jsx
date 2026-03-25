import { useQuery } from 'react-query';
import { analytics, agents, portals as portalsApi, tasks as tasksApi } from '../lib/api';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { data: overview } = useQuery('overview', analytics.overview);
  const { data: portalsData } = useQuery('portals', portalsApi.list);
  const { data: tasksData } = useQuery('tasks', () => tasksApi?.list?.() || Promise.resolve([]));
  const [note, setNote] = useState('');
  const [notes, setNotes] = useState([]);

  const STAGES = { lead: '#6B7280', proposal: '#3B82F6', active: '#10B981', revision: '#F59E0B', delivered: '#8B5CF6' };
  const STATUS_COLORS = { active: '#10B981', draft: '#9CA3AF', expired: '#EF4444' };

  const addNote = () => {
    if (!note.trim()) return;
    setNotes(prev => [{ text: note, ts: new Date().toLocaleTimeString() }, ...prev]);
    setNote('');
  };

  return (
    <div style={{ padding: 32, fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#111827', margin: 0 }}>Dashboard</h1>
        <p style={{ fontSize: 14, color: '#6B7280', margin: '4px 0 0' }}>
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
        </p>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Active clients', value: overview?.clientsByStage?.find(c => c.stage === 'active')?.count || 0, color: '#10B981' },
          { label: 'Open tasks', value: overview?.tasksByStatus?.find(t => t.status === 'todo')?.count || 0, color: '#3B82F6' },
          { label: 'Live portals', value: overview?.portalsByStatus?.find(p => p.status === 'active')?.count || 0, color: '#8B5CF6' },
          { label: 'Pipeline revenue', value: `$${Number(overview?.totalRevenue || 0).toLocaleString()}`, color: '#F59E0B' },
        ].map(stat => (
          <div key={stat.label} style={{ background: '#fff', borderRadius: 12, padding: '20px 24px', border: '1px solid #E5E7EB' }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: '#9CA3AF', marginBottom: 8 }}>{stat.label}</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: stat.color }}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
        {[
          { label: '+ Create portal', to: '/portals' },
          { label: '+ Add client', to: '/pipeline' },
          { label: '+ Add task', to: '/tasks' },
          { label: '→ View pipeline', to: '/pipeline' },
        ].map(({ label, to }) => (
          <button key={label} onClick={() => navigate(to)}
            style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #E5E7EB', background: '#fff', fontSize: 13, fontWeight: 600, color: '#374151', cursor: 'pointer' }}>
            {label}
          </button>
        ))}
      </div>

      {/* Two column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        {/* Portal database */}
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB', padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>Portal database</div>
            <button onClick={() => navigate('/portals')} style={{ fontSize: 12, color: '#6B7280', background: 'none', border: 'none', cursor: 'pointer' }}>View all →</button>
          </div>
          {portalsData?.length ? portalsData.slice(0, 5).map(p => (
            <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #F3F4F6' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{p.slug}</div>
                <div style={{ fontSize: 12, color: '#9CA3AF' }}>{p.client_name || p.company}</div>
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 20, background: p.status === 'active' ? '#D1FAE5' : '#F3F4F6', color: STATUS_COLORS[p.status] || '#6B7280' }}>
                {p.status || 'active'}
              </span>
            </div>
          )) : <div style={{ fontSize: 13, color: '#9CA3AF' }}>No portals yet.</div>}
        </div>

        {/* Open tasks */}
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB', padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>Open tasks</div>
            <button onClick={() => navigate('/tasks')} style={{ fontSize: 12, color: '#6B7280', background: 'none', border: 'none', cursor: 'pointer' }}>View all →</button>
          </div>
          {tasksData?.length ? tasksData.filter(t => t.status !== 'done').slice(0, 5).map(t => (
            <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid #F3F4F6' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: t.priority === 'high' ? '#EF4444' : '#3B82F6', flexShrink: 0 }} />
              <div style={{ fontSize: 13, color: '#111827', flex: 1 }}>{t.title}</div>
            </div>
          )) : <div style={{ fontSize: 13, color: '#9CA3AF', paddingTop: 8 }}>No open tasks</div>}
        </div>
      </div>

      {/* Two column layout row 2 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Pipeline by stage */}
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB', padding: 24 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 16 }}>Pipeline by stage</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {overview?.clientsByStage?.map(({ stage, count }) => (
              <div key={stage} style={{ flex: 1, background: '#F9FAFB', borderRadius: 8, padding: '12px 16px', borderTop: `3px solid ${STAGES[stage] || '#E5E7EB'}` }}>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: '#9CA3AF', marginBottom: 4 }}>{stage}</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#111827' }}>{count}</div>
              </div>
            )) || <div style={{ fontSize: 13, color: '#9CA3AF' }}>No pipeline data</div>}
          </div>
        </div>

        {/* Internal notes */}
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB', padding: 24 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 16 }}>Internal notes</div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <input value={note} onChange={e => setNote(e.target.value)} onKeyDown={e => e.key === 'Enter' && addNote()}
              placeholder="Add a note..." style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 13, outline: 'none' }} />
            <button onClick={addNote} style={{ padding: '8px 16px', background: '#111827', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Add</button>
          </div>
          {notes.length ? notes.map((n, i) => (
            <div key={i} style={{ fontSize: 13, color: '#374151', padding: '8px 0', borderBottom: '1px solid #F3F4F6' }}>
              <span style={{ color: '#9CA3AF', fontSize: 11, marginRight: 8 }}>{n.ts}</span>{n.text}
            </div>
          )) : <div style={{ fontSize: 13, color: '#9CA3AF' }}>No notes yet — add one above</div>}
        </div>
      </div>
    </div>
  );
}
