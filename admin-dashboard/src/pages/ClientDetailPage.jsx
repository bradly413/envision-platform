import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useParams } from 'react-router-dom';
import { clients, tasks, agents } from '../lib/api';
import { useState } from 'react';

const STAGE_COLORS = { lead: '#9CA3AF', proposal: '#3B82F6', active: '#10B981', revision: '#F59E0B', delivered: '#8B5CF6', archived: '#6B7280' };
const STAGES = ['lead', 'proposal', 'active', 'revision', 'delivered', 'archived'];

export default function ClientDetailPage() {
  const { id } = useParams();
  const qc = useQueryClient();
  const { data: client } = useQuery(['client', id], () => clients.get(id));
  const { data: clientTasks = [] } = useQuery(['tasks', id], () => tasks.list({ client_id: id }));
  const [aiSummary, setAiSummary] = useState('');
  const [summaryLoading, setSummaryLoading] = useState(false);

  const updateStage = useMutation(stage => clients.update(id, { stage }), { onSuccess: () => qc.invalidateQueries(['client', id]) });

  const getSummary = async () => {
    setSummaryLoading(true);
    try {
      const result = await agents.run('client-summary', { client, tasks: clientTasks });
      setAiSummary(result.result);
    } finally { setSummaryLoading(false); }
  };

  if (!client) return <div style={{ padding: 32, color: '#6B7280' }}>Loading...</div>;

  return (
    <div style={{ padding: 32, maxWidth: 960, fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#111827', margin: '0 0 4px' }}>{client.name}</h1>
          <div style={{ fontSize: 15, color: '#6B7280' }}>{client.company} · {client.email}</div>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {STAGES.map(stage => (
            <button key={stage} onClick={() => updateStage.mutate(stage)}
              style={{ fontSize: 11, fontWeight: 700, padding: '5px 12px', borderRadius: 20, border: 'none', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '.06em',
                background: client.stage === stage ? STAGE_COLORS[stage] : '#F3F4F6',
                color: client.stage === stage ? '#fff' : '#9CA3AF' }}>
              {stage}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        {/* Client info */}
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB', padding: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: '#9CA3AF', marginBottom: 16 }}>Details</div>
          {[
            ['Project type', client.project_type],
            ['Budget', client.budget ? `$${Number(client.budget).toLocaleString()}` : '—'],
            ['Revenue', client.revenue ? `$${Number(client.revenue).toLocaleString()}` : '—'],
            ['Phone', client.phone || '—'],
          ].map(([label, value]) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #F3F4F6', fontSize: 13 }}>
              <span style={{ color: '#6B7280' }}>{label}</span>
              <span style={{ color: '#111827', fontWeight: 500 }}>{value}</span>
            </div>
          ))}
          {client.tags?.length > 0 && (
            <div style={{ marginTop: 12, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {client.tags.map(tag => <span key={tag} style={{ fontSize: 11, background: '#F3F4F6', color: '#374151', borderRadius: 20, padding: '3px 10px' }}>{tag}</span>)}
            </div>
          )}
        </div>

        {/* AI Summary */}
        <div style={{ background: '#111827', borderRadius: 12, padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: '#6B7280' }}>AI Summary</div>
            <button onClick={getSummary} disabled={summaryLoading} style={{ fontSize: 11, fontWeight: 700, padding: '5px 12px', borderRadius: 6, border: 'none', background: '#374151', color: '#F9FAFB', cursor: 'pointer' }}>
              {summaryLoading ? '...' : 'Generate ↺'}
            </button>
          </div>
          <div style={{ fontSize: 13, color: '#9CA3AF', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
            {aiSummary || 'Click generate for an AI-powered client summary.'}
          </div>
        </div>
      </div>

      {/* Tasks */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB', padding: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: '#9CA3AF', marginBottom: 14 }}>Tasks ({clientTasks.filter(t => t.status !== 'done').length} open)</div>
        {clientTasks.length === 0
          ? <div style={{ fontSize: 13, color: '#9CA3AF' }}>No tasks yet.</div>
          : clientTasks.map(task => (
            <div key={task.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 0', borderBottom: '1px solid #F3F4F6', fontSize: 13 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: task.status === 'done' ? '#D1D5DB' : '#10B981', flexShrink: 0 }} />
              <span style={{ flex: 1, color: task.status === 'done' ? '#9CA3AF' : '#111827', textDecoration: task.status === 'done' ? 'line-through' : 'none' }}>{task.title}</span>
              {task.due_date && <span style={{ fontSize: 11, color: '#9CA3AF' }}>{new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>}
            </div>
          ))
        }
      </div>

      {client.notes && (
        <div style={{ background: '#FFFBEB', borderRadius: 12, border: '1px solid #FDE68A', padding: 20, marginTop: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: '#92400E', marginBottom: 8 }}>Notes</div>
          <div style={{ fontSize: 14, color: '#78350F', lineHeight: 1.7 }}>{client.notes}</div>
        </div>
      )}
    </div>
  );
}
