import { useQuery, useMutation, useQueryClient } from 'react-query';
import { tasks, clients } from '../lib/api';
import { useState } from 'react';

const PRIORITIES = { high: '#EF4444', medium: '#F59E0B', low: '#10B981' };
const STATUSES = ['todo', 'in_progress', 'done'];

export default function TasksPage() {
  const qc = useQueryClient();
  const { data: allTasks = [] } = useQuery('tasks', () => tasks.list());
  const { data: allClients = [] } = useQuery('clients-list', () => clients.list());
  const [filter, setFilter] = useState('todo');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ title: '', client_id: '', assignee: '', priority: 'medium', due_date: '' });

  const createTask = useMutation(tasks.create, { onSuccess: () => { qc.invalidateQueries('tasks'); setShowAdd(false); setForm({ title: '', client_id: '', assignee: '', priority: 'medium', due_date: '' }); } });
  const updateTask = useMutation(({ id, ...data }) => tasks.update(id, data), { onSuccess: () => qc.invalidateQueries('tasks') });
  const deleteTask = useMutation(tasks.delete, { onSuccess: () => qc.invalidateQueries('tasks') });

  const filtered = allTasks.filter(t => filter === 'all' ? true : t.status === filter);

  return (
    <div style={{ padding: 32 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#111827', margin: 0 }}>Tasks</h1>
        <button onClick={() => setShowAdd(true)} style={{ fontSize: 13, fontWeight: 700, background: '#111827', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 18px', cursor: 'pointer' }}>+ Add task</button>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: '#F3F4F6', borderRadius: 8, padding: 4, width: 'fit-content' }}>
        {['todo', 'in_progress', 'done', 'all'].map(s => (
          <button key={s} onClick={() => setFilter(s)} style={{ fontSize: 12, fontWeight: 600, padding: '6px 14px', borderRadius: 6, border: 'none', cursor: 'pointer', background: filter === s ? '#fff' : 'transparent', color: filter === s ? '#111827' : '#6B7280', boxShadow: filter === s ? '0 1px 3px rgba(0,0,0,.1)' : 'none' }}>
            {s === 'in_progress' ? 'In progress' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* Add task form */}
      {showAdd && (
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB', padding: 20, marginBottom: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr auto', gap: 10, alignItems: 'end' }}>
            <input placeholder="Task title..." value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} style={{ padding: '9px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, fontFamily: 'Inter, sans-serif' }} />
            <select value={form.client_id} onChange={e => setForm(f => ({ ...f, client_id: e.target.value }))} style={{ padding: '9px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13 }}>
              <option value="">No client</option>
              {allClients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))} style={{ padding: '9px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13 }}>
              {['low', 'medium', 'high'].map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <input type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} style={{ padding: '9px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13 }} />
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => createTask.mutate(form)} style={{ padding: '9px 16px', background: '#111827', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Save</button>
              <button onClick={() => setShowAdd(false)} style={{ padding: '9px 12px', background: 'none', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, cursor: 'pointer', color: '#6B7280' }}>✕</button>
            </div>
          </div>
        </div>
      )}

      {/* Task list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {filtered.map(task => (
          <div key={task.id} style={{ background: '#fff', borderRadius: 10, border: '1px solid #E5E7EB', padding: '14px 18px', display: 'grid', gridTemplateColumns: '24px 1fr auto auto auto', gap: 12, alignItems: 'center' }}>
            <input type="checkbox" checked={task.status === 'done'} onChange={() => updateTask.mutate({ id: task.id, status: task.status === 'done' ? 'todo' : 'done' })} style={{ width: 16, height: 16, cursor: 'pointer' }} />
            <div>
              <div style={{ fontSize: 14, fontWeight: 500, color: task.status === 'done' ? '#9CA3AF' : '#111827', textDecoration: task.status === 'done' ? 'line-through' : 'none' }}>{task.title}</div>
              {task.client_name && <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>{task.client_name}</div>}
            </div>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: PRIORITIES[task.priority], flexShrink: 0 }} />
            {task.due_date && <div style={{ fontSize: 11, color: '#9CA3AF' }}>{new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>}
            <button onClick={() => deleteTask.mutate(task.id)} style={{ fontSize: 12, color: '#D1D5DB', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 6px' }}>✕</button>
          </div>
        ))}
        {filtered.length === 0 && <div style={{ textAlign: 'center', padding: 40, color: '#9CA3AF', fontSize: 14 }}>No tasks in this view.</div>}
      </div>
    </div>
  );
}
