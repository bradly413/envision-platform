import { useQuery, useMutation, useQueryClient } from 'react-query';
import { clients } from '../lib/api';
import { useNavigate } from 'react-router-dom';

const STAGES = [
  { id: 'lead',      label: 'Lead',      color: '#6B7280' },
  { id: 'proposal',  label: 'Proposal',  color: '#3B82F6' },
  { id: 'active',    label: 'Active',    color: '#10B981' },
  { id: 'revision',  label: 'Revision',  color: '#F59E0B' },
  { id: 'delivered', label: 'Delivered', color: '#8B5CF6' },
];

function ClientCard({ client, onStageChange }) {
  const navigate = useNavigate();
  return (
    <div onClick={() => navigate(`/clients/${client.id}`)} style={{ background: '#fff', borderRadius: 10, border: '1px solid #E5E7EB', padding: '14px 16px', cursor: 'pointer', marginBottom: 8, transition: 'box-shadow .15s' }}
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

export default function PipelinePage() {
  const qc = useQueryClient();
  const { data: allClients = [] } = useQuery('clients', () => clients.list());
  const updateMutation = useMutation(({ id, stage }) => clients.update(id, { stage }), {
    onSuccess: () => qc.invalidateQueries('clients'),
  });

  return (
    <div style={{ padding: 32 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#111827', margin: 0 }}>Client pipeline</h1>
        <button style={{ fontSize: 13, fontWeight: 700, background: '#111827', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 18px', cursor: 'pointer' }}>
          + Add client
        </button>
      </div>

      {/* Kanban columns */}
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
                {stageClients.map(client => <ClientCard key={client.id} client={client} onStageChange={updateMutation.mutate} />)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
