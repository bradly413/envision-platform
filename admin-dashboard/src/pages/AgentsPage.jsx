import { useState } from 'react';
import { useQuery } from 'react-query';
import { agents, clients } from '../lib/api';

const AGENTS = [
  { id: 'daily-briefing',  name: 'Daily briefing',    desc: 'Morning summary of clients, tasks, and priorities', icon: '◷' },
  { id: 'client-summary',  name: 'Client summary',    desc: 'Current status and next steps for a specific client', icon: '◈' },
  { id: 'portal-feedback', name: 'Portal feedback',   desc: 'Analyze how a client engaged with their presentation', icon: '◻' },
  { id: 'proposal-draft',  name: 'Proposal draft',    desc: 'Generate a project proposal outline for a new client', icon: '◻' },
];

export default function AgentsPage() {
  const { data: allClients = [] } = useQuery('clients', () => clients.list());
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState({});
  const [selectedClient, setSelectedClient] = useState('');

  const runAgent = async (agentId) => {
    setLoading(l => ({ ...l, [agentId]: true }));
    try {
      const client = allClients.find(c => c.id === selectedClient);
      const context = {
        agencyName: 'Bradley Robert Creative',
        client,
        clients: allClients.map(c => ({ name: c.name, stage: c.stage })),
      };
      const result = await agents.run(agentId, context);
      setResults(r => ({ ...r, [agentId]: result.result }));
    } catch (err) {
      setResults(r => ({ ...r, [agentId]: `Error: ${err}` }));
    } finally {
      setLoading(l => ({ ...l, [agentId]: false }));
    }
  };

  return (
    <div style={{ padding: 32 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#111827', margin: 0 }}>AI agents</h1>
        <p style={{ fontSize: 14, color: '#6B7280', margin: '4px 0 0' }}>Powered by Claude · Each agent reads your live client and task data</p>
      </div>

      {/* Client selector for context */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB', padding: 16, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#374151', whiteSpace: 'nowrap' }}>Active client context:</span>
        <select value={selectedClient} onChange={e => setSelectedClient(e.target.value)} style={{ flex: 1, padding: '8px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13 }}>
          <option value="">No specific client (use all)</option>
          {allClients.map(c => <option key={c.id} value={c.id}>{c.name} — {c.company || c.stage}</option>)}
        </select>
      </div>

      {/* Agent cards */}
      <div style={{ display: 'grid', gap: 16 }}>
        {AGENTS.map(agent => (
          <div key={agent.id} style={{ background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB', overflow: 'hidden' }}>
            <div style={{ padding: '18px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                  <span style={{ fontSize: 16 }}>{agent.icon}</span>
                  <span style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>{agent.name}</span>
                </div>
                <div style={{ fontSize: 13, color: '#6B7280' }}>{agent.desc}</div>
              </div>
              <button onClick={() => runAgent(agent.id)} disabled={loading[agent.id]}
                style={{ fontSize: 12, fontWeight: 700, padding: '8px 16px', borderRadius: 8, border: 'none', background: loading[agent.id] ? '#F3F4F6' : '#111827', color: loading[agent.id] ? '#9CA3AF' : '#fff', cursor: loading[agent.id] ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>
                {loading[agent.id] ? 'Running...' : 'Run agent ↺'}
              </button>
            </div>
            {results[agent.id] && (
              <div style={{ padding: '16px 20px', borderTop: '1px solid #F3F4F6', background: '#F9FAFB' }}>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: '#9CA3AF', marginBottom: 8 }}>Result</div>
                <div style={{ fontSize: 14, color: '#374151', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{results[agent.id]}</div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
