import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../lib/api';
import { useAuthStore } from '../lib/store';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const { token, user } = await auth.login(email, password);
      setAuth(token, user);
      navigate('/');
    } catch (err) {
      setError(typeof err === 'string' ? err : 'Invalid credentials');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F0F2F5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #E5E7EB', padding: 40, width: '100%', maxWidth: 380 }}>
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: '#9CA3AF', marginBottom: 6 }}>Envision · Admin</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#111827' }}>Sign in</div>
        </div>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: '#6B7280', marginBottom: 6 }}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
              style={{ width: '100%', boxSizing: 'border-box', padding: '11px 13px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 14, fontFamily: 'Inter, sans-serif', outline: 'none', color: '#111827' }} />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: '#6B7280', marginBottom: 6 }}>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
              style={{ width: '100%', boxSizing: 'border-box', padding: '11px 13px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 14, fontFamily: 'Inter, sans-serif', outline: 'none', color: '#111827' }} />
          </div>
          {error && <div style={{ color: '#EF4444', fontSize: 13, marginBottom: 14 }}>{error}</div>}
          <button type="submit" disabled={loading} style={{ width: '100%', padding: 12, borderRadius: 8, border: 'none', background: '#111827', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
            {loading ? 'Signing in...' : 'Sign in →'}
          </button>
        </form>
      </div>
    </div>
  );
}
