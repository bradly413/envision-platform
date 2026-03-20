import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { portals } from '../lib/api';
import api from '../lib/api';

const PORTAL_URL = import.meta.env.VITE_PORTAL_URL || 'https://marvelous-belekoy-63770f.netlify.app';
const API_URL = import.meta.env.VITE_API_URL || 'https://envision-platform-production.up.railway.app/api';

// ─── System prompt ────────────────────────────────────────────────────────────
const makeSystemPrompt = (portal) => `You are an elite creative director and front-end developer building premium brand reveal portals for ${portal?.client_name || 'a client'} at Bradley Robert Creative.

MODES:
- MODE A (CONTENT): Update structured text/colors/copy fields
- MODE B (CUSTOM HTML): Generate a complete cinematic HTML presentation — use this when user mentions "custom", "HTML", "animations", "cinematic", "full version", "like that site", or wants a visual redesign

Always respond with valid JSON only. No markdown, no prose outside JSON.

FORMAT A — Content update:
{"type":"content","message":"Brief description","content":{...full content object...},"suggestions":["specific next step 1","specific next step 2","specific next step 3"]}

FORMAT B — Custom HTML (IMPORTANT: generate a COMPLETE, PRODUCTION-QUALITY HTML file):
{"type":"html","message":"Brief description","html":"<!DOCTYPE html>...complete file...","suggestions":["refine suggestion 1","refine suggestion 2","refine suggestion 3"]}

FORMAT C — Chat only:
{"type":"chat","message":"Response","suggestions":["s1","s2"]}

Content structure:
{"hero":{"headline":"","subheadline":"","intro":""},"brand":{"headline":"","positioning":"","pillars":[{"title":"","desc":""}]},"logo":{"headline":"","description":"","variations":[]},"colors":{"headline":"","palette":[{"name":"","hex":"#000000","role":""}]},"typography":{"headline":"","primaryFont":"","secondaryFont":"","usage":""},"sections":[]}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CUSTOM HTML REQUIREMENTS (FORMAT B):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Generate a COMPLETE self-contained HTML file with ALL CSS in <style> and ALL JS in <script>.

VISUAL TECHNIQUES TO INCLUDE:
1. MASKED LETTERFORM HERO: Giant client name text (font-size: 20vw+) with background-clip:text and -webkit-text-fill-color:transparent, using a background-image gradient or the brand color as the image source. The text acts as a window/mask revealing something behind it.

2. PARALLAX SCROLL: Use scroll event listener to move background images at different speeds (background-position updates on scroll).

3. SCROLL REVEAL ANIMATIONS: Use IntersectionObserver to trigger fade-up, scale, and blur-to-sharp transitions as sections enter viewport.

4. CINEMATIC SECTIONS: Full-viewport sections with dark overlays, large typography, generous spacing.

5. ATMOSPHERIC IMAGERY: Use Unsplash source URLs for real photos: https://source.unsplash.com/1920x1080/?[keyword] — use relevant keywords based on the client's industry/brand. For Jazz Club use: jazz,music,nightclub,saxophone,bar

6. COLOR PALETTE SECTION: Show each brand color as a full-height animated swatch panel with the color name and hex.

7. SMOOTH TRANSITIONS: CSS transitions on all interactive elements, page load fade-in animation.

REQUIRED SECTIONS (in order):
1. Hero: Full viewport, masked letterform OR large bold headline with atmospheric background image
2. Brand story: Dark section with large quote-style positioning statement
3. Color palette: Side-scrolling or grid of animated color panels
4. Typography: Large typeface showcase with sample text
5. Logo: Clean presentation on both light and dark backgrounds
6. Approval CTA: Centered, minimal, two buttons

TECHNICAL REQUIREMENTS:
- Google Fonts via @import (choose fonts matching the brand)
- CSS custom properties for all colors
- Smooth scroll behavior
- Mobile responsive
- All animations via CSS + vanilla JS (no external libraries)
- The file renders perfectly standalone in an iframe

CLIENT: ${portal?.client_name || 'Client'}
Use their brand name, colors, and content throughout. Make it feel custom-built, not generic.`;

