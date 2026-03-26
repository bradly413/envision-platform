import { useState, useRef, useEffect } from 'react';
import { ai, portals as portalsApi } from '../lib/api';

const MODEL_OPTIONS = {
  anthropic: [
    { value: 'claude-sonnet-4-20250514', label: 'Claude Sonnet 4' },
  ],
  openai: [
    { value: 'gpt-4.1', label: 'GPT-4.1' },
    { value: 'gpt-4.1-mini', label: 'GPT-4.1 Mini' },
  ],
  google: [
    { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash' },
    { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro' },
  ],
};

const STYLE_MODES = [
  { value: 'cinematic', label: 'Cinematic' },
  { value: 'editorial', label: 'Editorial' },
  { value: 'luxury', label: 'Luxury' },
  { value: 'bold', label: 'Bold Campaign' },
  { value: 'minimal', label: 'Minimal Modern' },
];

const OUTPUT_MODES = [
  { value: 'portal', label: 'Portal', hint: 'Immersive scroll reveal with Envision motion presets' },
  { value: 'presentation', label: 'Presentation', hint: 'Reveal.js-style deck with slides, fragments, media, and notes' },
];

const MODE_INTRO = {
  portal: `Hi! I'm your Envision builder. Tell me about the client, the brand mood, and the type of reveal you want. I can generate high-end portal JSON using Claude, GPT, or Gemini, complete with art direction and curated motion presets.`,
  presentation: `Hi! I'm your Envision presentation director. Tell me about the client, the audience, and the story you want to tell. I can generate reveal.js-ready presentation JSON with themes, slide transitions, fragments, media backgrounds, notes, and cinematic pacing.`,
};

function extractJSON(text) {
  const match = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (match) {
    try { return JSON.parse(match[1].trim()); } catch { return null; }
  }
  return null;
}

function normalizeBuilderPayload(outputMode, json) {
  if (!json) return null;

  if (outputMode === 'presentation') {
    if (json.mode === 'presentation' && json.presentation) return json;
    if (json.presentation) return { mode: 'presentation', presentation: json.presentation };
    return { mode: 'presentation', presentation: json };
  }

  if (json.mode === 'portal' && json.portal) return json.portal;
  return json;
}

export default function PortalEditorPage() {
  const [outputMode, setOutputMode] = useState('portal');
  const [messages, setMessages] = useState([
    { role: 'assistant', content: MODE_INTRO.portal }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [portals, setPortals] = useState([]);
  const [selectedPortal, setSelectedPortal] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [extractedJSON, setExtractedJSON] = useState(null);
  const [provider, setProvider] = useState('anthropic');
  const [model, setModel] = useState(MODEL_OPTIONS.anthropic[0].value);
  const [styleMode, setStyleMode] = useState('cinematic');
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
      const data = await portalsApi.list();
      setPortals(data.portals || data || []);
    } catch (e) {
      console.error('Failed to fetch portals', e);
    }
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
      const data = await ai.generateBuilderContent({
        provider,
        model,
        styleMode,
        outputMode,
        messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
        maxTokens: outputMode === 'presentation' ? 1800 : 1200,
      });
      const reply = data.reply || 'Sorry, something went wrong.';
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
      const json = extractJSON(reply);
      if (json) setExtractedJSON(json);
    } catch (e) {
      setMessages((prev) => [...prev, { role: 'assistant', content: `Error reaching the AI. ${String(e)}` }]);
    } finally {
      setLoading(false);
    }
  };

  const handleProviderChange = (nextProvider) => {
    setProvider(nextProvider);
    setModel(MODEL_OPTIONS[nextProvider][0].value);
  };

  const handleOutputModeChange = (nextMode) => {
    setOutputMode(nextMode);
    setExtractedJSON(null);
    setMessages([{ role: 'assistant', content: MODE_INTRO[nextMode] }]);
    setSaveMsg('');
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
      const payload = normalizeBuilderPayload(outputMode, extractedJSON);
      await portalsApi.updateContent(selectedPortal, payload);
      setSaveMsg(`✓ Saved ${outputMode === 'presentation' ? 'presentation' : 'portal'} to portal`);
    } catch (error) {
      setSaveMsg(`✗ ${String(error || 'Save failed — check API')}`);
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

  const selectedModeMeta = OUTPUT_MODES.find((mode) => mode.value === outputMode);
  const normalizedPreview = extractedJSON ? normalizeBuilderPayload(outputMode, extractedJSON) : null;

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'Inter, sans-serif', background: '#F0F2F5' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <div style={{ padding: '18px 24px', background: '#fff', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#111827' }}>Experience Builder</div>
            <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>
              Multi-model builder for immersive portals and cinematic presentations
            </div>
          </div>
          <button
            onClick={() => { setMessages([{ role: 'assistant', content: MODE_INTRO[outputMode] }]); setExtractedJSON(null); }}
            style={{ fontSize: 12, color: '#6B7280', background: 'none', border: '1px solid #E5E7EB', borderRadius: 8, padding: '6px 12px', cursor: 'pointer' }}
          >
            New chat
          </button>
        </div>

        <div style={{ padding: '14px 24px', background: '#fff', borderBottom: '1px solid #E5E7EB', display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div>
            <label style={{ display: 'block', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: '#6B7280', marginBottom: 6 }}>Output</label>
            <select
              value={outputMode}
              onChange={(e) => handleOutputModeChange(e.target.value)}
              style={{ minWidth: 170, padding: '8px 10px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 12, background: '#F9FAFB' }}
            >
              {OUTPUT_MODES.map((mode) => (
                <option key={mode.value} value={mode.value}>{mode.label}</option>
              ))}
            </select>
            <div style={{ fontSize: 10, color: '#9CA3AF', marginTop: 6, maxWidth: 180 }}>{selectedModeMeta?.hint}</div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: '#6B7280', marginBottom: 6 }}>Provider</label>
            <select
              value={provider}
              onChange={(e) => handleProviderChange(e.target.value)}
              style={{ minWidth: 150, padding: '8px 10px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 12, background: '#F9FAFB' }}
            >
              <option value="anthropic">Anthropic</option>
              <option value="openai">OpenAI</option>
              <option value="google">Google</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: '#6B7280', marginBottom: 6 }}>Model</label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              style={{ minWidth: 170, padding: '8px 10px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 12, background: '#F9FAFB' }}
            >
              {MODEL_OPTIONS[provider].map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: '#6B7280', marginBottom: 6 }}>Art direction</label>
            <select
              value={styleMode}
              onChange={(e) => setStyleMode(e.target.value)}
              style={{ minWidth: 170, padding: '8px 10px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 12, background: '#F9FAFB' }}
            >
              {STYLE_MODES.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 24px 8px' }}>
          {messages.map(renderMessage)}
          {loading && (
            <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 16 }}>
              <div style={{ padding: '12px 16px', borderRadius: '16px 16px 16px 4px', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                <div style={{ display: 'flex', gap: 4 }}>
                  {[0, 1, 2].map((d) => (
                    <div key={d} style={{ width: 6, height: 6, borderRadius: '50%', background: '#D1D5DB', animation: 'pulse 1.2s ease-in-out infinite', animationDelay: `${d * 0.2}s` }} />
                  ))}
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div style={{ padding: 16, background: '#fff', borderTop: '1px solid #E5E7EB' }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={outputMode === 'presentation'
                ? 'Describe the audience, pacing, slide mood, and story arc... (Enter to send)'
                : 'Describe the client, paste existing content, or ask for revisions... (Enter to send)'}
              rows={3}
              style={{ flex: 1, padding: '10px 14px', borderRadius: 10, border: '1px solid #E5E7EB', fontSize: 13, fontFamily: 'Inter, sans-serif', resize: 'none', outline: 'none', lineHeight: 1.5, color: '#111827' }}
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              style={{ padding: '10px 20px', borderRadius: 10, border: 'none', background: loading || !input.trim() ? '#E5E7EB' : '#111827', color: loading || !input.trim() ? '#9CA3AF' : '#fff', fontSize: 13, fontWeight: 700, cursor: loading || !input.trim() ? 'default' : 'pointer', whiteSpace: 'nowrap' }}
            >
              Send
            </button>
          </div>
        </div>
      </div>

      <div style={{ width: 360, background: '#fff', borderLeft: '1px solid #E5E7EB', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '18px 20px', borderBottom: '1px solid #E5E7EB' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>Save to Portal</div>
          <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>
            Push generated {outputMode === 'presentation' ? 'deck JSON' : 'portal JSON'} to a live client experience
          </div>
        </div>

        <div style={{ padding: 16, borderBottom: '1px solid #E5E7EB' }}>
          <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: '#6B7280', display: 'block', marginBottom: 6 }}>Target portal</label>
          <select
            value={selectedPortal || ''}
            onChange={(e) => setSelectedPortal(e.target.value)}
            style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 13, color: '#111827', background: '#F9FAFB', outline: 'none' }}
          >
            <option value="">Select a portal...</option>
            {portals.map((p) => (
              <option key={p.id} value={p.id}>{p.client_name || p.slug} ({p.slug})</option>
            ))}
          </select>
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
          {normalizedPreview ? (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: '#10B981', marginBottom: 8 }}>✓ Content ready</div>
              <pre style={{ fontSize: 10, color: '#6B7280', background: '#F9FAFB', borderRadius: 8, padding: 12, overflow: 'auto', maxHeight: 460, lineHeight: 1.5 }}>
                {JSON.stringify(normalizedPreview, null, 2)}
              </pre>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 16px', color: '#9CA3AF', fontSize: 12, lineHeight: 1.6 }}>
              Ask the AI to generate {outputMode === 'presentation' ? 'a presentation deck' : 'portal content'} and the JSON will appear here, ready to save.
            </div>
          )}
        </div>

        <div style={{ padding: 16, borderTop: '1px solid #E5E7EB' }}>
          <button
            onClick={saveToPortal}
            disabled={!extractedJSON || !selectedPortal || saving}
            style={{ width: '100%', padding: 12, borderRadius: 10, border: 'none', background: !extractedJSON || !selectedPortal ? '#E5E7EB' : '#111827', color: !extractedJSON || !selectedPortal ? '#9CA3AF' : '#fff', fontSize: 13, fontWeight: 700, cursor: !extractedJSON || !selectedPortal ? 'default' : 'pointer' }}
          >
            {saving ? 'Saving...' : `Push ${outputMode === 'presentation' ? 'presentation' : 'portal'} →`}
          </button>
          {saveMsg && <div style={{ marginTop: 8, fontSize: 12, textAlign: 'center', color: saveMsg.startsWith('✓') ? '#10B981' : '#EF4444' }}>{saveMsg}</div>}
        </div>
      </div>

      <style>{`@keyframes pulse { 0%,100%{opacity:.3} 50%{opacity:1} }`}</style>
    </div>
  );
}
