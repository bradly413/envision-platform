import { useState, useRef, useEffect } from 'react';
import { portals as portalsApi, designSystems as dsApi } from '../lib/api';
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
  portal: `Hi! I'm your Envision brand director. To generate a cinematic portal that matches the Jazz Club quality, I need a few things:

**Drop any of these and I'll get started:**
- Client name + website URL (I'll auto-fetch their brand)
- A PDF or pasted branding brief
- A description: industry, audience, brand personality, colors they love/hate
- Competitors they want to stand apart from

**The more context you give, the more specific the output.** I'll use your brief to extract real positioning, audience psychographics, color palette, typography, and brand differentiators — then generate a full cinematic portal with immersive animations, shader backgrounds, and scroll effects.`,

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
  const [rightTab, setRightTab] = useState('save'); // 'save' | 'design-systems'
  const [designSystems, setDesignSystems] = useState([]);
  const [selectedDS, setSelectedDS] = useState(null);
  const [savingDS, setSavingDS] = useState(false);
  const [dsSaveMsg, setDSSaveMsg] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
  useEffect(() => { fetchPortals(); fetchDesignSystems(); }, []);

  const fetchPortals = async () => {
    try {
      const data = await portalsApi.list();
      setPortals(data.portals || data || []);
    } catch (e) { console.error('Failed to fetch portals', e); }
  };

  const fetchDesignSystems = async () => {
    try {
      const data = await dsApi.list();
      setDesignSystems(Array.isArray(data) ? data : []);
    } catch (e) { console.error('Failed to fetch design systems', e); }
  };

  const saveAsDesignSystem = async (portal) => {
    setSavingDS(true); setDSSaveMsg('');
    try {
      const name = `${portal.client_name || portal.slug} Design System`;
      await dsApi.fromPortal(portal.id, { name });
      await fetchDesignSystems();
      setDSSaveMsg(`✓ Saved "${name}"`);
    } catch (e) { setDSSaveMsg('✗ Could not save design system'); }
    setSavingDS(false);
    setTimeout(() => setDSSaveMsg(''), 3000);
  };

  const applyDesignSystem = (ds) => {
    setSelectedDS(ds);
    // Inject DS context into the next message
    const dsContext = `[DESIGN SYSTEM APPLIED: "${ds.name}"]
Experience preset: ${ds.experience?.preset || 'cinematic-editorial'}
Background: base ${ds.experience?.background?.base || '#090909'}, gradients from brand colors
Hero effects: ${(ds.experience?.heroEffects || ['shader-background','title-reveal','slow-zoom']).join(', ')}
Color palette: ${JSON.stringify(ds.colors?.slice?.(0,4) || ds.colors || [])}
Typography: ${JSON.stringify(ds.typography?.fonts?.slice?.(0,2) || [])}
Copy style signals: ${JSON.stringify(ds.copy_style || {})}

IMPORTANT: Keep this exact experience/visual system. Only change the client name, copy, positioning, colors, and typography to match the new client. Maintain the same cinematic quality, motion level, and structural DNA.`;
    setInput(prev => prev ? prev + '\n\n' + dsContext : dsContext);
    setRightTab('save');
  };

  const deleteDS = async (id) => {
    if (!window.confirm('Delete this design system?')) return;
    try { await dsApi.delete(id); await fetchDesignSystems(); } catch (e) { console.error(e); }
  };



  // Route to backend for OpenAI / Google (backend holds those keys)
  const callViaBackend = async (msgs) => {
    const API_URL = import.meta.env.VITE_API_URL || 'https://envision-platform-production.up.railway.app/api';
    const token = (() => { try { return JSON.parse(localStorage.getItem('envision-admin-auth'))?.state?.token || ''; } catch { return ''; } })();
    const res = await fetch(`${API_URL}/ai/builder`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ provider, model, styleMode, outputMode, messages: msgs, maxTokens: 3000 }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `API error ${res.status}`);
    return data.reply || '';
  };

  // Extract URL from message and fetch site content via backend
  const enrichWithURL = async (text) => {
    const urlMatch = text.match(/https?:\/\/[^\s]+/);
    if (!urlMatch) return text;
    const url = urlMatch[0];
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'https://envision-platform-production.up.railway.app/api';
      const token = (() => { try { return JSON.parse(localStorage.getItem('envision-admin-auth'))?.state?.token || ''; } catch { return ''; } })();
      const res = await fetch(`${API_URL}/uploads/fetch-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ url })
      });
      if (!res.ok) return text;
      const data = await res.json();
      if (data.content) {
        return `${text}

[SITE CONTENT FROM ${url}]
${data.content.substring(0, 2000)}
[END SITE CONTENT]

Use the above site content to extract the brand's real name, colors, tone, typography, and positioning for the portal.`;
      }
    } catch (e) { /* URL fetch failed, proceed without */ }
    return text;
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    setLoading(true);
    setExtractedJSON(null);

    // Enrich with URL content if a URL is detected
    const enrichedInput = await enrichWithURL(input.trim());
    const userMsg = { role: 'user', content: enrichedInput };
    const displayMsg = { role: 'user', content: input.trim() }; // show clean version in chat
    const newMessages = [...messages, userMsg];
    setMessages(prev => [...prev, displayMsg]);
    setInput('');

    try {
      // Always route through Railway backend — it holds all API keys (Anthropic, OpenAI, Google)
      const reply = await callViaBackend(newMessages);
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
      const json = extractJSON(reply);
      if (json) {
        setExtractedJSON(json);
        setPreviewMode('preview'); // auto-switch to preview when content arrives
      }
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
        <div style={{ padding: '12px 16px', background: '#fff', borderTop: '1px solid #E5E7EB' }}>
          {/* Quick context chips */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
            {[
              { label: '📋 Brand brief', text: 'Create a cinematic portal using this branding brief:\n\n' },
              { label: '🔗 From URL', text: 'Analyze this website and create a cinematic portal: ' },
              { label: '🎨 Luxury brand', text: 'Create a luxury cinematic portal for ' },
              { label: '⚡ Bold campaign', text: 'Create a bold campaign-style portal for ' },
              { label: '🏙 Culture/venue', text: 'Create an immersive culture portal for ' },
            ].map(chip => (
              <button key={chip.label} onClick={() => setInput(prev => prev ? prev : chip.text)}
                style={{ fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 20, border: '1px solid #E5E7EB', background: '#F9FAFB', cursor: 'pointer', color: '#6B7280', whiteSpace: 'nowrap' }}
                onMouseOver={e => { e.currentTarget.style.background = '#F3F4F6'; e.currentTarget.style.color = '#111827'; }}
                onMouseOut={e => { e.currentTarget.style.background = '#F9FAFB'; e.currentTarget.style.color = '#6B7280'; }}>
                {chip.label}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
            <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown}
              placeholder={outputMode === 'presentation'
                ? 'Describe the client, audience, and story arc... paste a brief, or drop a URL (Enter to send)'
                : 'Describe the client, paste a branding brief, drop a URL, or ask for revisions... (Enter to send)'}
              rows={3}
              style={{ flex: 1, padding: '10px 14px', borderRadius: 10, border: '1px solid #E5E7EB', fontSize: 13, fontFamily: 'Inter, sans-serif', resize: 'none', outline: 'none', lineHeight: 1.5 }} />
            <button onClick={sendMessage} disabled={loading || !input.trim()}
              style={{ padding: '10px 20px', borderRadius: 10, border: 'none', background: loading || !input.trim() ? '#E5E7EB' : '#111827', color: loading || !input.trim() ? '#9CA3AF' : '#fff', fontSize: 13, fontWeight: 700, cursor: loading || !input.trim() ? 'default' : 'pointer', whiteSpace: 'nowrap' }}>
              Send
            </button>
          </div>
        </div>
      </div>

      {/* Right: tabbed panel */}
      <div style={{ width: 420, background: '#fff', borderLeft: '1px solid #E5E7EB', display: 'flex', flexDirection: 'column' }}>

        {/* Tab bar */}
        <div style={{ display: 'flex', borderBottom: '1px solid #E5E7EB', background: '#FAFAFA' }}>
          {[
            { id: 'save', label: 'Save to Portal' },
            { id: 'design-systems', label: '✦ Design Systems' },
          ].map(tab => (
            <button key={tab.id} onClick={() => setRightTab(tab.id)} style={{
              flex: 1, padding: '12px 8px', border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer',
              background: rightTab === tab.id ? '#fff' : 'transparent',
              color: rightTab === tab.id ? '#111827' : '#9CA3AF',
              borderBottom: rightTab === tab.id ? '2px solid #111827' : '2px solid transparent',
              transition: 'all .1s',
            }}>{tab.label}</button>
          ))}
        </div>

        {/* ====== SAVE TAB ====== */}
        {rightTab === 'save' && (<>
          {selectedDS && (
            <div style={{ padding: '10px 16px', background: '#F0FDF4', borderBottom: '1px solid #BBF7D0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 11, color: '#166534' }}>
                <span style={{ fontWeight: 700 }}>✦ DS:</span> {selectedDS.name}
              </div>
              <button onClick={() => setSelectedDS(null)}
                style={{ fontSize: 11, color: '#6B7280', background: 'none', border: 'none', cursor: 'pointer' }}>Remove</button>
            </div>
          )}
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
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {extractedJSON ? (
              previewMode === 'preview' && previewHTML ? (
                <iframe srcDoc={previewHTML} style={{ flex: 1, border: 'none', width: '100%' }} sandbox="allow-scripts" title="Portal Preview" />
              ) : (
                <pre style={{ flex: 1, overflow: 'auto', fontSize: 10, color: '#6B7280', background: '#F9FAFB', padding: 14, lineHeight: 1.5, margin: 0 }}>
                  {JSON.stringify(normalizedJSON, null, 2)}
                </pre>
              )
            ) : (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
                <div style={{ textAlign: 'center', color: '#9CA3AF', fontSize: 12, lineHeight: 1.7 }}>
                  <div style={{ fontSize: 28, marginBottom: 12 }}>✦</div>
                  Ask the AI to generate portal content and a live preview will appear here.
                </div>
              </div>
            )}
          </div>
          <div style={{ padding: '14px 16px', borderTop: '1px solid #E5E7EB' }}>
            {extractedJSON && !selectedPortal && (
              <div style={{ marginBottom: 8, fontSize: 12, color: '#F59E0B', fontWeight: 600, textAlign: 'center' }}>
                ↑ Select a target portal above to push
              </div>
            )}
            <button onClick={saveToPortal} disabled={!extractedJSON || !selectedPortal || saving}
              style={{ width: '100%', padding: 13, borderRadius: 10, border: 'none',
                background: extractedJSON && selectedPortal ? '#111827' : '#E5E7EB',
                color: extractedJSON && selectedPortal ? '#fff' : '#9CA3AF',
                fontSize: 13, fontWeight: 700,
                cursor: extractedJSON && selectedPortal ? 'pointer' : 'default',
                animation: extractedJSON && selectedPortal && !saving ? 'readyPulse 2s ease-in-out 3' : 'none',
                transition: 'background .2s' }}>
              {saving ? 'Pushing to portal...' : 'Push portal →'}
            </button>
            {saveMsg && (
              <div style={{ marginTop: 8, fontSize: 12, textAlign: 'center', fontWeight: 600, color: saveMsg.startsWith('✓') ? '#10B981' : '#EF4444' }}>
                {saveMsg}
              </div>
            )}
          </div>
        </>)}

        {/* ====== DESIGN SYSTEMS TAB ====== */}
        {rightTab === 'design-systems' && (
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
            <div style={{ padding: '14px 16px', borderBottom: '1px solid #E5E7EB' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#111827', marginBottom: 2 }}>✦ Design Systems</div>
              <div style={{ fontSize: 11, color: '#9CA3AF' }}>Save a portal's visual DNA. Apply it to any new client — same cinematic quality, different brand.</div>
            </div>

            {/* Save active portals as DS */}
            {portals.filter(p => p.status === 'active').length > 0 && (
              <div style={{ padding: '12px 16px', borderBottom: '1px solid #F3F4F6', background: '#FAFAFA' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 8 }}>Save as design system</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {portals.filter(p => p.status === 'active').map(p => (
                    <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', background: '#fff', borderRadius: 8, border: '1px solid #E5E7EB' }}>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: '#111827' }}>{p.client_name || p.slug}</div>
                        <div style={{ fontSize: 10, color: '#9CA3AF' }}>/{p.slug} • {p.status}</div>
                      </div>
                      <button onClick={() => saveAsDesignSystem(p)} disabled={savingDS}
                        style={{ fontSize: 11, fontWeight: 700, padding: '5px 12px', borderRadius: 6, border: 'none', background: '#111827', color: '#fff', cursor: savingDS ? 'default' : 'pointer' }}>
                        {savingDS ? '...' : 'Save DS'}
                      </button>
                    </div>
                  ))}
                </div>
                {dsSaveMsg && <div style={{ marginTop: 6, fontSize: 11, fontWeight: 600, color: dsSaveMsg.startsWith('✓') ? '#10B981' : '#EF4444' }}>{dsSaveMsg}</div>}
              </div>
            )}

            {/* DS List */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
              {designSystems.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                  <div style={{ fontSize: 32, marginBottom: 12 }}>✦</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>No design systems yet</div>
                  <div style={{ fontSize: 11, color: '#9CA3AF', lineHeight: 1.6 }}>Save the Jazz Club portal (or any active portal) as a design system. Its colors, typography, motion language, and cinematic experience will be saved and can be applied to any new client.</div>
                </div>
              ) : designSystems.map(ds => {
                const isActive = selectedDS && selectedDS.id === ds.id;
                const colors = Array.isArray(ds.colors) ? ds.colors : [];
                const fonts = ds.typography && ds.typography.fonts ? ds.typography.fonts : [];
                return (
                  <div key={ds.id} style={{ marginBottom: 12, borderRadius: 12, border: isActive ? '2px solid #111827' : '1px solid #E5E7EB', overflow: 'visible', transition: 'border .15s', position: 'relative' }}>
                    {/* Color strip */}
                    <div style={{ height: 5, borderRadius: '10px 10px 0 0', background: colors.length > 1
                      ? 'linear-gradient(to right, ' + colors.slice(0,5).map(c => c.hex || c).join(', ') + ')'
                      : (ds.thumbnail_color || '#d4af37') }} />

                    <div style={{ padding: '12px 14px 14px' }}>
                      {/* Header */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{ds.name}</div>
                          {ds.description && <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 1 }}>{ds.description}</div>}
                        </div>
                        <button onClick={() => deleteDS(ds.id)} title="Delete"
                          style={{ fontSize: 14, color: '#D1D5DB', background: 'none', border: 'none', cursor: 'pointer', lineHeight: 1, padding: '0 2px' }}
                          onMouseOver={e => e.currentTarget.style.color = '#EF4444'}
                          onMouseOut={e => e.currentTarget.style.color = '#D1D5DB'}>
                          ×
                        </button>
                      </div>

                      {/* Color swatches */}
                      {colors.length > 0 && (
                        <div style={{ display: 'flex', gap: 4, marginBottom: 8, alignItems: 'center' }}>
                          {colors.slice(0, 7).map((c, i) => (
                            <div key={i} title={c.name || c.hex || ''} style={{ width: 16, height: 16, borderRadius: 3, background: c.hex || c, border: '1px solid rgba(0,0,0,.1)', flexShrink: 0 }} />
                          ))}
                          {colors.length > 7 && <span style={{ fontSize: 10, color: '#9CA3AF' }}>+{colors.length - 7}</span>}
                        </div>
                      )}

                      {/* Tags */}
                      <div style={{ display: 'flex', gap: 5, marginBottom: 10, flexWrap: 'wrap' }}>
                        {ds.experience && ds.experience.preset && (
                          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: '#F3F4F6', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '.05em' }}>
                            {ds.experience.preset}
                          </span>
                        )}
                        {ds.experience && ds.experience.motionLevel && (
                          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: '#FEF3C7', color: '#92400E' }}>
                            {ds.experience.motionLevel}
                          </span>
                        )}
                        {fonts[0] && fonts[0].typeface && (
                          <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: '#F3F4F6', color: '#6B7280' }}>
                            {fonts[0].typeface}
                          </span>
                        )}
                        {fonts[1] && fonts[1].typeface && (
                          <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: '#F3F4F6', color: '#9CA3AF' }}>
                            {fonts[1].typeface}
                          </span>
                        )}
                      </div>

                      {/* Hero effects preview */}
                      {ds.experience && ds.experience.heroEffects && ds.experience.heroEffects.length > 0 && (
                        <div style={{ fontSize: 10, color: '#9CA3AF', marginBottom: 10 }}>
                          ☄ {ds.experience.heroEffects.join(' · ')}
                        </div>
                      )}

                      {/* Apply button */}
                      <button onClick={() => applyDesignSystem(ds)}
                        style={{ width: '100%', padding: '9px 0', borderRadius: 8, border: 'none',
                          background: isActive ? '#10B981' : '#111827',
                          color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                          transition: 'background .15s' }}>
                        {isActive ? '✓ Applied — go to chat →' : 'Apply to next portal'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
      <style>{`@keyframes pulse { 0%,100%{opacity:.3} 50%{opacity:1} }`}</style>
    </div>
  );
}
