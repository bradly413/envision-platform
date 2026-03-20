export default function FinancePage() {
  return (
    <div style={{ padding: 32, fontFamily: 'Inter, sans-serif' }}>
      <h1 style={{ fontSize: 24, fontWeight: 800, color: '#111827', margin: '0 0 8px' }}>Finance</h1>
      <p style={{ color: '#6B7280', fontSize: 14 }}>Connect Plaid here for expense tracking. The backend Plaid token routes are stubbed in <code>routes/finance.js</code>. Reuse the <code>create-link-token</code> and <code>exchange-token</code> patterns from the Cornell Hub.</p>
    </div>
  );
}
