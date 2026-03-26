import { useState, useRef, useEffect } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || 'https://envision-platform-production.up.railway.app';

const SYSTEM_PROMPT = `You are an expert portal content editor for Envision Creative, a high-end creative agency. 
You help build and refine client-facing presentation portals by generating structured JSON content.

When asked to create or update portal content, respond with a JSON object in this structure:
{
  "hero": { "headline": "", "subheadline": "", "tagline": "" },
  "about": { "title": "", "body": "" },
  "strategy": { "title": "", "pillars": [{ "title": "", "description": "" }] },
  "deliverables": [{ "title": "", "description": "", "timeline": "" }],
  "palette": { "primary": "#hex", "secondary": "#hex", "accent": "#hex", "background": "#hex" },
  "typography": { "display": "font name", "body": "font name" },
  "cta": { "headline": "", "buttonText": "", "email": "" }
}

Always respond with the full JSON block wrapped in triple backticks. You may include a brief explanation before the JSON.`;

export default function PortalEditorPage() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hi! I\'m your portal content editor. Tell me about your client — their industry, brand vibe, campaign goals — and I\'ll generate the full portal content JSON. You can also paste existing content and ask me to refine it.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [portals, setPortals] = useState([]);
  const [selectedPortal, setSelectedPortal] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [extractedJSON, setExtractedJSON] = useState(null);
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    fetchPortals();
  }, []);

  const fetchPortals = async () => {
    try {
      const token = JSON.parse(localStorage.getItem('auth-store') || '{}')?.state?.token;
      const res = await fetch(`${API_BASE}/api/portals`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setPortals(data.portals || []);
      }
    } catch (e) {
      console.error('Failed to fetch portals', e);
    }
  };

  const extractJSON = (text) => {
    const match = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (match) {
      try { return JSON.parse(match[1].trim()); } catch { return null; }
    }
    return null;
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = { role: 'user', content: input.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);
    setExtractedJSON(null);

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          system: SYSTEM_PROMPT,
          messages: newMessages.map(m => ({ role: m.role, content: m.content }))
        })
      });
      const data = await res.json();
      const reply = data.content?.[0]?.text || 'Sorry, something went wrong.';
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
      const json = extractJSON(reply);
      if (json) setExtractedJSON(json);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Error reaching the AI. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const saveToPortal = async () => {
    if (!selectedPortal || !extractedJSON) return;
    setSaving(true);
    setSaveMsg('');
    try {
      const token = JSON.parse(localStorage.getItem('auth-store') || '{}')?.state?.token;
      const res = await fetch(`${API_BASE}/api/portals/${selectedPortal}/content`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ content: extractedJSON })
      });
      if (res.ok) {
        setSaveMsg('✓ Saved to portal');
      } else {
        setSaveMsg('✗ Save failed — check API');
      }
    } catch {
      setSaveMsg('✗ Network error');
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMsg(''), 3000);
    }
  };

  const renderMessage = (msg, i) => {
    const isUser = msg.role === 'user';
    return (
      <div key={i} style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', marginBottom: 16 }}>
        <div style={{
          maxWidth: '75%',
          padding: '12px 16px',
          borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
          background: isUser ? '#111827' : '#fff',
          color: isUser ? '#F9FAFB' : '#111827',
          fontSize: 13,
          lineHeight: 1.6,
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word'
        }}>
          {msg.content}
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'Inter, sans-serif', background: '#F0F2F5' }}>

      {/* Chat panel */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Header */}
        <div style={{ padding: '18px 24px', background: '#fff', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#111827' }}>Portal Editor</div>
            <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>AI-powered content builder</div>
          </div>
          <button onClick={() => { setMessages([{ role: 'assistant', content: 'Starting fresh! Tell me about your client.' }]); setExtractedJSON(null); }}
            style={{ fontSize: 12, color: '#6B7280', background: 'none', border: '1px solid #E5E7EB', borderRadius: 8, padding: '6px 12px', cursor: 'pointer' }}>
            New chat
          </button>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 24px 8px' }}>
          {messages.map(renderMessage)}
          {loading && (
            <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 16 }}>
              <div style={{ padding: '12px 16px', borderRadius: '16px 16px 16px 4px', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                <div style={{ display: 'flex', gap: 4 }}>
                  {[0,1,2].map(d => (
                    <div key={d} style={{ width: 6, height: 6, borderRadius: '50%', background: '#D1D5DB', animation: 'pulse 1.2s ease-in-out infinite', animationDelay: `${d * 0.2}s` }} />
                  ))}
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div style={{ padding: 16, background: '#fff', borderTop: '1px solid #E5E7EB' }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe the client, paste existing content, or ask for revisions... (Enter to send)"
              rows={3}
              style={{ flex: 1, padding: '10px 14px', borderRadius: 10, border: '1px solid #E5E7EB', fontSize: 13, fontFamily: 'Inter, sans-serif', resize: 'none', outline: 'none', lineHeight: 1.5, color: '#111827' }}
            />
            <button onClick={sendMessage} disabled={loading || !input.trim()}
              style={{ padding: '10px 20px', borderRadius: 10, border: 'none', background: loading || !input.trim() ? '#E5E7EB' : '#111827', color: loading || !input.trim() ? '#9CA3AF' : '#fff', fontSize: 13, fontWeight: 700, cursor: loading || !input.trim() ? 'default' : 'pointer', whiteSpace: 'nowrap' }}>
              Send
            </button>
          </div>
        </div>
      </div>

      {/* Right panel — JSON preview + save */}
      <div style={{ width: 320, background: '#fff', borderLeft: '1px solid #E5E7EB', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '18px 20px', borderBottom: '1px solid #E5E7EB' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>Save to Portal</div>
          <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>Push generated content to a live portal</div>
        </div>

        <div style={{ padding: 16, borderBottom: '1px solid #E5E7EB' }}>
          <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: '#6B7280', display: 'block', marginBottom: 6 }}>Target portal</label>
          <select value={selectedPortal || ''} onChange={e => setSelectedPortal(e.target.value)}
            style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 13, color: '#111827', background: '#F9FAFB', outline: 'none' }}>
            <option value=''>Select a portal...</option>
            {portals.map(p => (
              <option key={p.id} value={p.id}>{p.client_name || p.slug} ({p.slug})</option>
            ))}
          </select>
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
          {extractedJSON ? (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: '#10B981', marginBottom: 8 }}>✓ Content ready</div>
              <pre style={{ fontSize: 10, color: '#6B7280', background: '#F9FAFB', borderRadius: 8, padding: 12, overflow: 'auto', maxHeight: 340, lineHeight: 1.5 }}>
                {JSON.stringify(extractedJSON, null, 2)}
              </pre>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 16px', color: '#9CA3AF', fontSize: 12, lineHeight: 1.6 }}>
              Ask the AI to generate portal content and the JSON will appear here, ready to save.
            </div>
          )}
        </div>

        <div style={{ padding: 16, borderTop: '1px solid #E5E7EB' }}>
          <button onClick={saveToPortal} disabled={!extractedJSON || !selectedPortal || saving}
            style={{ width: '100%', padding: 12, borderRadius: 10, border: 'none', background: !extractedJSON || !selectedPortal ? '#E5E7EB' : '#111827', color: !extractedJSON || !selectedPortal ? '#9CA3AF' : '#fff', fontSize: 13, fontWeight: 700, cursor: !extractedJSON || !selectedPortal ? 'default' : 'pointer' }}>
            {saving ? 'Saving...' : 'Push to portal →'}
          </button>
          {saveMsg && <div style={{ marginTop: 8, fontSize: 12, textAlign: 'center', color: saveMsg.startsWith('✓') ? '#10B981' : '#EF4444' }}>{saveMsg}</div>}
        </div>
      </div>

      <style>{`@keyframes pulse { 0%,100%{opacity:.3} 50%{opacity:1} }`}</style>
    </div>
  );
}
