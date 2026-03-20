import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { portals } from '../lib/api';
import api from '../lib/api';

const PORTAL_URL = import.meta.env.VITE_PORTAL_URL || 'https://marvelous-belekoy-63770f.netlify.app';
const API_URL = import.meta.env.VITE_API_URL || 'https://envision-platform-production.up.railway.app/api';

// ─── System prompt ────────────────────────────────────────────────────────────
const makeSystemPrompt = (portal) => `You are an AI creative director and web developer helping build a premium client brand reveal portal for ${portal?.client_name || 'a client'} at Bradley Robert Creative, a brand design agency.

You have TWO modes:

MODE 1 — CONTENT UPDATE (default): Update text, colors, fonts, brand copy in the structured sections.
MODE 2 — CUSTOM HTML: Generate a complete self-contained HTML page when the user explicitly asks for "custom HTML", "full HTML", "animations", "custom template", "custom layout", or references wanting something like a specific website's design/animations.

CRITICAL: When the user asks for custom HTML or animations, you MUST use FORMAT B and generate a COMPLETE working HTML file. Do not use FORMAT A for these requests.

Always respond with valid JSON only:

FORMAT A — Content update (text/colors/copy changes):
{"type":"content","message":"What changed","content":{...full content object...},"suggestions":["s1","s2","s3"]}

FORMAT B — Custom HTML (animations, custom layouts, full redesigns):
{"type":"html","message":"What you built","html":"<!DOCTYPE html><html lang=\\"en\\"><head>...</head><body>...</body></html>","suggestions":["s1","s2","s3"]}

FORMAT C — Chat only:
{"type":"chat","message":"Your response","suggestions":["s1","s2"]}

Content object structure:
{"hero":{"headline":"","subheadline":"","intro":""},"brand":{"headline":"","positioning":"","pillars":[{"title":"","desc":""}]},"logo":{"headline":"","description":"","variations":[]},"colors":{"headline":"","palette":[{"name":"","hex":"#000000","role":""}]},"typography":{"headline":"","primaryFont":"","secondaryFont":"","usage":""},"sections":[]}

For FORMAT B custom HTML:
- Write a COMPLETE HTML file with all CSS inline in <style> tags and JS inline in <script> tags
- Use Google Fonts via @import in the style tag
- Include smooth scroll reveal animations using Intersection Observer or CSS animations
- Dark background (#0F0F0F or similar), premium typography, immersive full-screen sections
- Sections: hero (full viewport), brand story, color palette (visual swatches), typography showcase, logo presentation, approval CTA
- Use the client name "${portal?.client_name}" and brand content throughout
- This will be rendered directly in an iframe — make it fully self-contained`;

