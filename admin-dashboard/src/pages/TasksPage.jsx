import { useQuery, useMutation, useQueryClient } from 'react-query';
import { tasks, clients } from '../lib/api';
import { useState } from 'react';

const PRIORITY_COLORS = { high: '#EF4444', medium: '#F59E0B', low: '#9CA3AF' };
const PRIORITY_BG = { high: '#FEE2E2', medium: '#FEF3C7', low: '#F3F4F6' };
const STATUS_LABELS = { todo: 'To do', in_progress: 'In progress', done: 'Done' };
const STATUS_COLORS = {
  todo: { color: '#6B7280', background: '#F3F4F6' },
  in_progress: { color: '#2563EB', background: '#DBEAFE' },
  done: { color: '#059669', background: '#D1FAE5' },
};

export default function TasksPage() {
  const qc = useQueryClient();
  const { data: allTasks = [] } = useQuery('tasks', () => tasks.list());
  const { data: allClients = [] } = useQuery('clients', () => clients.list());
  const [filter, setFilter] = useState('todo');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ title: '', priority: 'medium', status: 'todo', due_date: '', client_id: '' });
  const [saving, setSaving] = useState(false);

  const completeMutation = useMutation(id => tasks.update(id, { status: 'done' }), {
    onSuccess: () => qc.invalidateQueries('tasks'),
  });

  const reopenMutation = useMutation(id => tasks.update(id, { status: 'todo' }), {
    onSuccess: () => qc.invalidateQueries('tasks'),
  });

  const updateStatusMutation = useMutation(({ id, status }) => tasks.update(id, { status }), {
    onSuccess: () => qc.invalidateQueries('tasks'),
  });

  const addTask = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      await tasks.create({ ...form, client_id: form.client_id || null });
      qc.invalidateQueries('tasks');
      setShowAdd(false);
      setForm({ title: '', priority: 'medium', status: 'todo', due_date: '', client_id: '' });
    } catch (e) { console.error(e); }
    setSaving(false);
  };

  const toggleWorkingStatus = (task) => {
    if (task.status === 'done') {
      reopenMutation.mutate(task.id);
      return;
    }

    updateStatusMutation.mutate({
      id: task.id,
      status: task.status === 'in_progress' ? 'todo' : 'in_progress',
    });
  };

  const filtered = filter === 'all' ? allTasks : allTasks.filter(t => t.status === filter);
  const getClientName = (id) => allClients.find(c => c.id === id)?.name || null;
  const openCount = allTasks.filter(t => t.status !== 'done').length;

  const counts = {
    todo: allTasks.filter(t => t.status === 'todo').length,
    'in_progress': allTasks.filter(t => t.status === 'in_progress').length,
    done: allTasks.filter(t => t.status === 'done').length,
  };

  return (
    <div style={{ padding: 32, fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#111827', margin: 0 }}>Tasks</h1>
          <div style={{ fontSize: 13, color: '#9CA3AF', marginTop: 3 }}>
            {openCount} open · {counts.done} done
          </div>
        </div>
        <button onClick={() => setShowAdd(true)} style={{
          padding: '8px 18px', borderRadius: 8, border: 'none', background: '#111827',
          fontSize: 13, fontWeight: 600, color: '#fff', cursor: 'pointer',
        }}>+ Add task</button>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: '#F3F4F6', borderRadius: 10, padding: 4, width: 'fit-content' }}>
        {[
          { id: 'todo', label: `To do (${counts.todo})` },
          { id: 'in_progress', label: `In progress (${counts['in_progress']})` },
          { id: 'done', label: `Done (${counts.done})` },
          { id: 'all', label: 'All' },
        ].map(tab => (
          <button key={tab.id} onClick={() => setFilter(tab.id)} style={{
            padding: '6px 14px', borderRadius: 8, border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer',
            background: filter === tab.id ? '#fff' : 'transparent',
            color: filter === tab.id ? '#111827' : '#6B7280',
            boxShadow: filter === tab.id ? '0 1px 3px rgba(0,0,0,.1)' : 'none',
          }}>{tab.label}</button>
        ))}
      </div>

      {/* Task list */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB', overflow: 'hidden' }}>
        {filtered.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>
            {filter === 'todo' ? 'All caught up! No open tasks.' : `No ${filter.replace('_', ' ')} tasks.`}
          </div>
        ) : filtered.map((task, i) => {
          const clientName = getClientName(task.client_id);
          return (
            <div key={task.id} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '13px 20px',
              borderBottom: i < filtered.length - 1 ? '1px solid #F9FAFB' : 'none',
              transition: 'background .1s',
            }}
              onMouseOver={e => e.currentTarget.style.background = '#FAFAFA'}
              onMouseOut={e => e.currentTarget.style.background = 'none'}>
              {/* Checkbox */}
              <div
                onClick={() => task.status === 'done' ? reopenMutation.mutate(task.id) : completeMutation.mutate(task.id)}
                style={{
                  width: 18, height: 18, borderRadius: 5, flexShrink: 0, cursor: 'pointer',
                  border: task.status === 'done' ? 'none' : '2px solid #D1D5DB',
                  background: task.status === 'done' ? '#10B981' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                {task.status === 'done' && <span style={{ color: '#fff', fontSize: 11, fontWeight: 700 }}>✓</span>}
              </div>

              {/* Title + client */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, color: task.status === 'done' ? '#9CA3AF' : '#111827', textDecoration: task.status === 'done' ? 'line-through' : 'none', fontWeight: 500 }}>{task.title}</div>
                {clientName && <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>{clientName}</div>}
              </div>

              <button
                onClick={() => toggleWorkingStatus(task)}
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  padding: '3px 8px',
                  borderRadius: 20,
                  border: 'none',
                  cursor: 'pointer',
                  background: STATUS_COLORS[task.status]?.background || '#F3F4F6',
                  color: STATUS_COLORS[task.status]?.color || '#6B7280',
                  textTransform: 'uppercase',
                  whiteSpace: 'nowrap',
                }}
              >
                {STATUS_LABELS[task.status] || 'To do'}
              </button>

              {/* Priority */}
              {task.priority && (
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, textTransform: 'uppercase',
                  background: PRIORITY_BG[task.priority] || '#F3F4F6',
                  color: PRIORITY_COLORS[task.priority] || '#9CA3AF',
                }}>{task.priority}</span>
              )}

              {/* Due date */}
              {task.due_date && (
                <span style={{ fontSize: 11, color: new Date(task.due_date) < new Date() && task.status !== 'done' ? '#EF4444' : '#9CA3AF', fontWeight: 500, flexShrink: 0 }}>
                  {new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Add Task Modal */}
      {showAdd && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={e => { if (e.target === e.currentTarget) setShowAdd(false); }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 28, width: 420, boxShadow: '0 20px 60px rgba(0,0,0,.15)' }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#111827', marginBottom: 18 }}>Add task</div>
            <div style={{ marginBottom: 13 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5 }}>Title *</div>
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} autoFocus
                placeholder="What needs to be done?"
                style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 13, outline: 'none', boxSizing: 'border-box', fontFamily: 'Inter, sans-serif' }} />
            </div>
            <div style={{ marginBottom: 13 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5 }}>Client (optional)</div>
              <select value={form.client_id} onChange={e => setForm(f => ({ ...f, client_id: e.target.value }))}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 13, background: '#fff', fontFamily: 'Inter, sans-serif' }}>
                <option value="">No client</option>
                {allClients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: 13 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5 }}>Status</div>
              <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 13, background: '#fff', fontFamily: 'Inter, sans-serif' }}>
                <option value="todo">To do</option>
                <option value="in_progress">In progress</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5 }}>Priority</div>
                <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 13, background: '#fff', fontFamily: 'Inter, sans-serif' }}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5 }}>Due date</div>
                <input type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 13, boxSizing: 'border-box', fontFamily: 'Inter, sans-serif' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowAdd(false)} style={{ padding: '9px 18px', borderRadius: 8, border: '1px solid #E5E7EB', background: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', color: '#374151' }}>Cancel</button>
              <button onClick={addTask} disabled={saving} style={{ padding: '9px 18px', borderRadius: 8, border: 'none', background: '#111827', fontSize: 13, fontWeight: 600, cursor: 'pointer', color: '#fff' }}>
                {saving ? 'Saving...' : 'Add task'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
