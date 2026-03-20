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

const PROJECT_TYPES = ['Brand Identity', 'Logo Design', 'Web Design', 'Brand Strategy', 'Packaging', 'Print', 'Other'];

function ClientCard({ client }) {
  const navigate = useNavigate();
  return (
    <div onClick={() => navigate(`/clients/${client.id}`)}
      style={{ background: '#fff', borderRadius: 10, border: '1px solid #E5E7EB', padding: '14px 16px', cursor: 'pointer', marginBottom: 8, transition: 'box-shadow .15s' }}
      onMouseOver={e => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,.08)'}
      onMouseOut={e => e.currentTarget.style.boxShadow = 'none'}>
      <div style={{ fontWeight: 700, fontSize: 14, color: '#111827', marginBottom: 2 }}>{client.name}</div>
      <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 8 }}>{client.company || client.project_type}</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {client.budget && <span style={{ fontSize: 12, fontWeight: 600, color: '#10B981' }}>${Number(client.budget).toLocaleString()}</span>}
        {client.open_tasks > 0 && <span style={{ fontSize: 11, background: '#FEF3C7', color: '#92400E', borderRadius: 20, padding: '2px 8px' }}>{client.open_tasks} tasks</span>}
      </div>
    </div>
  );
}

const inp = { width: '100%', boxSizing: 'border-box', padding: '9px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, outline: 'none', fontFamily: 'Inter, sans-serif', color: '#111827' };

export default function PipelinePage() {
  const qc = useQueryClient();
  const { data: allClients = [] } = useQuery('clients', () => clients.list());
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', company: '', email: '', phone: '', project_type: '', budget: '', stage: 'lead' });
  const [error, setError] = useState('');

  const createMutation = useMutation(data => clients.create(data), {
    onSuccess: () => {
      qc.invalidateQueries('clients');
      setShowAdd(false);
      setForm({ name: '', company: '', email: '', phone: '', project_type: '', budget: '', stage: 'lead' });
      setError('');
    },
    onError: err => setError(typeof err === 'string' ? err : 'Failed to create client'),
  });

  const handleSubmit = () => {
    if (!form.name || !form.email) return setError('Name and email are required');
    createMutation.mutate({ ...form, budget: form.budget ? Number(form.budget) : null });
  };

  return (
    <div style={{ padding: 32, fontFamily: 'Inter, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#111827', margin: 0 }}>Client pipeline</h1>
        <button onClick={() => setShowAdd(s => !s)}
          style={{ fontSize: 13, fontWeight: 700, background: '#111827', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 18px', cursor: 'pointer' }}>
          {showAdd ? 'Cancel' : '+ Add client'}
        </button>
      </div>

      {/* Add client form */}
      {showAdd && (
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB', padding: 24, marginBottom: 24 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 18 }}>New client</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 5 }}>Name *</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Jane Smith" style={inp} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 5 }}>Company</label>
              <input value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} placeholder="Acme Co." style={inp} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 5 }}>Email *</label>
              <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="jane@acme.com" style={inp} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 5 }}>Phone</label>
              <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+1 555 000 0000" style={inp} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 5 }}>Project type</label>
              <select value={form.project_type} onChange={e => setForm(f => ({ ...f, project_type: e.target.value }))} style={{ ...inp, background: '#fff' }}>
                <option value="">Select...</option>
                {PROJECT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 5 }}>Budget ($)</label>
              <input type="number" value={form.budget} onChange={e => setForm(f => ({ ...f, budget: e.target.value }))} placeholder="5000" style={inp} />
            </div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 5 }}>Stage</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {STAGES.map(s => (
                <button key={s.id} onClick={() => setForm(f => ({ ...f, stage: s.id }))}
                  style={{ fontSize: 11, fontWeight: 700, padding: '5px 12px', borderRadius: 20, border: 'none', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '.06em', background: form.stage === s.id ? s.color : '#F3F4F6', color: form.stage === s.id ? '#fff' : '#9CA3AF' }}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>
          {error && <div style={{ fontSize: 12, color: '#EF4444', marginBottom: 12 }}>{error}</div>}
          <button onClick={handleSubmit} disabled={createMutation.isLoading}
            style={{ fontSize: 13, fontWeight: 700, background: '#111827', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 20px', cursor: 'pointer' }}>
            {createMutation.isLoading ? 'Creating...' : 'Create client'}
          </button>
        </div>
      )}

      {/* Kanban */}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${STAGES.length}, 1fr)`, gap: 16, alignItems: 'start' }}>
        {STAGES.map(stage => {
          const stageClients = allClients.filter(c => c.stage === stage.id);
          return (
            <div key={stage.id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: stage.color }} />
                  <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: '#374151' }}>{stage.label}</span>
                </div>
                <span style={{ fontSize: 12, color: '#9CA3AF', fontWeight: 600 }}>{stageClients.length}</span>
              </div>
              <div style={{ minHeight: 100 }}>
                {stageClients.map(client => <ClientCard key={client.id} client={client} />)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
