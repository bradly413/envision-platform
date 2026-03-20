import { useEffect, useRef, useState } from 'react';
import { usePortalStore } from '../lib/store';
import { track, comments as commentsApi } from '../lib/api';
import HeroSection from '../components/Hero/HeroSection';
import BrandSection from '../components/ScrollSections/BrandSection';
import LogoSection from '../components/ScrollSections/LogoSection';
import ColorSection from '../components/ScrollSections/ColorSection';
import TypographySection from '../components/ScrollSections/TypographySection';
import ApprovalSection from '../components/Approval/ApprovalSection';

// ─── Custom section renderer ──────────────────────────────────────────────────
function CustomSection({ content = {} }) {
  return (
    <section data-section="custom" style={{ padding: '120px 32px' }}>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        <h2 style={{ fontSize: 'clamp(28px, 5vw, 52px)', fontWeight: 800, color: '#F9FAFB', margin: '0 0 32px' }}>
          {content.heading || 'Additional Information'}
        </h2>
        {content.body && (
          <p style={{ fontSize: 17, color: '#9CA3AF', lineHeight: 1.8, maxWidth: 680, margin: '0 0 32px' }}>{content.body}</p>
        )}
        {(content.links || []).length > 0 && (
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {content.links.map((l, i) => (
              <a key={i} href={l.url} target="_blank" rel="noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 20px', background: '#1A1A1A', border: '1px solid #374151', borderRadius: 8, color: '#F9FAFB', fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
                {l.label} →
              </a>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

// ─── Floating comments panel ──────────────────────────────────────────────────
function CommentsPanel({ portalId, open, onClose }) {
  const [commentsList, setCommentsList] = useState([]);
  const [text, setText] = useState('');
  const [section, setSection] = useState('general');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    commentsApi.list(portalId)
      .then(data => setCommentsList(Array.isArray(data) ? data : []))
      .catch(() => setCommentsList([]))
      .finally(() => setLoading(false));
  }, [open, portalId]);

  const handleSubmit = async () => {
    if (!text.trim()) return;
    setSubmitting(true);
    try {
      const newComment = await commentsApi.add(portalId, { section, text });
      setCommentsList(prev => [...prev, newComment]);
      setText('');
      track.event(portalId, 'comment', { section });
    } catch {
      setCommentsList(prev => [...prev, { id: Date.now(), section, text, created_at: new Date().toISOString() }]);
      setText('');
    } finally { setSubmitting(false); }
  };

  const SECTIONS = ['general', 'hero', 'brand', 'logo', 'colors', 'typography'];

  if (!open) return null;

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 998 }} />
      <div style={{ position: 'fixed', right: 0, top: 0, bottom: 0, width: 360, background: '#111', borderLeft: '1px solid #2A2A2A', zIndex: 999, display: 'flex', flexDirection: 'column', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 20px 16px', borderBottom: '1px solid #1E1E1E' }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#F9FAFB' }}>Comments</div>
            <div style={{ fontSize: 11, color: '#4B5563', marginTop: 2 }}>Leave feedback on any section</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#6B7280', cursor: 'pointer', fontSize: 18, padding: 4 }}>✕</button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
          {loading ? (
            <div style={{ fontSize: 13, color: '#4B5563', textAlign: 'center', marginTop: 40 }}>Loading…</div>
          ) : commentsList.length === 0 ? (
            <div style={{ fontSize: 13, color: '#4B5563', textAlign: 'center', marginTop: 40 }}>No comments yet. Be the first!</div>
          ) : commentsList.map((c, i) => (
            <div key={c.id || i} style={{ marginBottom: 16, padding: '14px 16px', background: '#1A1A1A', borderRadius: 10, border: '1px solid #2A2A2A' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: '#6B7280' }}>{c.section || 'general'}</span>
                <span style={{ fontSize: 10, color: '#374151' }}>{c.created_at ? new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Just now'}</span>
              </div>
              <p style={{ fontSize: 14, color: '#D1D5DB', lineHeight: 1.6, margin: 0 }}>{c.text || c.body}</p>
            </div>
          ))}
        </div>
        <div style={{ padding: '16px 20px', borderTop: '1px solid #1E1E1E' }}>
          <select value={section} onChange={e => setSection(e.target.value)}
            style={{ width: '100%', marginBottom: 10, padding: '8px 12px', background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 8, color: '#9CA3AF', fontSize: 12, outline: 'none' }}>
            {SECTIONS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
          </select>
          <textarea value={text} onChange={e => setText(e.target.value)} placeholder="Share your thoughts…" rows={3}
            style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 8, color: '#F9FAFB', fontSize: 13, fontFamily: 'Inter, sans-serif', outline: 'none', resize: 'none', lineHeight: 1.6, marginBottom: 10 }} />
          <button onClick={handleSubmit} disabled={submitting || !text.trim()}
            style={{ width: '100%', padding: '11px', background: text.trim() ? '#F9FAFB' : '#1A1A1A', color: text.trim() ? '#111827' : '#374151', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: text.trim() ? 'pointer' : 'not-allowed', transition: 'all .15s' }}>
            {submitting ? 'Posting…' : 'Post comment'}
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Download button ──────────────────────────────────────────────────────────
function DownloadButton({ portal }) {
  const assets = portal?.content?.assets || [];
  const [open, setOpen] = useState(false);

  if (assets.length === 0) return null;

  return (
    <div style={{ position: 'relative' }}>
      <button onClick={() => setOpen(o => !o)}
        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 16px', background: '#1A1A1A', border: '1px solid #374151', borderRadius: 8, color: '#F9FAFB', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
        ↓ Downloads
      </button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 998 }} />
          <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 8, background: '#111', border: '1px solid #2A2A2A', borderRadius: 10, padding: 8, minWidth: 200, zIndex: 999, boxShadow: '0 8px 32px rgba(0,0,0,.4)' }}>
            {assets.map((asset, i) => (
              <a key={i} href={asset.url} download={asset.name} target="_blank" rel="noreferrer"
                onClick={() => track.event(portal.id, 'download', { asset: asset.name })}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 7, color: '#F9FAFB', textDecoration: 'none', fontSize: 13 }}
                onMouseOver={e => e.currentTarget.style.background = '#1A1A1A'}
                onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                <span style={{ fontSize: 16 }}>📄</span>
                <div>
                  <div style={{ fontWeight: 600 }}>{asset.name}</div>
                  {asset.size && <div style={{ fontSize: 11, color: '#6B7280' }}>{asset.size}</div>}
                </div>
              </a>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Sticky nav bar ───────────────────────────────────────────────────────────
function StickyNav({ portal, onCommentsOpen }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: scrolled ? 'rgba(15,15,15,.95)' : 'transparent', backdropFilter: scrolled ? 'blur(12px)' : 'none', borderBottom: scrolled ? '1px solid #1E1E1E' : '1px solid transparent', transition: 'all .3s', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: '#4B5563', letterSpacing: '.1em', textTransform: 'uppercase' }}>
        Bradley Robert Creative
      </div>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <DownloadButton portal={portal} />
        <button onClick={onCommentsOpen}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 16px', background: '#1A1A1A', border: '1px solid #374151', borderRadius: 8, color: '#F9FAFB', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          💬 Comments
        </button>
      </div>
    </div>
  );
}

// ─── Section map ──────────────────────────────────────────────────────────────
const SECTION_COMPONENTS = {
  hero: ({ content, portal }) => <HeroSection clientName={portal.client_name} company={portal.company} content={content} />,
  brand: ({ content }) => <BrandSection content={content} />,
  logo: ({ content, portal }) => <LogoSection content={content} portalId={portal.id} />,
  colors: ({ content }) => <ColorSection content={content} />,
  typography: ({ content }) => <TypographySection content={content} />,
  custom: ({ content }) => <CustomSection content={content} />,
};

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function PresentationPage() {
  const { portal } = usePortalStore();
  const [scrollDepth, setScrollDepth] = useState(0);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const startTime = useRef(Date.now());

  useEffect(() => {
    const handleScroll = () => {
      const el = document.documentElement;
      const pct = Math.round((el.scrollTop / (el.scrollHeight - el.clientHeight)) * 100);
      if (pct > scrollDepth) {
        setScrollDepth(pct);
        if ([25, 50, 75, 100].includes(pct)) track.event(portal?.id, 'scroll', { percent: pct });
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [scrollDepth, portal?.id]);

  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const section = entry.target.dataset.section;
          if (section) track.event(portal?.id, 'section_view', { section });
        }
      });
    }, { threshold: 0.5 });
    document.querySelectorAll('[data-section]').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, [portal?.id]);

  if (!portal) return null;

  // ── If custom HTML was injected, render it full-screen ──
  if (portal.content?.customHtml) {
    return (
      <iframe
        srcDoc={portal.content.customHtml}
        style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', border: 'none' }}
        title="Brand Presentation"
      />
    );
  }

  const content = portal.content || {};

  const sections = content.sections?.filter(s => s.enabled) || [
    { id: 'hero', type: 'hero', content: content.hero },
    { id: 'brand', type: 'brand', content: content.brand },
    { id: 'logo', type: 'logo', content: content.logo },
    { id: 'colors', type: 'colors', content: content.colors },
    { id: 'typography', type: 'typography', content: content.typography },
  ];

  return (
    <div style={{ fontFamily: 'Inter, sans-serif', background: '#0F0F0F', color: '#F9FAFB' }}>
      <StickyNav portal={portal} onCommentsOpen={() => setCommentsOpen(true)} />

      {sections.map(section => {
        const Comp = SECTION_COMPONENTS[section.type];
        if (!Comp) return null;
        return <Comp key={section.id} content={section.content || {}} portal={portal} />;
      })}

      <ApprovalSection portalId={portal.id} clientName={portal.client_name} />

      <CommentsPanel portalId={portal.id} open={commentsOpen} onClose={() => setCommentsOpen(false)} />
    </div>
  );
}