// ─── Unsplash helper ──────────────────────────────────────────────────────────
function getUnsplashUrl(keywords, width = 1920, height = 1080) {
  return `https://source.unsplash.com/${width}x${height}/?${encodeURIComponent(keywords)}`;
}

// ─── Live preview ─────────────────────────────────────────────────────────────
function LivePreview({ content, customHtml, clientName, previewMode, setPreviewMode }) {
  const iframeRef = useRef(null);

  useEffect(() => {
    if (customHtml && iframeRef.current) {
      const doc = iframeRef.current.contentDocument;
      if (doc) { doc.open(); doc.write(customHtml); doc.close(); }
    }
  }, [customHtml]);

  const c = content || {};
  const palette = c.colors?.palette || [];

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#0F0F0F' }}>
      <div style={{ padding: '8px 16px', background: '#0D0D0D', borderBottom: '1px solid #1E1E1E', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: 5 }}>{['#FF5F57','#FFBD2E','#28C840'].map(col => <div key={col} style={{ width: 9, height: 9, borderRadius: '50%', background: col }} />)}</div>
        <div style={{ flex: 1, background: '#111', borderRadius: 4, padding: '3px 10px', fontSize: 10, color: '#4B5563', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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

      <div style={{ flex: 1, overflow: 'hidden' }}>
        {previewMode === 'html' && customHtml ? (
          <iframe ref={iframeRef} style={{ width: '100%', height: '100%', border: 'none' }} title="Portal preview" sandbox="allow-scripts allow-same-origin" />
        ) : (
          <div style={{ height: '100%', overflowY: 'auto', fontFamily: 'Inter, sans-serif' }}>
            {/* Hero */}
            <div style={{ padding: '60px 24px', textAlign: 'center', borderBottom: '1px solid #1A1A1A', background: 'radial-gradient(ellipse at center, #1A1A2E 0%, #0F0F0F 70%)', position: 'relative', overflow: 'hidden' }}>
              {palette[0] && <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at center, ${palette[0].hex}22 0%, transparent 70%)` }} />}
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.2em', textTransform: 'uppercase', color: '#6B7280', marginBottom: 20 }}>Bradley Robert Creative · Brand Reveal</div>
              <h1 style={{ fontSize: 'clamp(28px, 5vw, 56px)', fontWeight: 900, color: '#F9FAFB', lineHeight: 1.1, margin: '0 0 16px', letterSpacing: '-.02em' }}>
                {c.hero?.headline || clientName},<br />
                <span style={{ color: palette[1]?.hex || '#9CA3AF', fontStyle: 'italic' }}>{c.hero?.subheadline || 'meet your new brand.'}</span>
              </h1>
              {c.hero?.intro && <p style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.7, margin: '0 auto', maxWidth: 500 }}>{c.hero.intro}</p>}
            </div>

            {/* Brand */}
            {c.brand?.positioning && (
              <div style={{ padding: '32px 24px', borderBottom: '1px solid #1A1A1A' }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: '#3B82F6', marginBottom: 12 }}>Brand Strategy</div>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: '#F9FAFB', margin: '0 0 12px' }}>{c.brand.headline}</h2>
                <p style={{ fontSize: 13, color: '#9CA3AF', lineHeight: 1.8, margin: '0 0 16px', fontStyle: 'italic', borderLeft: `3px solid ${palette[0]?.hex || '#374151'}`, paddingLeft: 14 }}>{c.brand.positioning}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {(c.brand.pillars || []).map((p, i) => (
                    <div key={i} style={{ borderLeft: `2px solid ${palette[i % palette.length]?.hex || '#374151'}`, paddingLeft: 12 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#F9FAFB' }}>{p.title}</div>
                      <div style={{ fontSize: 11, color: '#6B7280' }}>{p.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Colors */}
            {palette.length > 0 && (
              <div style={{ padding: '32px 24px', borderBottom: '1px solid #1A1A1A' }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: '#F59E0B', marginBottom: 12 }}>Color Palette</div>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: '#F9FAFB', margin: '0 0 16px' }}>{c.colors.headline}</h2>
                <div style={{ display: 'flex', gap: 2 }}>
                  {palette.map((color, i) => (
                    <div key={i} style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ height: 60, background: color.hex, borderRadius: i === 0 ? '6px 0 0 6px' : i === palette.length - 1 ? '0 6px 6px 0' : 0 }} />
                      <div style={{ marginTop: 6, fontSize: 10, fontWeight: 700, color: '#F9FAFB', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{color.name}</div>
                      <div style={{ fontSize: 9, color: '#6B7280', fontFamily: 'monospace' }}>{color.hex}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Typography */}
            {c.typography?.primaryFont && (
              <div style={{ padding: '32px 24px', borderBottom: '1px solid #1A1A1A' }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: '#EF4444', marginBottom: 12 }}>Typography</div>
                <div style={{ fontSize: 32, fontWeight: 900, color: '#F9FAFB', marginBottom: 4, letterSpacing: '-.02em' }}>{c.typography.primaryFont}</div>
                {c.typography.secondaryFont && <div style={{ fontSize: 18, color: '#9CA3AF', marginBottom: 8 }}>{c.typography.secondaryFont}</div>}
                {c.typography.usage && <p style={{ fontSize: 12, color: '#6B7280', margin: 0, lineHeight: 1.6 }}>{c.typography.usage}</p>}
              </div>
            )}

            {/* CTA */}
            <div style={{ padding: '56px 24px', textAlign: 'center' }}>
              <h2 style={{ fontSize: 24, fontWeight: 800, color: '#F9FAFB', margin: '0 0 8px' }}>What do you think?</h2>
              <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 28 }}>Your feedback shapes the final deliverable.</p>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                <div style={{ padding: '12px 28px', background: palette[0]?.hex || '#F9FAFB', color: palette[0] ? '#fff' : '#111', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Approve ✓</div>
                <div style={{ padding: '12px 28px', border: '1px solid #374151', color: '#9CA3AF', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}>Request changes</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Message bubble ───────────────────────────────────────────────────────────
function Message({ msg }) {
  const isUser = msg.role === 'user';
  return (
    <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexDirection: isUser ? 'row-reverse' : 'row', alignItems: 'flex-start' }}>
      <div style={{ width: 28, height: 28, borderRadius: '50%', background: isUser ? '#111827' : '#6366F1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
        {isUser ? 'B' : '✦'}
      </div>
      <div style={{ maxWidth: '80%' }}>
        {msg.imageUrl && <img src={msg.imageUrl} alt="uploaded" style={{ maxWidth: '100%', borderRadius: 8, marginBottom: 6, display: 'block' }} />}
        <div style={{ fontSize: 13, background: isUser ? '#111827' : '#F3F4F6', color: isUser ? '#F9FAFB' : '#111827', padding: '10px 14px', borderRadius: isUser ? '12px 12px 4px 12px' : '12px 12px 12px 4px', lineHeight: 1.6 }}>
          {msg.content}
        </div>
        <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
          {msg.changed && <div style={{ fontSize: 10, color: '#10B981', fontWeight: 600 }}>✓ Portal updated</div>}
          {msg.htmlGenerated && <div style={{ fontSize: 10, color: '#6366F1', fontWeight: 600 }}>✦ Custom template generated</div>}
        </div>
      </div>
    </div>
  );
}

// ─── Settings panel ───────────────────────────────────────────────────────────
function SettingsPanel({ portal, onClose }) {
  const [status, setStatus] = useState(portal.status || 'draft');
  const qc = useQueryClient();
  const saveMutation = useMutation(data => portals.update(portal.id, data), {
    onSuccess: () => { qc.invalidateQueries('portals'); qc.invalidateQueries(['portal', portal.id]); onClose(); }
  });
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
      <div style={{ background: '#fff', borderRadius: 14, padding: 28, width: 380, boxShadow: '0 20px 60px rgba(0,0,0,.15)', fontFamily: 'Inter, sans-serif' }} onClick={e => e.stopPropagation()}>
        <div style={{ fontSize: 15, fontWeight: 800, color: '#111827', marginBottom: 20 }}>Portal settings</div>
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 4 }}>Client</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>{portal.client_name}</div>
        </div>
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 4 }}>Portal URL</div>
          <div style={{ fontSize: 12, fontFamily: 'monospace', color: '#6B7280', background: '#F3F4F6', padding: '6px 10px', borderRadius: 6, wordBreak: 'break-all' }}>{PORTAL_URL}/{portal.slug}</div>
        </div>
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 8 }}>Status</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {['draft', 'active', 'archived'].map(s => (
              <button key={s} onClick={() => setStatus(s)}
                style={{ fontSize: 12, fontWeight: 600, padding: '6px 14px', borderRadius: 20, border: 'none', cursor: 'pointer', textTransform: 'capitalize', background: status === s ? '#111827' : '#F3F4F6', color: status === s ? '#fff' : '#6B7280' }}>
                {s}
              </button>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
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
  // Undo/redo history
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  useEffect(() => {
    if (!portal) return;
    const c = portal.content || {};
    const initial = {
      hero: c.hero || { headline: '', subheadline: 'meet your new brand.', intro: '' },
      brand: c.brand || { headline: 'The story behind the brand.', positioning: '', pillars: [] },
      logo: c.logo || { headline: 'The mark.', description: '', variations: [] },
      colors: c.colors || { headline: 'The palette.', palette: [] },
      typography: c.typography || { headline: 'The voice in text.', primaryFont: '', secondaryFont: '', usage: '' },
      sections: c.sections || [],
    };
    setContent(initial);
    if (c.customHtml) { setCustomHtml(c.customHtml); setPreviewMode('html'); }
    setMessages([{ role: 'assistant', content: `Ready to build the ${portal.client_name} portal. Describe your vision, paste a URL for inspiration, or upload brand assets — I'll build around them.` }]);
    setSuggestions([
      `Generate a cinematic brand reveal for ${portal.client_name}`,
      'Build a custom HTML version with scroll animations',
      'Paste a URL to inspire the design',
      'Upload a logo or brand photo',
    ]);
    setHistory([]);
    setHistoryIndex(-1);
  }, [portal?.id]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const pushHistory = (c, html) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({ content: c, customHtml: html });
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (historyIndex <= 0) return;
    const prev = history[historyIndex - 1];
    setHistoryIndex(historyIndex - 1);
    setContent(prev.content);
    setCustomHtml(prev.customHtml);
    if (prev.customHtml) setPreviewMode('html');
  };

  const redo = () => {
    if (historyIndex >= history.length - 1) return;
    const next = history[historyIndex + 1];
    setHistoryIndex(historyIndex + 1);
    setContent(next.content);
    setCustomHtml(next.customHtml);
    if (next.customHtml) setPreviewMode('html');
  };

  const saveMutation = useMutation(data => portals.update(portalId, data), {
    onMutate: () => setSaveStatus('saving'),
    onSuccess: () => { setSaveStatus('saved'); qc.invalidateQueries('portals'); qc.invalidateQueries(['portal', portalId]); setTimeout(() => setSaveStatus('idle'), 2500); },
    onError: () => { setSaveStatus('error'); setTimeout(() => setSaveStatus('idle'), 3000); },
  });

  const handleSave = () => saveMutation.mutate({ content: { ...content, customHtml } });

  const callClaude = async (userMessage, extraContext = '') => {
    const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error('VITE_ANTHROPIC_API_KEY not set');

    const isHtmlRequest = /custom|html|animation|cinematic|full version|like that|scroll|parallax|immersive|visual|redesign|template/i.test(userMessage);

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: isHtmlRequest ? 8000 : 2000,
        system: makeSystemPrompt(portal),
        messages: [
          ...messages.slice(-4).filter(m => m.role === 'user' || m.role === 'assistant').map(m => ({ role: m.role, content: m.content })),
          { role: 'user', content: `Current portal content: ${JSON.stringify(content)}\n${extraContext}\n\nRequest: ${userMessage}` }
        ],
      }),
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error.message);
    const raw = data.content?.[0]?.text || '';

    try {
      const match = raw.match(/\{[\s\S]*\}/);
      if (match) return JSON.parse(match[0]);
    } catch {
      const msgMatch = raw.match(/"message"\s*:\s*"([^"]+)"/);
      return { type: 'chat', message: msgMatch?.[1] || raw.substring(0, 200), suggestions: [] };
    }
    return { type: 'chat', message: raw.substring(0, 200), suggestions: [] };
  };

  const applyParsed = (parsed) => {
    if (parsed.type === 'content' && parsed.content) {
      const newContent = { ...content, ...parsed.content };
      setContent(newContent);
      setPreviewMode('content');
      pushHistory(newContent, customHtml);
      saveMutation.mutate({ content: { ...newContent, customHtml } });
      return { changed: true, htmlGenerated: false };
    } else if (parsed.type === 'html' && parsed.html) {
      setCustomHtml(parsed.html);
      setPreviewMode('html');
      pushHistory(content, parsed.html);
      saveMutation.mutate({ content: { ...content, customHtml: parsed.html } });
      return { changed: false, htmlGenerated: true };
    }
    return { changed: false, htmlGenerated: false };
  };

  const handleSend = async (messageText) => {
    const text = messageText || input;
    if (!text.trim() || loading) return;
    setInput('');
    setSuggestions([]);
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setLoading(true);

    try {
      const urlMatch = text.match(/https?:\/\/[^\s]+/);
      let extraContext = '';

      if (urlMatch) {
        setMessages(prev => [...prev, { role: 'assistant', content: `Analyzing ${urlMatch[0]}…` }]);
        try {
          const fetchRes = await api.post('/uploads/fetch-url', { url: urlMatch[0] });
          extraContext = `\n\nURL Design Analysis (${urlMatch[0]}):\nTitle: ${fetchRes.title}\nColors: ${fetchRes.colors?.join(', ')}\nFonts: ${fetchRes.fonts?.join(', ')}\nAnimation level: ${fetchRes.animationCount > 10 ? 'highly animated' : fetchRes.animationCount > 3 ? 'moderate' : 'minimal'}\nParallax: ${fetchRes.hasParallax ? 'yes' : 'no'}\nVideo: ${fetchRes.hasVideo ? 'yes' : 'no'}\nStructure: ${fetchRes.html?.substring(0, 1000)}\n\nApply this design aesthetic to the portal.`;
          setMessages(prev => prev.slice(0, -1));
        } catch { extraContext = `\n\nCould not fetch URL — apply a premium design aesthetic inspired by the URL context.`; }
      }

      const parsed = await callClaude(text, extraContext);
      const { changed, htmlGenerated } = applyParsed(parsed);

      setMessages(prev => [...prev, { role: 'assistant', content: parsed.message || 'Done!', changed, htmlGenerated }]);
      if (parsed.suggestions?.length) setSuggestions(parsed.suggestions.slice(0, 4));
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
      const token = localStorage.getItem('token') || sessionStorage.getItem('token') || '';
      const uploadRes = await fetch(`${API_URL}/uploads/asset`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
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
      const fileType = asset.type === 'video' ? 'video' : file.name.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i) ? 'image' : 'file';
      const parsed = await callClaude(
        `I uploaded a ${fileType}: ${file.name} (URL: ${asset.url}). ${fileType === 'image' ? 'If it looks like a logo, add it to the logo section. If it\'s a brand photo or background image, use it as a hero background in custom HTML.' : 'Incorporate this asset appropriately.'} Update the portal to use it.`,
      );

      const { changed, htmlGenerated } = applyParsed(parsed);
      setMessages(prev => [...prev, { role: 'assistant', content: parsed.message || 'Asset incorporated!', changed, htmlGenerated }]);
      if (parsed.suggestions?.length) setSuggestions(parsed.suggestions.slice(0, 4));
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: `Upload failed: ${err.message}` }]);
    } finally { setUploadingFile(false); setLoading(false); }
  };

  const handleKey = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } };

  // Get auth token from zustand store
  const getToken = () => {
    try {
      const stored = localStorage.getItem('envision-auth');
      if (stored) return JSON.parse(stored)?.state?.token || '';
    } catch {}
    return '';
  };

  if (!portal || !content) return <div style={{ padding: 40, fontSize: 14, color: '#6B7280', fontFamily: 'Inter, sans-serif' }}>Loading portal…</div>;

  const saveBg = saveStatus === 'saved' ? '#10B981' : saveStatus === 'error' ? '#EF4444' : '#111827';
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', fontFamily: 'Inter, sans-serif', position: 'relative' }}>
      {showSettings && <SettingsPanel portal={portal} onClose={() => setShowSettings(false)} />}

      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 20px', background: '#fff', borderBottom: '1px solid #E5E7EB', flexShrink: 0 }}>
        <button onClick={() => navigate('/portals')} style={{ fontSize: 13, color: '#6B7280', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>← Portals</button>
        <div style={{ width: 1, height: 16, background: '#E5E7EB' }} />
        <span style={{ fontSize: 14, fontWeight: 800, color: '#111827' }}>{portal.client_name}</span>
        <span style={{ fontSize: 11, background: '#EEF2FF', color: '#6366F1', borderRadius: 20, padding: '2px 8px', fontWeight: 700 }}>AI Builder</span>

        {/* Undo/redo */}
        <div style={{ display: 'flex', gap: 4 }}>
          <button onClick={undo} disabled={!canUndo} title="Undo"
            style={{ width: 28, height: 28, borderRadius: 6, background: canUndo ? '#F3F4F6' : 'transparent', border: 'none', cursor: canUndo ? 'pointer' : 'not-allowed', color: canUndo ? '#374151' : '#D1D5DB', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            ↩
          </button>
          <button onClick={redo} disabled={!canRedo} title="Redo"
            style={{ width: 28, height: 28, borderRadius: 6, background: canRedo ? '#F3F4F6' : 'transparent', border: 'none', cursor: canRedo ? 'pointer' : 'not-allowed', color: canRedo ? '#374151' : '#D1D5DB', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            ↪
          </button>
        </div>

        <div style={{ flex: 1 }} />
        <div style={{ fontSize: 11, color: saveStatus === 'saving' ? '#F59E0B' : saveStatus === 'saved' ? '#10B981' : 'transparent', fontWeight: 600 }}>
          {saveStatus === 'saving' ? '↑ Saving…' : '✓ Saved'}
        </div>
        <button onClick={() => setShowSettings(true)} style={{ fontSize: 12, color: '#6B7280', background: '#F3F4F6', border: 'none', borderRadius: 7, padding: '6px 12px', cursor: 'pointer' }}>⚙ Settings</button>
        <button onClick={() => window.open(`${PORTAL_URL}/${portal.slug}`, '_blank')} style={{ fontSize: 12, color: '#374151', background: '#F3F4F6', border: 'none', borderRadius: 7, padding: '6px 12px', cursor: 'pointer' }}>Open ↗</button>
        <button onClick={handleSave} disabled={saveStatus === 'saving'}
          style={{ fontSize: 13, fontWeight: 700, padding: '7px 18px', background: saveBg, color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', transition: 'background .2s' }}>
          Save
        </button>
      </div>

      {/* Main */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '400px 1fr', overflow: 'hidden' }}>

        {/* Chat panel */}
        <div style={{ borderRight: '1px solid #E5E7EB', display: 'flex', flexDirection: 'column', background: '#fff', overflow: 'hidden' }}>
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 16px' }}>
            {messages.map((msg, i) => <Message key={i} msg={msg} />)}
            {(loading || uploadingFile) && (
              <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'flex-start' }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#6366F1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#fff' }}>✦</div>
                <div style={{ background: '#F3F4F6', borderRadius: '12px 12px 12px 4px', padding: '12px 16px' }}>
                  <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                    {[0,1,2].map(i => <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: '#9CA3AF', animation: 'bounce 1.4s infinite', animationDelay: `${i*0.2}s` }} />)}
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
                  style={{ textAlign: 'left', fontSize: 12, color: '#374151', background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 8, padding: '8px 12px', cursor: 'pointer', lineHeight: 1.4 }}
                  onMouseOver={e => e.currentTarget.style.background = '#F3F4F6'}
                  onMouseOut={e => e.currentTarget.style.background = '#F9FAFB'}>
                  ↳ {s}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div style={{ padding: '12px 16px', borderTop: '1px solid #E5E7EB' }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', marginBottom: 6 }}>
              <div style={{ position: 'relative' }}>
                <button onClick={() => setShowAttachMenu(s => !s)}
                  style={{ width: 36, height: 36, borderRadius: 8, background: showAttachMenu ? '#111827' : '#F3F4F6', border: 'none', cursor: 'pointer', fontSize: 18, color: showAttachMenu ? '#fff' : '#6B7280', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .15s' }}>
                  +
                </button>
                {showAttachMenu && (
                  <div style={{ position: 'absolute', bottom: '100%', left: 0, marginBottom: 6, background: '#fff', border: '1px solid #E5E7EB', borderRadius: 10, padding: 6, minWidth: 210, boxShadow: '0 8px 24px rgba(0,0,0,.12)', zIndex: 50 }}>
                    {[
                      { icon: '🖼', label: 'Upload image or video', action: () => { fileInputRef.current.accept='image/*,video/*'; fileInputRef.current.click(); setShowAttachMenu(false); } },
                      { icon: '🔗', label: 'Paste URL to analyze', action: () => { setShowAttachMenu(false); setInput('Analyze this URL and apply the design style: '); } },
                      { icon: '🎬', label: 'Build cinematic HTML', action: () => { setShowAttachMenu(false); handleSend('Generate a cinematic custom HTML version with masked letterforms, parallax scroll, and smooth reveal animations'); } },
                      { icon: '📄', label: 'Upload PDF brand guide', action: () => { fileInputRef.current.accept='.pdf'; fileInputRef.current.click(); setShowAttachMenu(false); } },
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
                onBlur={e => e.target.style.borderColor = '#E5E7EB'} />

              <button onClick={() => handleSend()} disabled={loading || uploadingFile || !input.trim()}
                style={{ width: 36, height: 36, borderRadius: 10, background: input.trim() ? '#111827' : '#E5E7EB', border: 'none', cursor: input.trim() ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background .15s' }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={input.trim() ? '#fff' : '#9CA3AF'} strokeWidth={2.5} strokeLinecap="round"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
              </button>
            </div>
            <div style={{ fontSize: 10, color: '#C9CDD4' }}>Enter to send · Shift+Enter for new line</div>
          </div>

          <input ref={fileInputRef} type="file" style={{ display: 'none' }} onChange={e => { if (e.target.files[0]) handleFileUpload(e.target.files[0]); e.target.value = ''; }} />
        </div>

        {/* Preview */}
        <LivePreview content={content} customHtml={customHtml} clientName={portal.client_name} previewMode={previewMode} setPreviewMode={setPreviewMode} />
      </div>

      <style>{`@keyframes bounce { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-6px)} }`}</style>
    </div>
  );
}
