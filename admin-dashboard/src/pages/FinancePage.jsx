import { useQuery } from 'react-query';
import { clients } from '../lib/api';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const STAGE_COLORS = { lead: '#6B7280', proposal: '#3B82F6', active: '#10B981', revision: '#F59E0B', delivered: '#8B5CF6' };

export default function FinancePage() {
  const navigate = useNavigate();
  const { data: allClients = [] } = useQuery('clients', () => clients.list());
  const [filter, setFilter] = useState('all');

  const filtered = filter === 'all' ? allClients : allClients.filter(c => c.stage === filter);

  const totalBudget = allClients.reduce((s, c) => s + Number(c.budget || 0), 0);
  const totalRevenue = allClients.reduce((s, c) => s + Number(c.revenue || 0), 0);
  const activeRevenue = allClients.filter(c => c.stage === 'active').reduce((s, c) => s + Number(c.budget || 0), 0);
  const deliveredRevenue = allClients.filter(c => c.stage === 'delivered').reduce((s, c) => s + Number(c.revenue || c.budget || 0), 0);

  const byStage = ['lead','proposal','active','revision','delivered'].map(stage => ({
    stage,
    count: allClients.filter(c => c.stage === stage).length,
    total: allClients.filter(c => c.stage === stage).reduce((s, c) => s + Number(c.budget || 0), 0),
  }));

  return (
    <div style={{ padding: 32, fontFamily: 'Inter, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#111827', margin: 0 }}>Finance</h1>
          <div style={{ fontSize: 13, color: '#9CA3AF', marginTop: 3 }}>Pipeline overview from client data</div>
        </div>
        <button onClick={() => navigate('/pipeline')} style={{
          padding: '8px 16px', borderRadius: 8, border: '1px solid #E5E7EB', background: '#fff',
          fontSize: 13, fontWeight: 600, color: '#374151', cursor: 'pointer',
        }}>View pipeline →</button>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Total pipeline', value: `$${totalBudget.toLocaleString()}`, color: '#111827', sub: `${allClients.length} clients` },
          { label: 'Active revenue', value: `$${activeRevenue.toLocaleString()}`, color: '#10B981', sub: 'active stage' },
          { label: 'Delivered', value: `$${deliveredRevenue.toLocaleString()}`, color: '#8B5CF6', sub: 'closed won' },
          { label: 'Avg deal size', value: allClients.length ? `$${Math.round(totalBudget / allClients.length).toLocaleString()}` : '$0', color: '#F59E0B', sub: 'per client' },
        ].map(s => (
          <div key={s.label} style={{ background: '#fff', borderRadius: 12, padding: '20px 24px', border: '1px solid #E5E7EB' }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: '#9CA3AF', marginBottom: 8 }}>{s.label}</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
            {s.sub && <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 6 }}>{s.sub}</div>}
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 16 }}>
        {/* Pipeline by stage */}
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB', padding: 22 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 16 }}>Revenue by stage</div>
          {byStage.map(({ stage, count, total }) => (
            <div key={stage} style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: STAGE_COLORS[stage] }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#374151', textTransform: 'capitalize' }}>{stage}</span>
                  <span style={{ fontSize: 11, color: '#9CA3AF' }}>{count} clients</span>
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>${total.toLocaleString()}</span>
              </div>
              <div style={{ background: '#F3F4F6', borderRadius: 4, height: 5, overflow: 'hidden' }}>
                <div style={{ width: totalBudget ? `${(total / totalBudget) * 100}%` : '0%', height: '100%', background: STAGE_COLORS[stage], borderRadius: 4 }} />
              </div>
            </div>
          ))}
        </div>

        {/* Client revenue table */}
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB', padding: 22 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>Clients</div>
            <select value={filter} onChange={e => setFilter(e.target.value)}
              style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid #E5E7EB', fontSize: 12, background: '#fff', color: '#374151' }}>
              <option value="all">All stages</option>
              {['lead','proposal','active','revision','delivered'].map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
            </select>
          </div>
          {filtered.length === 0 ? (
            <div style={{ fontSize: 13, color: '#9CA3AF' }}>No clients in this stage.</div>
          ) : (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 12, padding: '0 0 8px', borderBottom: '1px solid #F3F4F6', marginBottom: 4 }}>
                {['Client','Stage','Budget'].map(h => <div key={h} style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: '#9CA3AF' }}>{h}</div>)}
              </div>
              {filtered.sort((a,b) => Number(b.budget||0) - Number(a.budget||0)).map(c => (
                <div key={c.id} onClick={() => navigate(`/clients/${c.id}`)} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 12, padding: '10px 0', borderBottom: '1px solid #F9FAFB', cursor: 'pointer', alignItems: 'center' }}
                  onMouseOver={e => e.currentTarget.style.background = '#FAFAFA'}
                  onMouseOut={e => e.currentTarget.style.background = 'none'}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{c.name}</div>
                    {c.company && <div style={{ fontSize: 11, color: '#9CA3AF' }}>{c.company}</div>}
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: '#F3F4F6', color: STAGE_COLORS[c.stage] || '#6B7280', textTransform: 'capitalize' }}>{c.stage}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{c.budget ? `$${Number(c.budget).toLocaleString()}` : '—'}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Note about Plaid */}
      <div style={{ marginTop: 16, padding: '12px 16px', background: '#F9FAFB', borderRadius: 8, border: '1px solid #F3F4F6' }}>
        <div style={{ fontSize: 12, color: '#9CA3AF' }}>
          💡 <strong>Coming soon:</strong> Connect Plaid for automatic expense tracking and invoice reconciliation.
        </div>
      </div>
    </div>
  );
}
