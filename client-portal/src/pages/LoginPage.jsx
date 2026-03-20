import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { portalAuth } from '../lib/api';
import { usePortalStore } from '../lib/store';

export default function LoginPage() {
  const { slug: paramSlug } = useParams();
  const [slug, setSlug] = useState(paramSlug || '');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { setPortalAuth } = usePortalStore();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const { token, portal } = await portalAuth.login(slug, password);
      setPortalAuth(token, portal);
      navigate('/present');
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid credentials');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0F0F0F', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ width: '100%', maxWidth: 380, padding: 32 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.2em', textTransform: 'uppercase', color: '#6B7280' }}>Envision x</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#F9FAFB', marginTop: 4 }}>Bradley Robert Creative</div>
        </div>

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: '#6B7280', marginBottom: 6 }}>Presentation code</label>
            <input value={slug} onChange={e => setSlug(e.target.value)} placeholder="Your unique code" required
              style={{ width: '100%', boxSizing: 'border-box', padding: '13px 14px', borderRadius: 10, border: '1px solid #374151', background: '#1A1A1A', color: '#F9FAFB', fontSize: 15, fontFamily: 'Inter, sans-serif', outline: 'none' }} />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: '#6B7280', marginBottom: 6 }}>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter password" required
              style={{ width: '100%', boxSizing: 'border-box', padding: '13px 14px', borderRadius: 10, border: '1px solid #374151', background: '#1A1A1A', color: '#F9FAFB', fontSize: 15, fontFamily: 'Inter, sans-serif', outline: 'none' }} />
          </div>
          {error && <div style={{ color: '#EF4444', fontSize: 13, marginBottom: 16, textAlign: 'center' }}>{error}</div>}
          <button type="submit" disabled={loading} style={{ width: '100%', padding: 14, borderRadius: 10, border: 'none', background: '#F9FAFB', color: '#111827', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
            {loading ? 'Loading...' : 'View your presentation →'}
          </button>
        </form>

        <div style={{ marginTop: 32, textAlign: 'center', fontSize: 12, color: '#374151' }}>Your exclusive brand reveal awaits.</div>
      </div>
    </div>
  );
}
