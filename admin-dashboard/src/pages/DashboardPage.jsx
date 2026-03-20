import { useQuery } from 'react-query';
import { analytics, agents } from '../lib/api';
import { useState } from 'react';

const STAGES = { lead: '#6B7280', proposal: '#3B82F6', active: '#10B981', revision: '#F59E0B', delivered: '#8B5CF6' };

export default function DashboardPage() {
  const { data: overview } = useQuery('overview', analytics.overview);
  const [briefing, setBriefing] = useState('');
  const [loading, setLoading] = useState(false);

  const generateBriefing = async () => {
    setLoading(true);
    try {
      const result = await agents.run('daily-briefing', {
        agencyName: 'Bradley Robert Creative',
        clients: overview?.clientsByStage || [],
        openTasks: overview?.tasksByStatus?.find(t => t.status === 'todo')?.count,
      });
      setBriefing(result.result);
    } finally { setLoading(false); }
  };

  return (
    <div style={{ padding: 32 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#111827', margin: 0 }}>Dashboard</h1>
        <p style={{ fontSize: 14, color: '#6B7280', margin: '4px 0 0' }}>
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
        </p>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
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

      {/* AI Briefing */}
      <div style={{ background: '#111827', borderRadius: 12, padding: 24, marginBottom: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#F9FAFB' }}>AI Morning Briefing</div>
          <button onClick={generateBriefing} disabled={loading} style={{ fontSize: 12, fontWeight: 600, color: '#111827', background: '#F9FAFB', border: 'none', borderRadius: 6, padding: '6px 14px', cursor: 'pointer' }}>
            {loading ? 'Generating...' : 'Generate ↺'}
          </button>
        </div>
        <div style={{ fontSize: 14, color: '#D1D5DB', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
          {briefing || 'Click "Generate" for your AI-powered morning briefing.'}
        </div>
      </div>

      {/* Client pipeline by stage */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB', padding: 24 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 16 }}>Pipeline by stage</div>
        <div style={{ display: 'flex', gap: 8 }}>
          {overview?.clientsByStage?.map(({ stage, count }) => (
            <div key={stage} style={{ flex: 1, background: '#F9FAFB', borderRadius: 8, padding: '12px 16px', borderTop: `3px solid ${STAGES[stage] || '#E5E7EB'}` }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: '#9CA3AF', marginBottom: 4 }}>{stage}</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#111827' }}>{count}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
