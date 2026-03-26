import { useState, useRef, useEffect } from 'react';
import { portals as portalsApi } from '../lib/api';
import { useNavigate } from 'react-router-dom';

const MODEL_OPTIONS = {
  anthropic: [
    { value: 'claude-sonnet-4-20250514', label: 'Claude Sonnet 4' },
    { value: 'claude-opus-4-5', label: 'Claude Opus 4' },
    { value: 'claude-haiku-4-5-20251001', label: 'Claude Haiku 4' },
  ],
  openai: [
    { value: 'gpt-4.1', label: 'GPT-4.1' },
    { value: 'gpt-4.1-mini', label: 'GPT-4.1 Mini' },
    { value: 'gpt-4o', label: 'GPT-4o' },
  ],
  google: [
    { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
    { value: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro' },
    { value: 'gemini-2.0-flash-exp', label: 'Gemini 2.0 Flash (exp)' },
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
  try { return JSON.parse(text.trim()); } catch { return null; }
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

// Build a live HTML preview from generated JSON
function buildPreviewHTML(outputMode, json) {
  if (!json) return null;
  const normalized = normalizeBuilderPayload(outputMode, json);

  if (outputMode === 'presentation') {
    const slides = normalized?.presentation?.slides || normalized?.slides || [];
    const theme = normalized?.presentation?.theme || 'black';
    return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Inter', 'Helvetica Neue', sans-serif; background: #0a0a0a; color: #fff; height: 100vh; display: flex; flex-direction: column; }
  .slides { flex: 1; display: flex; flex-direction: column; overflow-y: auto; }
  .slide { min-height: 200px; padding: 32px; border-bottom: 1px solid #222; display: flex; flex-direction: column; justify-content: center; }
  .slide:nth-child(odd) { background: #111; }
  .slide:nth-child(even) { background: #0a0a0a; }
  .slide-num { font-size: 10px; color: #444; letter-spacing: .1em; text-transform: uppercase; margin-bottom: 12px; }
  h1, h2 { font-size: 22px; font-weight: 800; color: #fff; margin-bottom: 8px; line-height: 1.2; }
  p, .content { font-size: 13px; color: #999; line-height: 1.7; }
  .tag { display: inline-block; font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 20px; background: #222; color: #888; margin: 4px 4px 0 0; text-transform: uppercase; }
  .header { padding: 14px 32px; border-bottom: 1px solid #222; font-size: 11px; color: #444; letter-spacing: .1em; text-transform: uppercase; }
</style>
</head>
<body>
<div class="header">Presentation Preview · ${slides.length} slides · ${theme} theme</div>
<div class="slides">
${slides.map((s, i) => `
  <div class="slide">
    <div class="slide-num">Slide ${i + 1}${s.type ? ` · ${s.type}` : ''}</div>
    ${s.title ? `<h2>${s.title}</h2>` : ''}
    ${s.subtitle ? `<p style="color:#bbb;margin-bottom:8px">${s.subtitle}</p>` : ''}
    ${s.content ? `<p class="content">${Array.isArray(s.content) ? s.content.join(' · ') : s.content}</p>` : ''}
    ${s.notes ? `<p style="font-size:11px;color:#555;margin-top:8px;font-style:italic">Notes: ${s.notes}</p>` : ''}
    ${s.background?.color ? `<div style="position:absolute;inset:0;background:${s.background.color};opacity:.08;pointer-events:none"></div>` : ''}
  </div>`).join('')}
</div>
</body>
</html>`;
  }

  // Portal preview
  const hero = normalized?.hero || {};
  const brand = normalized?.brand || {};
  const colors = normalized?.colors || [];
  const primaryColor = (Array.isArray(colors) ? colors[0]?.hex : colors) || '#d4af37';

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Inter', 'Helvetica Neue', sans-serif; background: #050507; color: #fff; min-height: 100vh; }
  .hero { min-height: 260px; display: flex; flex-direction: column; justify-content: center; padding: 48px 40px 32px; background: linear-gradient(135deg, #0a0a0e 0%, #111118 100%); border-bottom: 1px solid #1a1a24; }
  .eyebrow { font-size: 10px; font-weight: 700; letter-spacing: .18em; text-transform: uppercase; color: ${primaryColor}; margin-bottom: 16px; opacity: .9; }
  h1 { font-size: 36px; font-weight: 800; line-height: 1.1; letter-spacing: -.02em; margin-bottom: 14px; }
  .tagline { font-size: 14px; color: #888; line-height: 1.7; max-width: 480px; }
  .section { padding: 32px 40px; border-bottom: 1px solid #111; }
  .section-label { font-size: 10px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; color: #444; margin-bottom: 14px; }
  .colors { display: flex; gap: 10px; flex-wrap: wrap; }
  .color-swatch { width: 44px; height: 44px; border-radius: 10px; border: 1px solid #222; position: relative; }
  .color-label { font-size: 9px; color: #555; margin-top: 4px; text-align: center; }
  .brand-name { font-size: 28px; font-weight: 800; color: ${primaryColor}; }
  .brand-desc { font-size: 13px; color: #666; margin-top: 8px; line-height: 1.7; }
  .meta { font-size: 11px; color: #555; margin-top: 4px; }
</style>
</head>
<body>
<div class="hero">
  ${hero.eyebrow || hero.intro ? `<div class="eyebrow">${hero.eyebrow || hero.intro}</div>` : ''}
  <h1>${hero.headline || hero.title || brand.name || 'Brand Reveal'}</h1>
  ${hero.subheadline || hero.tagline ? `<div class="tagline">${hero.subheadline || hero.tagline}</div>` : ''}
</div>
${brand.name || brand.description ? `
<div class="section">
  <div class="section-label">Brand</div>
  ${brand.name ? `<div class="brand-name">${brand.name}</div>` : ''}
  ${brand.description || brand.positioning ? `<div class="brand-desc">${brand.description || brand.positioning}</div>` : ''}
  ${brand.industry ? `<div class="meta">${brand.industry}</div>` : ''}
</div>` : ''}
${colors.length ? `
<div class="section">
  <div class="section-label">Color palette</div>
  <div class="colors">
    ${(Array.isArray(colors) ? colors : []).slice(0, 8).map(c => `
      <div>
        <div class="color-swatch" style="background:${c.hex || c}"></div>
        <div class="color-label">${c.name || c.hex || c}</div>
      </div>`).join('')}
  </div>
</div>` : ''}
${normalized?.typography ? `
<div class="section">
  <div class="section-label">Typography</div>
  <div style="font-size:13px;color:#666">${normalized.typography.display || normalized.typography.heading || ''} ${normalized.typography.body ? `· ${normalized.typography.body}` : ''}</div>
</div>` : ''}
</body>
</html>`;
}

export default function PortalEditorPage() {
  const navigate = useNavigate();
  const [outputMode, setOutputMode] = useState('portal');
  const [messages, setMessages] = useState([{ role: 'assistant', content: MODE_INTRO.portal }]);
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
  const [previewMode, setPreviewMode] = useState('preview'); // 'preview' | 'json'
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
  useEffect(() => { fetchPortals(); }, []);

  const fetchPortals = async () => {
    try {
      const data = await portalsApi.list();
      setPortals(data.portals || data || []);
    } catch (e) { console.error('Failed to fetch portals', e); }
  };



  // Route to backend for OpenAI / Google (backend holds those keys)
  const callViaBackend = async (msgs) => {
    const API_URL = import.meta.env.VITE_API_URL || 'https://envision-platform-production.up.railway.app/api';
    const token = (() => { try { return JSON.parse(localStorage.getItem('envision-admin-auth'))?.state?.token || ''; } catch { return ''; } })();
    const res = await fetch(`${API_URL}/ai/builder`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ provider, model, styleMode, outputMode, messages: msgs, maxTokens: 1800 }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `API error ${res.status}`);
    return data.reply || '';
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
      // Always route through Railway backend — it holds all API keys (Anthropic, OpenAI, Google)
      const reply = await callViaBackend(newMessages);
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
      const json = extractJSON(reply);
      if (json) setExtractedJSON(json);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${String(e.message || e)}` }]);
    } finally {
      setLoading(false);
    }
  };

  const handleProviderChange = (p) => { setProvider(p); setModel(MODEL_OPTIONS[p][0].value); };
  const handleOutputModeChange = (m) => {
    setOutputMode(m); setExtractedJSON(null);
    setMessages([{ role: 'assistant', content: MODE_INTRO[m] }]); setSaveMsg('');
  };
  const handleKeyDown = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } };

  const handlePortalSelect = (val) => {
    if (val === '__new__') { navigate('/portals'); return; }
    setSelectedPortal(val);
  };

  const saveToPortal = async () => {
    if (!selectedPortal || !extractedJSON) return;
    setSaving(true); setSaveMsg('');
    try {
      const payload = normalizeBuilderPayload(outputMode, extractedJSON);
      await portalsApi.updateContent(selectedPortal, payload);
      setSaveMsg(`✓ Saved to portal`);
    } catch (err) {
      setSaveMsg(`✗ ${String(err || 'Save failed')}`);
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMsg(''), 4000);
    }
  };

  const previewHTML = extractedJSON ? buildPreviewHTML(outputMode, extractedJSON) : null;
  const normalizedJSON = extractedJSON ? normalizeBuilderPayload(outputMode, extractedJSON) : null;

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'Inter, sans-serif', background: '#F0F2F5' }}>
      {/* Left: chat panel */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Header */}
        <div style={{ padding: '16px 24px', background: '#fff', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#111827' }}>Experience Builder</div>
            <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>Multi-model builder for immersive portals and cinematic presentations</div>
          </div>
          <button onClick={() => { setMessages([{ role: 'assistant', content: MODE_INTRO[outputMode] }]); setExtractedJSON(null); }}
            style={{ fontSize: 12, color: '#6B7280', background: 'none', border: '1px solid #E5E7EB', borderRadius: 8, padding: '6px 12px', cursor: 'pointer' }}>
            New chat
          </button>
        </div>

        {/* Controls */}
        <div style={{ padding: '10px 24px', background: '#fff', borderBottom: '1px solid #E5E7EB', display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          {[
            { label: 'Output', content: (
              <select value={outputMode} onChange={e => handleOutputModeChange(e.target.value)}
                style={{ padding: '7px 10px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 12, background: '#F9FAFB', width: '100%' }}>
                {OUTPUT_MODES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            )},
            { label: 'Provider', content: (
              <select value={provider} onChange={e => handleProviderChange(e.target.value)}
                style={{ padding: '7px 10px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 12, background: '#F9FAFB', width: '100%' }}>
                <option value="anthropic">Anthropic</option>
                <option value="openai">OpenAI</option>
                <option value="google">Google</option>
              </select>
            )},
            { label: 'Model', content: (
              <select value={model} onChange={e => setModel(e.target.value)}
                style={{ padding: '7px 10px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 12, background: '#F9FAFB', width: '100%' }}>
                {MODEL_OPTIONS[provider].map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            )},
            { label: 'Art Direction', content: (
              <select value={styleMode} onChange={e => setStyleMode(e.target.value)}
                style={{ padding: '7px 10px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 12, background: '#F9FAFB', width: '100%' }}>
                {STYLE_MODES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            )},
          ].map(({ label, content }) => (
            <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 140 }}>
              <label style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: '#9CA3AF' }}>{label}</label>
              {content}
            </div>
          ))}

          <div style={{ marginLeft: 'auto', alignSelf: 'flex-end', paddingBottom: 1 }}>
            <div style={{
              fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20,
              background: provider === 'anthropic' ? '#FEF3C7' : provider === 'openai' ? '#EFF6FF' : '#F0FDF4',
              color: provider === 'anthropic' ? '#92400E' : provider === 'openai' ? '#1D4ED8' : '#166534',
            }}>
              ⚡ Via Railway
            </div>
          </div>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px 8px' }}>
          {messages.map((msg, i) => {
            const isUser = msg.role === 'user';
            return (
              <div key={i} style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', marginBottom: 14 }}>
                <div style={{
                  maxWidth: '75%', padding: '11px 15px',
                  borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  background: isUser ? '#111827' : '#fff',
                  color: isUser ? '#F9FAFB' : '#111827',
                  fontSize: 13, lineHeight: 1.6,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.07)',
                  whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                }}>{msg.content}</div>
              </div>
            );
          })}
          {loading && (
            <div style={{ display: 'flex', marginBottom: 14 }}>
              <div style={{ padding: '11px 15px', borderRadius: '16px 16px 16px 4px', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.07)' }}>
                <div style={{ display: 'flex', gap: 4 }}>
                  {[0,1,2].map(d => <div key={d} style={{ width: 6, height: 6, borderRadius: '50%', background: '#D1D5DB', animation: 'pulse 1.2s ease-in-out infinite', animationDelay: `${d * 0.2}s` }} />)}
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div style={{ padding: '14px 16px', background: '#fff', borderTop: '1px solid #E5E7EB' }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
            <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown}
              placeholder={outputMode === 'presentation'
                ? 'Describe the audience, pacing, and story arc... (Enter to send)'
                : 'Describe the client, paste content, or ask for revisions... (Enter to send)'}
              rows={3}
              style={{ flex: 1, padding: '10px 14px', borderRadius: 10, border: '1px solid #E5E7EB', fontSize: 13, fontFamily: 'Inter, sans-serif', resize: 'none', outline: 'none', lineHeight: 1.5 }} />
            <button onClick={sendMessage} disabled={loading || !input.trim()}
              style={{ padding: '10px 20px', borderRadius: 10, border: 'none', background: loading || !input.trim() ? '#E5E7EB' : '#111827', color: loading || !input.trim() ? '#9CA3AF' : '#fff', fontSize: 13, fontWeight: 700, cursor: loading || !input.trim() ? 'default' : 'pointer', whiteSpace: 'nowrap' }}>
              Send
            </button>
          </div>
        </div>
      </div>

      {/* Right: preview + save panel */}
      <div style={{ width: 400, background: '#fff', borderLeft: '1px solid #E5E7EB', display: 'flex', flexDirection: 'column' }}>
        {/* Save header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #E5E7EB' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>Save to Portal</div>
          <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>Push generated content to a live client experience</div>
        </div>

        {/* Portal selector */}
        <div style={{ padding: '14px 16px', borderBottom: '1px solid #E5E7EB' }}>
          <label style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: '#9CA3AF', display: 'block', marginBottom: 6 }}>Target portal</label>
          <select value={selectedPortal || ''} onChange={e => handlePortalSelect(e.target.value)}
            style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 13, color: '#111827', background: '#F9FAFB', outline: 'none' }}>
            <option value="">Select a portal...</option>
            {portals.map(p => (
              <option key={p.id} value={p.id}>{p.client_name || p.slug} ({p.status || 'draft'})</option>
            ))}
            <option value="__new__" style={{ color: '#3B82F6', fontWeight: 600 }}>+ Create new portal →</option>
          </select>
        </div>

        {/* Preview / JSON toggle */}
        {extractedJSON && (
          <div style={{ padding: '10px 16px', borderBottom: '1px solid #E5E7EB', display: 'flex', gap: 4 }}>
            <div style={{ display: 'flex', background: '#F3F4F6', borderRadius: 8, padding: 3, gap: 2 }}>
              {['preview', 'json'].map(mode => (
                <button key={mode} onClick={() => setPreviewMode(mode)} style={{
                  padding: '5px 14px', borderRadius: 6, border: 'none', fontSize: 11, fontWeight: 600, cursor: 'pointer',
                  background: previewMode === mode ? '#fff' : 'transparent',
                  color: previewMode === mode ? '#111827' : '#9CA3AF',
                  boxShadow: previewMode === mode ? '0 1px 3px rgba(0,0,0,.1)' : 'none',
                }}>
                  {mode === 'preview' ? '👁 Preview' : '</> JSON'}
                </button>
              ))}
            </div>
            <div style={{ marginLeft: 'auto', fontSize: 11, color: '#10B981', fontWeight: 700, alignSelf: 'center' }}>✓ Content ready</div>
          </div>
        )}

        {/* Preview area */}
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {extractedJSON ? (
            previewMode === 'preview' && previewHTML ? (
              <iframe
                srcDoc={previewHTML}
                style={{ flex: 1, border: 'none', width: '100%' }}
                sandbox="allow-scripts"
                title="Portal Preview"
              />
            ) : (
              <pre style={{ flex: 1, overflow: 'auto', fontSize: 10, color: '#6B7280', background: '#F9FAFB', padding: 14, lineHeight: 1.5, margin: 0 }}>
                {JSON.stringify(normalizedJSON, null, 2)}
              </pre>
            )
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
              <div style={{ textAlign: 'center', color: '#9CA3AF', fontSize: 12, lineHeight: 1.7 }}>
                <div style={{ fontSize: 28, marginBottom: 12 }}>✦</div>
                Ask the AI to generate {outputMode === 'presentation' ? 'a presentation deck' : 'portal content'} and a live preview will appear here.
              </div>
            </div>
          )}
        </div>

        {/* Push button */}
        <div style={{ padding: '14px 16px', borderTop: '1px solid #E5E7EB' }}>
          <button onClick={saveToPortal} disabled={!extractedJSON || !selectedPortal || saving}
            style={{ width: '100%', padding: 12, borderRadius: 10, border: 'none',
              background: !extractedJSON || !selectedPortal ? '#E5E7EB' : '#111827',
              color: !extractedJSON || !selectedPortal ? '#9CA3AF' : '#fff',
              fontSize: 13, fontWeight: 700, cursor: !extractedJSON || !selectedPortal ? 'default' : 'pointer' }}>
            {saving ? 'Saving...' : `Push ${outputMode === 'presentation' ? 'presentation' : 'portal'} →`}
          </button>
          {saveMsg && <div style={{ marginTop: 8, fontSize: 12, textAlign: 'center', color: saveMsg.startsWith('✓') ? '#10B981' : '#EF4444' }}>{saveMsg}</div>}
        </div>
      </div>

      <style>{`@keyframes pulse { 0%,100%{opacity:.3} 50%{opacity:1} }`}</style>
    </div>
  );
}
