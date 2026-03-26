import { useQuery, useMutation, useQueryClient } from 'react-query';
import { clients } from '../lib/api';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

const STAGES = [
  { id: 'lead',      label: 'Lead',      color: '#6B7280' },
  { id: 'proposal',  label: 'Proposal',  color: '#3B82F6' },
  { id: 'active',    label: 'Active',    color: '#10B981' },
  { id: 'revision',  label: 'Revision',  color: '#F59E0B' },
  { id: 'delivered', label: 'Delivered', color: '#8B5CF6' },
];

function ClientCard({ client, onStageChange }) {
  const navigate = useNavigate();
  const [dragging, setDragging] = useState(false);

  return (
    <div
      draggable
      onDragStart={e => { setDragging(true); e.dataTransfer.setData('clientId', client.id); }}
      onDragEnd={() => setDragging(false)}
      onClick={() => navigate(`/clients/${client.id}`)}
      style={{
        background: '#fff', borderRadius: 10, border: '1px solid #E5E7EB',
        padding: '14px 16px', cursor: 'pointer', marginBottom: 8,
        opacity: dragging ? .5 : 1,
        transition: 'box-shadow .15s, transform .1s',
        boxShadow: dragging ? '0 8px 24px rgba(0,0,0,.12)' : 'none',
      }}
      onMouseOver={e => { e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,.08)'; }}
      onMouseOut={e => { if (!dragging) e.currentTarget.style.boxShadow = 'none'; }}>
      {/* Avatar + name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 8 }}>
        <div style={{
          width: 28, height: 28, borderRadius: '50%', background: '#F3F4F6',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, fontWeight: 700, color: '#6B7280', flexShrink: 0,
        }}>
          {(client.name || '?')[0].toUpperCase()}
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 13, color: '#111827', lineHeight: 1.2 }}>{client.name}</div>
          {client.company && <div style={{ fontSize: 11, color: '#9CA3AF' }}>{client.company}</div>}
        </div>
      </div>

      {/* Meta row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {client.budget && (
            <span style={{ fontSize: 11, fontWeight: 600, color: '#10B981', background: '#D1FAE5', borderRadius: 20, padding: '2px 7px' }}>
              ${Number(client.budget).toLocaleString()}
            </span>
          )}
          {client.project_type && (
            <span style={{ fontSize: 11, color: '#6B7280', background: '#F3F4F6', borderRadius: 20, padding: '2px 7px' }}>
              {client.project_type}
            </span>
          )}
        </div>
        {client.open_tasks > 0 && (
          <span style={{ fontSize: 11, background: '#FEF3C7', color: '#92400E', borderRadius: 20, padding: '2px 7px' }}>
            {client.open_tasks} tasks
          </span>
        )}
      </div>
    </div>
  );
}

export default function PipelinePage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data: allClients = [] } = useQuery('clients', () => clients.list());
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', company: '', email: '', stage: 'lead', budget: '', project_type: '' });
  const [saving, setSaving] = useState(false);
  const [dragOver, setDragOver] = useState(null);

  const updateMutation = useMutation(({ id, stage }) => clients.update(id, { stage }), {
    onSuccess: () => qc.invalidateQueries('clients'),
  });

  const handleDrop = (e, stageId) => {
    const clientId = e.dataTransfer.getData('clientId');
    if (clientId) updateMutation.mutate({ id: clientId, stage: stageId });
    setDragOver(null);
  };

  const saveClient = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      await clients.create({ ...form, budget: form.budget ? Number(form.budget) : null });
      qc.invalidateQueries('clients');
      setShowAdd(false);
      setForm({ name: '', company: '', email: '', stage: 'lead', budget: '', project_type: '' });
    } catch (e) { console.error(e); }
    setSaving(false);
  };

  const totalRevenue = allClients.reduce((s, c) => s + Number(c.budget || 0), 0);

  return (
    <div style={{ padding: 32, fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#111827', margin: 0 }}>Client pipeline</h1>
          <div style={{ fontSize: 13, color: '#9CA3AF', marginTop: 3 }}>
            {allClients.length} clients · ${totalRevenue.toLocaleString()} pipeline
          </div>
        </div>
        <button onClick={() => setShowAdd(true)} style={{
          fontSize: 13, fontWeight: 700, background: '#111827', color: '#fff',
          border: 'none', borderRadius: 8, padding: '9px 18px', cursor: 'pointer',
        }}>+ Add client</button>
      </div>

      {/* Stage summary bar */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 24, marginTop: 16 }}>
        {STAGES.map(stage => {
          const count = allClients.filter(c => c.stage === stage.id).length;
          return (
            <div key={stage.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 20, background: '#fff', border: '1px solid #E5E7EB', fontSize: 12 }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: stage.color }} />
              <span style={{ fontWeight: 600, color: '#374151' }}>{stage.label}</span>
              <span style={{ color: '#9CA3AF', fontWeight: 700 }}>{count}</span>
            </div>
          );
        })}
      </div>

      {/* Kanban */}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${STAGES.length}, 1fr)`, gap: 14, alignItems: 'start' }}>
        {STAGES.map(stage => {
          const stageClients = allClients.filter(c => c.stage === stage.id);
          const isOver = dragOver === stage.id;
          return (
            <div key={stage.id}
              onDragOver={e => { e.preventDefault(); setDragOver(stage.id); }}
              onDragLeave={() => setDragOver(null)}
              onDrop={e => handleDrop(e, stage.id)}
              style={{
                minHeight: 200, borderRadius: 10, padding: 2,
                background: isOver ? '#F0F9FF' : 'transparent',
                border: isOver ? '2px dashed #3B82F6' : '2px dashed transparent',
                transition: 'all .15s',
              }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, padding: '0 2px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: stage.color }} />
                  <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: '#374151' }}>{stage.label}</span>
                </div>
                <span style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 700, background: '#F3F4F6', borderRadius: 20, padding: '2px 7px' }}>{stageClients.length}</span>
              </div>
              {stageClients.map(client => (
                <ClientCard key={client.id} client={client} onStageChange={updateMutation.mutate} />
              ))}
              {stageClients.length === 0 && (
                <div style={{ fontSize: 12, color: '#D1D5DB', textAlign: 'center', padding: '20px 0', fontStyle: 'italic' }}>
                  Drop here
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add Client Modal */}
      {showAdd && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={e => { if (e.target === e.currentTarget) setShowAdd(false); }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 28, width: 440, boxShadow: '0 20px 60px rgba(0,0,0,.15)' }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#111827', marginBottom: 20 }}>Add client</div>
            {[
              { key: 'name', label: 'Name *', placeholder: 'Full name' },
              { key: 'company', label: 'Company', placeholder: 'Company name' },
              { key: 'email', label: 'Email', placeholder: 'email@example.com' },
              { key: 'project_type', label: 'Project type', placeholder: 'e.g. Brand Identity' },
              { key: 'budget', label: 'Budget ($)', placeholder: '5000' },
            ].map(({ key, label, placeholder }) => (
              <div key={key} style={{ marginBottom: 13 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5 }}>{label}</div>
                <input value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  placeholder={placeholder}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 13, outline: 'none', boxSizing: 'border-box', fontFamily: 'Inter, sans-serif' }} />
              </div>
            ))}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5 }}>Stage</div>
              <select value={form.stage} onChange={e => setForm(f => ({ ...f, stage: e.target.value }))}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 13, background: '#fff', fontFamily: 'Inter, sans-serif' }}>
                {STAGES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowAdd(false)} style={{ padding: '9px 18px', borderRadius: 8, border: '1px solid #E5E7EB', background: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', color: '#374151' }}>Cancel</button>
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
