import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { clients, tasks, agents, portals as portalsApi } from '../lib/api';
import { useState } from 'react';

const STAGE_COLORS = { lead: '#6B7280', proposal: '#3B82F6', active: '#10B981', revision: '#F59E0B', delivered: '#8B5CF6', archived: '#9CA3AF' };
const STAGES = ['lead', 'proposal', 'active', 'revision', 'delivered', 'archived'];
const PRIORITY_COLORS = { high: '#EF4444', medium: '#F59E0B', low: '#6B7280' };

export default function ClientDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: client, isLoading } = useQuery(['client', id], () => clients.get(id));
  const { data: clientTasks = [] } = useQuery(['tasks', id], () => tasks.list({ client_id: id }));
  const { data: allPortals = [] } = useQuery('portals', portalsApi.list);
  const [aiSummary, setAiSummary] = useState('');
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);
  const [taskForm, setTaskForm] = useState({ title: '', priority: 'medium', due_date: '' });
  const [savingTask, setSavingTask] = useState(false);
  const [editNotes, setEditNotes] = useState(false);
  const [notes, setNotes] = useState('');

  const clientPortals = allPortals.filter(p => p.client_id === client?.id || p.client_name === client?.name);

  const updateStage = useMutation(stage => clients.update(id, { stage }), {
    onSuccess: () => qc.invalidateQueries(['client', id]),
  });

  const updateClientNotes = useMutation(n => clients.update(id, { notes: n }), {
    onSuccess: () => { qc.invalidateQueries(['client', id]); setEditNotes(false); },
  });

  const completeTask = useMutation(taskId => tasks.update(taskId, { status: 'done' }), {
    onSuccess: () => qc.invalidateQueries(['tasks', id]),
  });

  const getSummary = async () => {
    setSummaryLoading(true);
    try {
      const result = await agents.run('client-summary', { client, tasks: clientTasks });
      setAiSummary(result.result);
    } catch (e) { setAiSummary('Could not generate summary.'); }
    setSummaryLoading(false);
  };

  const addTask = async () => {
    if (!taskForm.title.trim()) return;
    setSavingTask(true);
    try {
      await tasks.create({ ...taskForm, client_id: id, status: 'todo' });
      qc.invalidateQueries(['tasks', id]);
      setShowAddTask(false);
      setTaskForm({ title: '', priority: 'medium', due_date: '' });
    } catch (e) { console.error(e); }
    setSavingTask(false);
  };

  if (isLoading) return <div style={{ padding: 32, color: '#9CA3AF', fontFamily: 'Inter, sans-serif' }}>Loading...</div>;
  if (!client) return <div style={{ padding: 32, color: '#9CA3AF', fontFamily: 'Inter, sans-serif' }}>Client not found.</div>;

  const openTasks = clientTasks.filter(t => t.status !== 'done');
  const doneTasks = clientTasks.filter(t => t.status === 'done');

  return (
    <div style={{ padding: 32, maxWidth: 1000, fontFamily: 'Inter, sans-serif' }}>
      {/* Breadcrumb */}
      <div style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 16, cursor: 'pointer' }} onClick={() => navigate('/pipeline')}>
        ← Pipeline
      </div>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14, background: '#111827',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20, fontWeight: 800, color: '#fff',
          }}>{(client.name || '?')[0].toUpperCase()}</div>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: '#111827', margin: '0 0 3px' }}>{client.name}</h1>
            <div style={{ fontSize: 14, color: '#6B7280' }}>
              {[client.company, client.email].filter(Boolean).join(' · ')}
            </div>
          </div>
        </div>
        {/* Stage pills */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {STAGES.map(stage => (
            <button key={stage} onClick={() => updateStage.mutate(stage)} style={{
              fontSize: 11, fontWeight: 700, padding: '5px 13px', borderRadius: 20, border: 'none',
              cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '.06em',
              background: client.stage === stage ? STAGE_COLORS[stage] : '#F3F4F6',
              color: client.stage === stage ? '#fff' : '#9CA3AF',
              transition: 'all .1s',
            }}>{stage}</button>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        {/* Details */}
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB', padding: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: '#9CA3AF', marginBottom: 14 }}>Details</div>
          {[
            ['Project type', client.project_type],
            ['Budget', client.budget ? `$${Number(client.budget).toLocaleString()}` : '—'],
            ['Revenue', client.revenue ? `$${Number(client.revenue).toLocaleString()}` : '—'],
            ['Phone', client.phone || '—'],
            ['Email', client.email || '—'],
          ].map(([label, value]) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #F9FAFB', fontSize: 13 }}>
              <span style={{ color: '#9CA3AF' }}>{label}</span>
              <span style={{ color: '#111827', fontWeight: 500 }}>{value}</span>
            </div>
          ))}
          {client.tags?.length > 0 && (
            <div style={{ marginTop: 12, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {client.tags.map(tag => (
                <span key={tag} style={{ fontSize: 11, background: '#F3F4F6', color: '#374151', borderRadius: 20, padding: '3px 10px' }}>{tag}</span>
              ))}
            </div>
          )}
        </div>

        {/* AI Summary */}
        <div style={{ background: '#0F172A', borderRadius: 12, padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: '#475569' }}>AI Summary</div>
            <button onClick={getSummary} disabled={summaryLoading} style={{
              fontSize: 11, fontWeight: 700, padding: '5px 12px', borderRadius: 6,
              border: 'none', background: '#1E293B', color: '#94A3B8', cursor: 'pointer',
            }}>
              {summaryLoading ? '...' : '↺ Generate'}
            </button>
          </div>
          <div style={{ fontSize: 13, color: '#94A3B8', lineHeight: 1.7, whiteSpace: 'pre-wrap', minHeight: 80 }}>
            {aiSummary || 'Generate an AI-powered client summary with one click.'}
          </div>
        </div>
      </div>

      {/* Linked portals */}
      {clientPortals.length > 0 && (
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB', padding: 20, marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: '#9CA3AF', marginBottom: 12 }}>Linked portals</div>
          {clientPortals.map(p => (
            <div key={p.id} onClick={() => navigate('/portals')} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '9px 0', borderBottom: '1px solid #F9FAFB', cursor: 'pointer', fontSize: 13,
            }}>
              <div>
                <span style={{ fontWeight: 600, color: '#111827' }}>{p.slug}</span>
                {p.event_count > 0 && <span style={{ color: '#9CA3AF', marginLeft: 8 }}>{p.event_count} views</span>}
              </div>
              <span style={{
                fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 20,
                background: p.status === 'active' ? '#D1FAE5' : '#F3F4F6',
                color: p.status === 'active' ? '#10B981' : '#9CA3AF',
              }}>{p.status}</span>
            </div>
          ))}
        </div>
      )}

      {/* Tasks */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB', padding: 20, marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: '#9CA3AF' }}>
            Tasks ({openTasks.length} open{doneTasks.length ? `, ${doneTasks.length} done` : ''})
          </div>
          <button onClick={() => setShowAddTask(true)} style={{
            fontSize: 12, fontWeight: 600, padding: '5px 12px', borderRadius: 6,
            border: '1px solid #E5E7EB', background: '#fff', cursor: 'pointer', color: '#374151',
          }}>+ Add task</button>
        </div>

        {clientTasks.length === 0
          ? <div style={{ fontSize: 13, color: '#9CA3AF' }}>No tasks yet.</div>
          : clientTasks.map(task => (
            <div key={task.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 0', borderBottom: '1px solid #F9FAFB', fontSize: 13 }}>
              <div
                onClick={() => task.status !== 'done' && completeTask.mutate(task.id)}
                style={{
                  width: 16, height: 16, borderRadius: 4, border: task.status === 'done' ? 'none' : '2px solid #D1D5DB',
                  background: task.status === 'done' ? '#10B981' : 'transparent',
                  cursor: task.status !== 'done' ? 'pointer' : 'default', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                {task.status === 'done' && <span style={{ color: '#fff', fontSize: 10, fontWeight: 700 }}>✓</span>}
              </div>
              <span style={{ flex: 1, color: task.status === 'done' ? '#9CA3AF' : '#111827', textDecoration: task.status === 'done' ? 'line-through' : 'none' }}>{task.title}</span>
              {task.priority && (
                <span style={{ fontSize: 10, fontWeight: 700, color: PRIORITY_COLORS[task.priority] || '#9CA3AF', textTransform: 'uppercase' }}>{task.priority}</span>
              )}
              {task.due_date && <span style={{ fontSize: 11, color: '#9CA3AF' }}>{new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>}
            </div>
          ))
        }
      </div>

      {/* Notes */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB', padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: '#9CA3AF' }}>Notes</div>
          {!editNotes && (
            <button onClick={() => { setNotes(client.notes || ''); setEditNotes(true); }} style={{
              fontSize: 12, fontWeight: 600, padding: '5px 12px', borderRadius: 6,
              border: '1px solid #E5E7EB', background: '#fff', cursor: 'pointer', color: '#374151',
            }}>Edit</button>
          )}
        </div>
        {editNotes ? (
          <div>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={4}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 13, fontFamily: 'Inter, sans-serif', resize: 'vertical', outline: 'none', boxSizing: 'border-box' }} />
            <div style={{ display: 'flex', gap: 8, marginTop: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setEditNotes(false)} style={{ padding: '7px 14px', borderRadius: 6, border: '1px solid #E5E7EB', background: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', color: '#374151' }}>Cancel</button>
              <button onClick={() => updateClientNotes.mutate(notes)} style={{ padding: '7px 14px', borderRadius: 6, border: 'none', background: '#111827', fontSize: 12, fontWeight: 600, cursor: 'pointer', color: '#fff' }}>Save</button>
            </div>
          </div>
        ) : (
          <div style={{ fontSize: 13, color: client.notes ? '#374151' : '#9CA3AF', lineHeight: 1.7 }}>
            {client.notes || 'No notes yet — click Edit to add notes.'}
          </div>
        )}
      </div>

      {/* Add Task Modal */}
      {showAddTask && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={e => { if (e.target === e.currentTarget) setShowAddTask(false); }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 28, width: 400, boxShadow: '0 20px 60px rgba(0,0,0,.15)' }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#111827', marginBottom: 18 }}>Add task</div>
            <div style={{ marginBottom: 13 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5 }}>Task title *</div>
              <input value={taskForm.title} onChange={e => setTaskForm(f => ({ ...f, title: e.target.value }))}
                placeholder="What needs to be done?" autoFocus
                style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 13, outline: 'none', boxSizing: 'border-box', fontFamily: 'Inter, sans-serif' }} />
            </div>
            <div style={{ display: 'flex', gap: 12, marginBottom: 18 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5 }}>Priority</div>
                <select value={taskForm.priority} onChange={e => setTaskForm(f => ({ ...f, priority: e.target.value }))}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 13, background: '#fff', fontFamily: 'Inter, sans-serif' }}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5 }}>Due date</div>
                <input type="date" value={taskForm.due_date} onChange={e => setTaskForm(f => ({ ...f, due_date: e.target.value }))}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 13, boxSizing: 'border-box', fontFamily: 'Inter, sans-serif' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowAddTask(false)} style={{ padding: '9px 18px', borderRadius: 8, border: '1px solid #E5E7EB', background: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', color: '#374151' }}>Cancel</button>
              <button onClick={addTask} disabled={savingTask} style={{ padding: '9px 18px', borderRadius: 8, border: 'none', background: '#111827', fontSize: 13, fontWeight: 600, cursor: 'pointer', color: '#fff' }}>
                {savingTask ? 'Saving...' : 'Add task'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