// ─── Live preview ─────────────────────────────────────────────────────────────
function LivePreview({ content, customHtml, clientName, previewMode, setPreviewMode }) {
  const iframeRef = useRef(null);

  useEffect(() => {
    if (customHtml && iframeRef.current) {
      const doc = iframeRef.current.contentDocument;
      doc.open();
      doc.write(customHtml);
      doc.close();
    }
  }, [customHtml]);

  const c = content || {};

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#0F0F0F' }}>
      {/* Preview toolbar */}
      <div style={{ padding: '8px 16px', background: '#0D0D0D', borderBottom: '1px solid #1E1E1E', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: 5 }}>{['#FF5F57','#FFBD2E','#28C840'].map(col => <div key={col} style={{ width: 9, height: 9, borderRadius: '50%', background: col }} />)}</div>
        <div style={{ flex: 1, background: '#111', borderRadius: 4, padding: '3px 10px', fontSize: 10, color: '#4B5563', fontFamily: 'monospace' }}>
          {PORTAL_URL}/{clientName?.toLowerCase().replace(/\s+/g,'-')}
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {['content', 'html'].map(mode => (
            <button key={mode} onClick={() => setPreviewMode(mode)}
              style={{ fontSize: 10, padding: '3px 8px', background: previewMode === mode ? '#374151' : 'transparent', color: previewMode === mode ? '#F9FAFB' : '#4B5563', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em' }}>
              {mode === 'content' ? 'Sections' : 'Custom'}
            </button>
          ))}
        </div>
      </div>

      {/* Preview content */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        {previewMode === 'html' && customHtml ? (
          <iframe ref={iframeRef} style={{ width: '100%', height: '100%', border: 'none' }} title="Portal preview" />
        ) : (
          <div style={{ height: '100%', overflowY: 'auto', fontFamily: 'Inter, sans-serif' }}>
            {/* Hero */}
            <div style={{ padding: '48px 24px', textAlign: 'center', borderBottom: '1px solid #1A1A1A', background: 'radial-gradient(ellipse at center, #1A1A2E 0%, #0F0F0F 70%)' }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.2em', textTransform: 'uppercase', color: '#6B7280', marginBottom: 16 }}>Bradley Robert Creative · Brand Reveal</div>
              <h1 style={{ fontSize: 'clamp(24px, 4vw, 48px)', fontWeight: 800, color: '#F9FAFB', lineHeight: 1.15, margin: '0 0 16px' }}>
                {c.hero?.headline || clientName},<br />
                <span style={{ color: '#9CA3AF' }}>{c.hero?.subheadline || 'meet your new brand.'}</span>
              </h1>
              {c.hero?.intro && <p style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.7, margin: '0 auto', maxWidth: 480 }}>{c.hero.intro}</p>}
            </div>

            {/* Brand */}
            {c.brand?.positioning && (
              <div style={{ padding: '28px 24px', borderBottom: '1px solid #1A1A1A' }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: '#3B82F6', marginBottom: 10 }}>Brand Strategy</div>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: '#F9FAFB', margin: '0 0 10px' }}>{c.brand.headline}</h2>
                <p style={{ fontSize: 13, color: '#9CA3AF', lineHeight: 1.7, margin: '0 0 14px' }}>{c.brand.positioning}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {(c.brand.pillars || []).map((p, i) => (
                    <div key={i} style={{ borderLeft: '2px solid #374151', paddingLeft: 12 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#F9FAFB' }}>{p.title}</div>
                      <div style={{ fontSize: 12, color: '#6B7280' }}>{p.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Colors */}
            {c.colors?.palette?.length > 0 && (
              <div style={{ padding: '28px 24px', borderBottom: '1px solid #1A1A1A' }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: '#F59E0B', marginBottom: 10 }}>Color Palette</div>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: '#F9FAFB', margin: '0 0 14px' }}>{c.colors.headline}</h2>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {c.colors.palette.map((color, i) => (
                    <div key={i} style={{ width: 60 }}>
                      <div style={{ height: 44, borderRadius: 6, background: color.hex, marginBottom: 5, border: '1px solid rgba(255,255,255,.06)' }} />
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#F9FAFB' }}>{color.name}</div>
                      <div style={{ fontSize: 9, color: '#6B7280', fontFamily: 'monospace' }}>{color.hex}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Typography */}
            {c.typography?.primaryFont && (
              <div style={{ padding: '28px 24px', borderBottom: '1px solid #1A1A1A' }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: '#EF4444', marginBottom: 10 }}>Typography</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#F9FAFB', marginBottom: 4 }}>{c.typography.primaryFont}</div>
                {c.typography.secondaryFont && <div style={{ fontSize: 16, color: '#9CA3AF', marginBottom: 8 }}>{c.typography.secondaryFont}</div>}
                {c.typography.usage && <p style={{ fontSize: 12, color: '#6B7280', margin: 0, lineHeight: 1.6 }}>{c.typography.usage}</p>}
              </div>
            )}

            {/* CTA */}
            <div style={{ padding: '48px 24px', textAlign: 'center' }}>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: '#F9FAFB', margin: '0 0 12px' }}>What do you think?</h2>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                <div style={{ padding: '10px 20px', background: '#F9FAFB', color: '#111', borderRadius: 8, fontSize: 13, fontWeight: 700 }}>Approve ✓</div>
                <div style={{ padding: '10px 20px', border: '1px solid #374151', color: '#9CA3AF', borderRadius: 8, fontSize: 13 }}>Request changes</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Message bubble ───────────────────────────────────────────────────────────
function Message({ msg, initials }) {
  const isUser = msg.role === 'user';
  return (
    <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexDirection: isUser ? 'row-reverse' : 'row', alignItems: 'flex-start' }}>
      <div style={{ width: 28, height: 28, borderRadius: '50%', background: isUser ? '#111827' : '#6366F1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
        {isUser ? (initials || 'B') : '✦'}
      </div>
      <div style={{ maxWidth: '80%' }}>
        {msg.imageUrl && <img src={msg.imageUrl} alt="uploaded" style={{ maxWidth: '100%', borderRadius: 8, marginBottom: 6, display: 'block' }} />}
        <div style={{ fontSize: 13, background: isUser ? '#111827' : '#F3F4F6', color: isUser ? '#F9FAFB' : '#111827', padding: '10px 14px', borderRadius: isUser ? '12px 12px 4px 12px' : '12px 12px 12px 4px', lineHeight: 1.6 }}>
          {msg.content}
        </div>
        {msg.changed && <div style={{ fontSize: 10, color: '#10B981', marginTop: 3, fontWeight: 600 }}>✓ Portal updated</div>}
        {msg.htmlGenerated && <div style={{ fontSize: 10, color: '#6366F1', marginTop: 3, fontWeight: 600 }}>✦ Custom template generated</div>}
      </div>
    </div>
  );
}

// ─── Project settings panel ───────────────────────────────────────────────────
function SettingsPanel({ portal, onClose }) {
  const [status, setStatus] = useState(portal.status || 'draft');
  const qc = useQueryClient();
  const saveMutation = useMutation(data => portals.update(portal.id, data), {
    onSuccess: () => { qc.invalidateQueries('portals'); qc.invalidateQueries(['portal', portal.id]); onClose(); }
  });
  const inp = { width: '100%', boxSizing: 'border-box', padding: '8px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, outline: 'none', fontFamily: 'Inter, sans-serif' };
  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,.4)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
      <div style={{ background: '#fff', borderRadius: 14, padding: 28, width: 380, boxShadow: '0 20px 60px rgba(0,0,0,.15)' }} onClick={e => e.stopPropagation()}>
        <div style={{ fontSize: 15, fontWeight: 800, color: '#111827', marginBottom: 20 }}>Portal settings</div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 5 }}>Client</label>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>{portal.client_name}</div>
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 5 }}>Portal URL</label>
          <div style={{ fontSize: 12, fontFamily: 'monospace', color: '#6B7280', background: '#F3F4F6', padding: '6px 10px', borderRadius: 6 }}>{PORTAL_URL}/{portal.slug}</div>
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 8 }}>Status</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {['draft', 'active', 'archived'].map(s => (
              <button key={s} onClick={() => setStatus(s)}
                style={{ fontSize: 12, fontWeight: 600, padding: '6px 14px', borderRadius: 20, border: 'none', cursor: 'pointer', textTransform: 'capitalize', background: status === s ? '#111827' : '#F3F4F6', color: status === s ? '#fff' : '#6B7280' }}>
                {s}
              </button>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
          <button onClick={() => saveMutation.mutate({ status })} style={{ flex: 1, padding: '9px', background: '#111827', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Save</button>
          <button onClick={onClose} style={{ padding: '9px 16px', background: '#F3F4F6', border: 'none', borderRadius: 8, fontSize: 13, color: '#6B7280', cursor: 'pointer' }}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function PortalEditorPage() {
  const { portalId } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  const { data: portalDirect } = useQuery(['portal', portalId], () => portals.get(portalId), { retry: false });
  const { data: allPortals = [] } = useQuery('portals', portals.list, { enabled: !portalDirect });
  const portal = portalDirect || allPortals.find(p => String(p.id) === String(portalId));

  const [content, setContent] = useState(null);
  const [customHtml, setCustomHtml] = useState('');
  const [previewMode, setPreviewMode] = useState('content');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState('idle');
  const [showSettings, setShowSettings] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [uploadingFile, setUploadingFile] = useState(false);

  useEffect(() => {
    if (!portal) return;
    const c = portal.content || {};
    setContent({
      hero: c.hero || { headline: '', subheadline: 'meet your new brand.', intro: '' },
      brand: c.brand || { headline: 'The story behind the brand.', positioning: '', pillars: [] },
      logo: c.logo || { headline: 'The mark.', description: '', variations: [] },
      colors: c.colors || { headline: 'The palette.', palette: [] },
      typography: c.typography || { headline: 'The voice in text.', primaryFont: '', secondaryFont: '', usage: '' },
      sections: c.sections || [],
    });
    if (c.customHtml) { setCustomHtml(c.customHtml); setPreviewMode('html'); }
    setMessages([{
      role: 'assistant',
      content: `I'm ready to build the ${portal.client_name} portal. You can describe what you want, paste a URL for me to analyze, or upload images and I'll build around them.`,
    }]);
    setSuggestions([
      `Generate a full brand reveal for ${portal.client_name}`,
      'Paste a URL to inspire the design',
      'Upload a logo or brand asset',
      'Build a dark, cinematic presentation',
    ]);
  }, [portal?.id]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const saveMutation = useMutation(data => portals.update(portalId, data), {
    onMutate: () => setSaveStatus('saving'),
    onSuccess: () => { setSaveStatus('saved'); qc.invalidateQueries('portals'); qc.invalidateQueries(['portal', portalId]); setTimeout(() => setSaveStatus('idle'), 2500); },
    onError: () => { setSaveStatus('error'); setTimeout(() => setSaveStatus('idle'), 3000); },
  });

  const handleSave = () => saveMutation.mutate({ content: { ...content, customHtml } });

  const callClaude = async (userMessage, extraContext = '') => {
    const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error('VITE_ANTHROPIC_API_KEY not set in Netlify environment variables');

    const isHtmlRequest = /custom html|full html|animation|custom template|custom layout|custom version|generate.*html|html version/i.test(userMessage);

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: isHtmlRequest ? 8000 : 2000,
        system: makeSystemPrompt(portal),
        messages: [
          ...messages.slice(-4).filter(m => m.role === 'user' || m.role === 'assistant').map(m => ({ role: m.role, content: m.content })),
          { role: 'user', content: `Current content:\n${JSON.stringify(content)}\n${extraContext}\n\nRequest: ${userMessage}` }
        ],
      }),
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error.message);
    const raw = data.content?.[0]?.text || '';
    // Try to extract JSON more robustly
    try {
      const match = raw.match(/\{[\s\S]*\}/);
      if (match) return JSON.parse(match[0]);
    } catch {
      // If JSON parse fails, try to extract just the message
      const msgMatch = raw.match(/"message"\s*:\s*"([^"]+)"/);
      return { type: 'chat', message: msgMatch?.[1] || raw.substring(0, 300), suggestions: [] };
    }
    return { type: 'chat', message: raw.substring(0, 300), suggestions: [] };
  };

  const handleSend = async (messageText) => {
    const text = messageText || input;
    if (!text.trim() || loading) return;
    setInput('');
    setSuggestions([]);
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setLoading(true);

    try {
      // Detect URL in message
      const urlMatch = text.match(/https?:\/\/[^\s]+/);
      let extraContext = '';

      if (urlMatch) {
        setMessages(prev => [...prev, { role: 'assistant', content: `Fetching ${urlMatch[0]}…` }]);
        try {
          const fetchRes = await api.post('/uploads/fetch-url', { url: urlMatch[0] });
          extraContext = `\n\nURL Design Analysis of ${urlMatch[0]}:\nSite title: ${fetchRes.title}\nColor palette found: ${fetchRes.colors?.join(', ')}\nFonts found: ${fetchRes.fonts?.join(', ')}\nAnimation richness: ${fetchRes.animationCount > 10 ? 'highly animated' : fetchRes.animationCount > 3 ? 'moderate animations' : 'minimal animations'}\nHas parallax/scroll effects: ${fetchRes.hasParallax ? 'yes' : 'no'}\nHas video: ${fetchRes.hasVideo ? 'yes' : 'no'}\nPage structure snippet: ${fetchRes.html?.substring(0, 1500)}\n\nPlease analyze this design style and apply similar aesthetic principles to the portal.`;
          setMessages(prev => prev.slice(0, -1)); // Remove "Fetching..." message
        } catch { extraContext = `\n\nNote: Could not fetch URL ${urlMatch[0]} — proceed based on description.`; }
      }

      const parsed = await callClaude(text, extraContext);

      if (parsed.type === 'content' && parsed.content) {
        const newContent = { ...content, ...parsed.content };
        setContent(newContent);
        setPreviewMode('content');
        saveMutation.mutate({ content: { ...newContent, customHtml } });
      } else if (parsed.type === 'html' && parsed.html) {
        setCustomHtml(parsed.html);
        setPreviewMode('html');
        saveMutation.mutate({ content: { ...content, customHtml: parsed.html } });
      }

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: parsed.message || 'Done!',
        changed: parsed.type === 'content',
        htmlGenerated: parsed.type === 'html',
      }]);

      if (parsed.suggestions?.length) setSuggestions(parsed.suggestions);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${err.message}` }]);
    } finally { setLoading(false); }
  };

  const handleFileUpload = async (file) => {
    setShowAttachMenu(false);
    setUploadingFile(true);
    setMessages(prev => [...prev, { role: 'user', content: `Uploading ${file.name}…` }]);

    try {
      const formData = new FormData();
      formData.append('file', file);
      const uploadRes = await fetch(`${API_URL}/uploads/asset`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token') || ''}` },
        body: formData,
      });
      const asset = await uploadRes.json();
      if (asset.error) throw new Error(asset.error);

      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: 'user', content: `Uploaded: ${file.name}`, imageUrl: asset.url };
        return updated;
      });

      setLoading(true);
      const parsed = await callClaude(
        `I just uploaded a file. Here's its URL: ${asset.url}. It's a ${asset.type} (${file.name}). Please incorporate it into the portal — if it's a logo, add it to the logo section. If it's a brand photo or background, use it as a visual asset in the hero or appropriate section.`,
      );

      if (parsed.type === 'content' && parsed.content) {
        const newContent = { ...content, ...parsed.content };
        setContent(newContent);
        saveMutation.mutate({ content: { ...newContent, customHtml } });
      } else if (parsed.type === 'html' && parsed.html) {
        setCustomHtml(parsed.html);
        setPreviewMode('html');
        saveMutation.mutate({ content: { ...content, customHtml: parsed.html } });
      }

      setMessages(prev => [...prev, { role: 'assistant', content: parsed.message || 'Asset added to portal!', changed: parsed.type === 'content', htmlGenerated: parsed.type === 'html' }]);
      if (parsed.suggestions?.length) setSuggestions(parsed.suggestions);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: `Upload failed: ${err.message}` }]);
    } finally { setUploadingFile(false); setLoading(false); }
  };

  const handleKey = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } };

  if (!portal || !content) return <div style={{ padding: 40, fontSize: 14, color: '#6B7280' }}>Loading portal…</div>;

  const saveBg = saveStatus === 'saved' ? '#10B981' : saveStatus === 'error' ? '#EF4444' : '#111827';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', fontFamily: 'Inter, sans-serif', position: 'relative' }}>
      {showSettings && <SettingsPanel portal={portal} onClose={() => setShowSettings(false)} />}

      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '11px 20px', background: '#fff', borderBottom: '1px solid #E5E7EB', flexShrink: 0 }}>
        <button onClick={() => navigate('/portals')} style={{ fontSize: 13, color: '#6B7280', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>← Portals</button>
        <div style={{ width: 1, height: 16, background: '#E5E7EB' }} />
        <span style={{ fontSize: 14, fontWeight: 800, color: '#111827' }}>{portal.client_name}</span>
        <span style={{ fontSize: 11, background: '#F3F4F6', color: '#6B7280', borderRadius: 20, padding: '2px 8px', fontWeight: 600 }}>AI Builder</span>
        <div style={{ flex: 1 }} />
        <button onClick={() => setShowSettings(true)} style={{ fontSize: 12, color: '#6B7280', background: '#F3F4F6', border: 'none', borderRadius: 7, padding: '6px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
          ⚙ Settings
        </button>
        <button onClick={() => window.open(`${PORTAL_URL}/${portal.slug}`, '_blank')} style={{ fontSize: 12, color: '#374151', background: '#F3F4F6', border: 'none', borderRadius: 7, padding: '6px 12px', cursor: 'pointer' }}>
          Open ↗
        </button>
        <div style={{ fontSize: 11, color: saveStatus === 'saving' ? '#F59E0B' : saveStatus === 'saved' ? '#10B981' : '#9CA3AF', fontWeight: 600, minWidth: 80 }}>
          {saveStatus === 'saving' ? '↑ Saving…' : saveStatus === 'saved' ? '✓ Saved' : ''}
        </div>
        <button onClick={handleSave} disabled={saveStatus === 'saving'}
          style={{ fontSize: 13, fontWeight: 700, padding: '7px 18px', background: saveBg, color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', transition: 'background .2s' }}>
          Save
        </button>
      </div>

      {/* Main */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '400px 1fr', overflow: 'hidden' }}>

        {/* Left: chat */}
        <div style={{ borderRight: '1px solid #E5E7EB', display: 'flex', flexDirection: 'column', background: '#fff', overflow: 'hidden' }}>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 16px' }}>
            {messages.map((msg, i) => <Message key={i} msg={msg} initials="B" />)}
            {(loading || uploadingFile) && (
              <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'flex-start' }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#6366F1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#fff' }}>✦</div>
                <div style={{ background: '#F3F4F6', borderRadius: '12px 12px 12px 4px', padding: '12px 16px' }}>
                  <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                    {[0,1,2].map(i => (
                      <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: '#9CA3AF', animation: 'bounce 1.4s infinite', animationDelay: `${i * 0.2}s` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggestions */}
          {suggestions.length > 0 && !loading && (
            <div style={{ padding: '0 16px 10px', display: 'flex', flexDirection: 'column', gap: 5 }}>
              {suggestions.map((s, i) => (
                <button key={i} onClick={() => handleSend(s)}
                  style={{ textAlign: 'left', fontSize: 12, color: '#374151', background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 8, padding: '8px 12px', cursor: 'pointer', lineHeight: 1.4, transition: 'background .1s' }}
                  onMouseOver={e => e.currentTarget.style.background = '#F3F4F6'}
                  onMouseOut={e => e.currentTarget.style.background = '#F9FAFB'}>
                  ↳ {s}
                </button>
              ))}
            </div>
          )}

          {/* Input area */}
          <div style={{ padding: '12px 16px', borderTop: '1px solid #E5E7EB' }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', marginBottom: 6 }}>
              {/* Attach button */}
              <div style={{ position: 'relative' }}>
                <button onClick={() => setShowAttachMenu(s => !s)}
                  style={{ width: 36, height: 36, borderRadius: 8, background: showAttachMenu ? '#111827' : '#F3F4F6', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: showAttachMenu ? '#fff' : '#6B7280', transition: 'all .15s' }}>
                  +
                </button>
                {showAttachMenu && (
                  <div style={{ position: 'absolute', bottom: '100%', left: 0, marginBottom: 6, background: '#fff', border: '1px solid #E5E7EB', borderRadius: 10, padding: 6, minWidth: 200, boxShadow: '0 8px 24px rgba(0,0,0,.12)', zIndex: 50 }}>
                    {[
                      { icon: '🖼', label: 'Upload image or video', action: () => { fileInputRef.current.accept='image/*,video/*'; fileInputRef.current.click(); } },
                      { icon: '🔗', label: 'Paste URL to analyze', action: () => { setShowAttachMenu(false); setInput('Analyze this URL: '); } },
                      { icon: '📄', label: 'Upload PDF or doc', action: () => { fileInputRef.current.accept='.pdf,.doc,.docx'; fileInputRef.current.click(); } },
                    ].map(item => (
                      <button key={item.label} onClick={item.action}
                        style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '9px 12px', background: 'none', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: 13, color: '#111827', textAlign: 'left' }}
                        onMouseOver={e => e.currentTarget.style.background = '#F9FAFB'}
                        onMouseOut={e => e.currentTarget.style.background = 'none'}>
                        <span>{item.icon}</span> {item.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKey}
                placeholder="Describe what to build, paste a URL, or ask anything…"
                rows={2}
                style={{ flex: 1, padding: '10px 12px', border: '1px solid #E5E7EB', borderRadius: 10, fontSize: 13, fontFamily: 'Inter, sans-serif', resize: 'none', outline: 'none', lineHeight: 1.5, color: '#111827' }}
                onFocus={e => e.target.style.borderColor = '#111827'}
                onBlur={e => e.target.style.borderColor = '#E5E7EB'}
              />

              <button onClick={() => handleSend()} disabled={loading || uploadingFile || !input.trim()}
                style={{ width: 36, height: 36, borderRadius: 10, background: input.trim() ? '#111827' : '#E5E7EB', border: 'none', cursor: input.trim() ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background .15s' }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={input.trim() ? '#fff' : '#9CA3AF'} strokeWidth={2.5} strokeLinecap="round"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
              </button>
            </div>
            <div style={{ fontSize: 10, color: '#C9CDD4' }}>Enter to send · Shift+Enter for new line</div>
          </div>

          {/* Hidden file input */}
          <input ref={fileInputRef} type="file" style={{ display: 'none' }} onChange={e => { if (e.target.files[0]) handleFileUpload(e.target.files[0]); e.target.value = ''; }} />
        </div>

        {/* Right: preview */}
        <div style={{ overflow: 'hidden' }}>
          <LivePreview content={content} customHtml={customHtml} clientName={portal.client_name} previewMode={previewMode} setPreviewMode={setPreviewMode} />
        </div>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-6px); }
        }
      `}</style>
    </div>
  );
}
