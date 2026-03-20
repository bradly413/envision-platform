import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { portals } from '../lib/api';
import api from '../lib/api';

const PORTAL_URL = import.meta.env.VITE_PORTAL_URL || 'https://marvelous-belekoy-63770f.netlify.app';
const API_URL = import.meta.env.VITE_API_URL || 'https://envision-platform-production.up.railway.app/api';

// ─── Full content schema ──────────────────────────────────────────────────────
const DEFAULT_CONTENT = {
  // Brand Identity
  hero: { headline: '', subheadline: 'meet your new brand.', intro: '' },
  brand: { headline: 'The story behind the brand.', positioning: '', pillars: [] },
  colors: { headline: 'The palette.', palette: [] },
  typography: { headline: 'The voice in text.', primaryFont: '', secondaryFont: '', usage: '' },
  logo: { headline: 'The mark.', description: '', variations: [], logoUrl: '' },
  // Website
  website: { headline: 'Your digital home.', description: '', mockups: [], liveUrl: '', features: [] },
  // Social / Digital
  social: { headline: 'Your digital presence.', description: '', platforms: [], examples: [] },
  // Print & Packaging
  print: { headline: 'Built to hold.', description: '', items: [] },
  // Brand Photography
  photography: { headline: 'Your world, visualized.', description: '', images: [], direction: '' },
  // Motion & Video
  motion: { headline: 'Brought to life.', description: '', videos: [], style: '' },
  // Brand Voice
  voice: { headline: 'The way you speak.', tagline: '', tone: '', examples: [], doList: [], dontList: [] },
  // Meta
  sections: [],
};

// ─── System prompt ────────────────────────────────────────────────────────────
const makeSystemPrompt = (portal) => `You are an elite creative director and developer building a premium Brand Experience Portal — "The Envision Portal" — for ${portal?.client_name || 'a client'} at Envision x Bradley Robert Creative.

This is not a simple website. It's a private, immersive presentation that reveals a client's complete brand world: identity, digital presence, marketing, print, photography, motion, and voice — all in one cinematic scrollable experience.

MODES:
- MODE A (CONTENT): Update the structured content fields
- MODE B (CUSTOM HTML): Generate a complete cinematic HTML presentation — use when user mentions "custom", "HTML", "cinematic", "animations", "full version", "Envision Portal", "experience", or wants a visual redesign

Always respond with valid compact JSON only. No markdown outside JSON.

FORMAT A:
{"type":"content","message":"What changed","content":{...full content...},"suggestions":["s1","s2","s3"]}

FORMAT B (COMPLETE HTML FILE — production quality):
{"type":"html","message":"What you built","html":"<!DOCTYPE html>...","suggestions":["s1","s2","s3"]}

FORMAT C:
{"type":"chat","message":"Response","suggestions":["s1","s2"]}

FULL CONTENT SCHEMA:
{
  "hero": {"headline":"","subheadline":"","intro":""},
  "brand": {"headline":"","positioning":"","pillars":[{"title":"","desc":""}]},
  "colors": {"headline":"","palette":[{"name":"","hex":"#000","role":""}]},
  "typography": {"headline":"","primaryFont":"","secondaryFont":"","usage":""},
  "logo": {"headline":"","description":"","variations":[],"logoUrl":""},
  "website": {"headline":"","description":"","mockups":[],"liveUrl":"","features":[]},
  "social": {"headline":"","description":"","platforms":[],"examples":[]},
  "print": {"headline":"","description":"","items":[]},
  "photography": {"headline":"","description":"","images":[],"direction":""},
  "motion": {"headline":"","description":"","videos":[],"style":""},
  "voice": {"headline":"","tagline":"","tone":"","examples":[],"doList":[],"dontList":[]},
  "sections": []
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CUSTOM HTML PORTAL REQUIREMENTS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Generate a COMPLETE self-contained HTML file. ALL CSS in <style>, ALL JS in <script>.

REQUIRED SECTIONS (include all that have content):
1. HERO — Full viewport. Use masked letterform technique: giant client name (font-size:18vw) with background-clip:text revealing a gradient or image. Parallax scroll effect.
2. BRAND STORY — Dark section. Large italic positioning statement as a pull quote. Brand pillars with animated reveal.
3. COLOR PALETTE — Full-bleed color panels side by side, each taking 40vh. Color name + hex overlay on hover.
4. TYPOGRAPHY — Oversized typeface showcase. Show primary font at 120px+. Secondary at 48px. Animated character reveal.
5. LOGO — Clean logo presentation on dark + light backgrounds. Show variations.
6. WEBSITE — Browser mockup frame showing website design. Features list with scroll reveal.
7. SOCIAL MEDIA — Phone/device mockup grid showing social content examples.
8. PRINT — Flat-lay style grid of print items (business cards, letterhead, packaging).
9. PHOTOGRAPHY — Full-bleed image gallery with parallax. Use Unsplash: https://source.unsplash.com/1920x1080/?[industry keywords]
10. MOTION — Video/animation preview section with play button overlays.
11. BRAND VOICE — Typography-forward section. Tagline huge. Do/Don't contrast columns.
12. APPROVAL CTA — Final section. Two buttons: Approve + Request Changes.

VISUAL TECHNIQUES:
- Masked letterform hero (background-clip:text on giant text)
- Parallax scroll via JS scroll listener updating background-position
- IntersectionObserver scroll reveals (fade-up + scale + blur-to-sharp)
- Smooth page load animation (body fades in)
- Sticky section number/title indicator on scroll
- CSS custom properties for all brand colors
- Google Fonts via @import

UNSPLASH IMAGES: Use real photos for atmosphere:
https://source.unsplash.com/1920x1080/?[keywords]
Use client-appropriate keywords based on their industry.

CLIENT: ${portal?.client_name}
Make every section feel hand-crafted for this specific client.`;

// ─── Sections preview ─────────────────────────────────────────────────────────
function SectionsPreview({ content, clientName }) {
  const c = content || {};
  const palette = c.colors?.palette || [];
  const primary = palette[0]?.hex || '#F9FAFB';
  const accent = palette[1]?.hex || '#9CA3AF';

  const SectionHeader = ({ label, color }) => (
    <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.15em', textTransform: 'uppercase', color: color || '#6B7280', marginBottom: 10 }}>{label}</div>
  );

  const Divider = () => <div style={{ height: 1, background: '#1A1A1A', margin: '0' }} />;

  return (
    <div style={{ height: '100%', overflowY: 'auto', fontFamily: 'Inter, sans-serif', background: '#0F0F0F' }}>

      {/* Hero */}
      <div style={{ padding: '56px 24px', textAlign: 'center', background: `radial-gradient(ellipse at center, ${primary}22 0%, #0F0F0F 70%)`, borderBottom: '1px solid #1A1A1A' }}>
        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.25em', textTransform: 'uppercase', color: '#4B5563', marginBottom: 20 }}>Envision x Bradley Robert Creative</div>
        <h1 style={{ fontSize: 'clamp(28px, 6vw, 60px)', fontWeight: 900, color: '#F9FAFB', lineHeight: 1.05, margin: '0 0 16px', letterSpacing: '-.03em' }}>
          {c.hero?.headline || clientName},<br />
          <span style={{ color: accent, fontStyle: 'italic', fontWeight: 300 }}>{c.hero?.subheadline || 'meet your new brand.'}</span>
        </h1>
        {c.hero?.intro && <p style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.7, margin: '0 auto', maxWidth: 480 }}>{c.hero.intro}</p>}
      </div>

      <Divider />

      {/* Brand */}
      {c.brand?.positioning && (
        <>
          <div style={{ padding: '32px 24px', borderBottom: '1px solid #1A1A1A' }}>
            <SectionHeader label="01 — Brand Strategy" color="#3B82F6" />
            <blockquote style={{ fontSize: 16, fontStyle: 'italic', color: '#F9FAFB', lineHeight: 1.6, margin: '0 0 20px', borderLeft: `3px solid ${primary}`, paddingLeft: 16 }}>
              "{c.brand.positioning}"
            </blockquote>
            <div style={{ display: 'grid', gap: 8 }}>
              {(c.brand.pillars || []).map((p, i) => (
                <div key={i} style={{ padding: '10px 14px', background: '#1A1A1A', borderRadius: 6, borderLeft: `2px solid ${palette[i % palette.length]?.hex || '#374151'}` }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#F9FAFB' }}>{p.title}</div>
                  <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>{p.desc}</div>
                </div>
              ))}
            </div>
          </div>
          <Divider />
        </>
      )}

      {/* Colors */}
      {palette.length > 0 && (
        <>
          <div style={{ borderBottom: '1px solid #1A1A1A' }}>
            <div style={{ padding: '20px 24px 12px' }}>
              <SectionHeader label="02 — Color Palette" color="#F59E0B" />
            </div>
            <div style={{ display: 'flex', height: 80 }}>
              {palette.map((color, i) => (
                <div key={i} style={{ flex: 1, background: color.hex, display: 'flex', alignItems: 'flex-end', padding: '8px 10px', position: 'relative' }}>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,.9)', textShadow: '0 1px 3px rgba(0,0,0,.5)' }}>{color.name}</div>
                    <div style={{ fontSize: 8, color: 'rgba(255,255,255,.6)', fontFamily: 'monospace' }}>{color.hex}</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ padding: '12px 24px 20px' }}>
              {palette.map((c, i) => c.role && <div key={i} style={{ fontSize: 11, color: '#4B5563', marginBottom: 2 }}><span style={{ color: c.hex }}>●</span> {c.name} — {c.role}</div>)}
            </div>
          </div>
          <Divider />
        </>
      )}

      {/* Typography */}
      {c.typography?.primaryFont && (
        <>
          <div style={{ padding: '32px 24px', borderBottom: '1px solid #1A1A1A' }}>
            <SectionHeader label="03 — Typography" color="#EF4444" />
            <div style={{ fontSize: 48, fontWeight: 900, color: '#F9FAFB', lineHeight: 1, marginBottom: 8, letterSpacing: '-.03em' }}>{c.typography.primaryFont}</div>
            {c.typography.secondaryFont && <div style={{ fontSize: 22, color: accent, marginBottom: 12, fontStyle: 'italic' }}>{c.typography.secondaryFont}</div>}
            <div style={{ fontSize: 13, color: '#F9FAFB', marginBottom: 4, opacity: .5 }}>Aa Bb Cc Dd Ee Ff Gg 0123456789</div>
            {c.typography.usage && <p style={{ fontSize: 11, color: '#6B7280', margin: 0, lineHeight: 1.6 }}>{c.typography.usage}</p>}
          </div>
          <Divider />
        </>
      )}

      {/* Logo */}
      {(c.logo?.description || c.logo?.logoUrl) && (
        <>
          <div style={{ padding: '32px 24px', borderBottom: '1px solid #1A1A1A' }}>
            <SectionHeader label="04 — Logo System" color="#10B981" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
              {['Dark', 'Light'].map((bg, i) => (
                <div key={bg} style={{ height: 80, background: i === 0 ? '#0F0F0F' : '#F9FAFB', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #2A2A2A' }}>
                  {c.logo?.logoUrl ? (
                    <img src={c.logo.logoUrl} alt="Logo" style={{ maxHeight: 48, maxWidth: '80%', filter: i === 0 ? 'none' : 'invert(1)' }} />
                  ) : (
                    <div style={{ fontSize: 11, color: i === 0 ? '#374151' : '#9CA3AF' }}>Logo — {bg}</div>
                  )}
                </div>
              ))}
            </div>
            {c.logo.description && <p style={{ fontSize: 11, color: '#6B7280', margin: 0, lineHeight: 1.6 }}>{c.logo.description}</p>}
          </div>
          <Divider />
        </>
      )}

      {/* Website */}
      {c.website?.description && (
        <>
          <div style={{ padding: '32px 24px', borderBottom: '1px solid #1A1A1A' }}>
            <SectionHeader label="05 — Website Design" color="#8B5CF6" />
            <div style={{ background: '#1A1A1A', borderRadius: 10, overflow: 'hidden', marginBottom: 14 }}>
              <div style={{ background: '#2A2A2A', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ display: 'flex', gap: 4 }}>{['#FF5F57','#FFBD2E','#28C840'].map(col => <div key={col} style={{ width: 8, height: 8, borderRadius: '50%', background: col }} />)}</div>
                <div style={{ flex: 1, background: '#111', borderRadius: 3, padding: '2px 8px', fontSize: 9, color: '#4B5563', fontFamily: 'monospace' }}>{c.website.liveUrl || `www.${clientName?.toLowerCase().replace(/\s+/g,'-')}.com`}</div>
              </div>
              {c.website.mockups?.[0] ? (
                <img src={c.website.mockups[0]} alt="Website mockup" style={{ width: '100%', display: 'block' }} />
              ) : (
                <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#374151', fontSize: 12 }}>Website mockup</div>
              )}
            </div>
            <p style={{ fontSize: 11, color: '#9CA3AF', margin: '0 0 10px', lineHeight: 1.6 }}>{c.website.description}</p>
            {c.website.features?.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {c.website.features.map((f, i) => <span key={i} style={{ fontSize: 10, background: '#1A1A1A', color: '#9CA3AF', borderRadius: 20, padding: '3px 10px' }}>{f}</span>)}
              </div>
            )}
          </div>
          <Divider />
        </>
      )}

      {/* Social */}
      {c.social?.description && (
        <>
          <div style={{ padding: '32px 24px', borderBottom: '1px solid #1A1A1A' }}>
            <SectionHeader label="06 — Social & Digital" color="#EC4899" />
            <p style={{ fontSize: 11, color: '#9CA3AF', margin: '0 0 14px', lineHeight: 1.6 }}>{c.social.description}</p>
            {c.social.examples?.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4 }}>
                {c.social.examples.slice(0, 6).map((ex, i) => (
                  <div key={i} style={{ aspectRatio: '1', background: palette[i % palette.length]?.hex || '#1A1A1A', borderRadius: 4, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {ex.imageUrl ? <img src={ex.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ fontSize: 9, color: 'rgba(255,255,255,.4)' }}>{ex.platform || 'Post'}</div>}
                  </div>
                ))}
              </div>
            )}
            {c.social.platforms?.length > 0 && (
              <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
                {c.social.platforms.map((p, i) => <span key={i} style={{ fontSize: 10, background: '#1A1A1A', color: '#9CA3AF', borderRadius: 20, padding: '3px 10px' }}>{p}</span>)}
              </div>
            )}
          </div>
          <Divider />
        </>
      )}

      {/* Print */}
      {c.print?.description && (
        <>
          <div style={{ padding: '32px 24px', borderBottom: '1px solid #1A1A1A' }}>
            <SectionHeader label="07 — Print & Packaging" color="#F59E0B" />
            <p style={{ fontSize: 11, color: '#9CA3AF', margin: '0 0 14px', lineHeight: 1.6 }}>{c.print.description}</p>
            {c.print.items?.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                {c.print.items.map((item, i) => (
                  <div key={i} style={{ background: '#1A1A1A', borderRadius: 8, overflow: 'hidden' }}>
                    {item.imageUrl ? <img src={item.imageUrl} alt={item.name} style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover', display: 'block' }} /> : <div style={{ aspectRatio: '4/3', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#374151', fontSize: 11 }}>{item.name || 'Print item'}</div>}
                    {item.name && <div style={{ padding: '8px 10px', fontSize: 11, color: '#9CA3AF' }}>{item.name}</div>}
                  </div>
                ))}
              </div>
            )}
          </div>
          <Divider />
        </>
      )}

      {/* Photography */}
      {c.photography?.description && (
        <>
          <div style={{ padding: '32px 24px', borderBottom: '1px solid #1A1A1A' }}>
            <SectionHeader label="08 — Brand Photography" color="#06B6D4" />
            <p style={{ fontSize: 11, color: '#9CA3AF', margin: '0 0 14px', lineHeight: 1.6 }}>{c.photography.description}</p>
            {c.photography.images?.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 4 }}>
                {c.photography.images.slice(0, 4).map((img, i) => (
                  <div key={i} style={{ aspectRatio: i === 0 ? '16/9' : '1', gridColumn: i === 0 ? 'span 2' : 'span 1', borderRadius: 6, overflow: 'hidden' }}>
                    <img src={img.url || img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  </div>
                ))}
              </div>
            )}
          </div>
          <Divider />
        </>
      )}

      {/* Motion */}
      {c.motion?.description && (
        <>
          <div style={{ padding: '32px 24px', borderBottom: '1px solid #1A1A1A' }}>
            <SectionHeader label="09 — Motion & Video" color="#A78BFA" />
            <p style={{ fontSize: 11, color: '#9CA3AF', margin: '0 0 14px', lineHeight: 1.6 }}>{c.motion.description}</p>
            {c.motion.videos?.length > 0 && (
              <div style={{ display: 'grid', gap: 8 }}>
                {c.motion.videos.slice(0, 2).map((v, i) => (
                  <div key={i} style={{ aspectRatio: '16/9', background: '#1A1A1A', borderRadius: 8, overflow: 'hidden', position: 'relative' }}>
                    {v.thumbnailUrl ? <img src={v.thumbnailUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#374151', fontSize: 11 }}>{v.title || 'Video'}</div>}
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,.15)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>▶</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <Divider />
        </>
      )}

      {/* Brand Voice */}
      {c.voice?.tagline && (
        <>
          <div style={{ padding: '32px 24px', borderBottom: '1px solid #1A1A1A' }}>
            <SectionHeader label="10 — Brand Voice" color="#34D399" />
            <div style={{ fontSize: 28, fontWeight: 900, color: '#F9FAFB', lineHeight: 1.1, marginBottom: 16, letterSpacing: '-.02em' }}>"{c.voice.tagline}"</div>
            {c.voice.tone && <p style={{ fontSize: 11, color: '#9CA3AF', margin: '0 0 16px', lineHeight: 1.6 }}>{c.voice.tone}</p>}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {c.voice.doList?.length > 0 && (
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#10B981', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.08em' }}>We do</div>
                  {c.voice.doList.map((d, i) => <div key={i} style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 4 }}>✓ {d}</div>)}
                </div>
              )}
              {c.voice.dontList?.length > 0 && (
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#EF4444', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.08em' }}>We don't</div>
                  {c.voice.dontList.map((d, i) => <div key={i} style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 4 }}>✗ {d}</div>)}
                </div>
              )}
            </div>
          </div>
          <Divider />
        </>
      )}

      {/* CTA */}
      <div style={{ padding: '60px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.2em', textTransform: 'uppercase', color: '#4B5563', marginBottom: 16 }}>Your decision</div>
        <h2 style={{ fontSize: 28, fontWeight: 900, color: '#F9FAFB', margin: '0 0 10px', letterSpacing: '-.02em' }}>This is your brand world.</h2>
        <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 32, lineHeight: 1.7 }}>Approve to move forward, or share what you'd like refined.</p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <div style={{ padding: '14px 32px', background: primary, color: '#fff', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Approve ✓</div>
          <div style={{ padding: '14px 32px', border: '1px solid #374151', color: '#9CA3AF', borderRadius: 8, fontSize: 14, cursor: 'pointer' }}>Request changes</div>
        </div>
      </div>
    </div>
  );
}

// ─── Live preview wrapper ─────────────────────────────────────────────────────
function LivePreview({ content, customHtml, clientName, previewMode, setPreviewMode }) {
  const iframeRef = useRef(null);
  useEffect(() => {
    if (customHtml && iframeRef.current) {
      const doc = iframeRef.current.contentDocument;
      if (doc) { doc.open(); doc.write(customHtml); doc.close(); }
    }
  }, [customHtml]);

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
        {previewMode === 'html' && customHtml
          ? <iframe ref={iframeRef} style={{ width: '100%', height: '100%', border: 'none' }} title="Portal preview" sandbox="allow-scripts allow-same-origin" />
          : <SectionsPreview content={content} clientName={clientName} />
        }
      </div>
    </div>
  );
}

// ─── Message ──────────────────────────────────────────────────────────────────
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
        <div style={{ display: 'flex', gap: 6, marginTop: 3 }}>
          {msg.changed && <div style={{ fontSize: 10, color: '#10B981', fontWeight: 600 }}>✓ Portal updated</div>}
          {msg.htmlGenerated && <div style={{ fontSize: 10, color: '#6366F1', fontWeight: 600 }}>✦ Envision Portal generated</div>}
        </div>
      </div>
    </div>
  );
}

// ─── Settings ─────────────────────────────────────────────────────────────────
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
          <div style={{ fontSize: 14, fontWeight: 600 }}>{portal.client_name}</div>
        </div>
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 4 }}>URL</div>
          <div style={{ fontSize: 12, fontFamily: 'monospace', color: '#6B7280', background: '#F3F4F6', padding: '6px 10px', borderRadius: 6, wordBreak: 'break-all' }}>{PORTAL_URL}/{portal.slug}</div>
        </div>
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 8 }}>Status</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {['draft', 'active', 'archived'].map(s => (
              <button key={s} onClick={() => setStatus(s)} style={{ fontSize: 12, fontWeight: 600, padding: '6px 14px', borderRadius: 20, border: 'none', cursor: 'pointer', textTransform: 'capitalize', background: status === s ? '#111827' : '#F3F4F6', color: status === s ? '#fff' : '#6B7280' }}>{s}</button>
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
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  useEffect(() => {
    if (!portal) return;
    const c = portal.content || {};
    const initial = { ...DEFAULT_CONTENT };
    Object.keys(DEFAULT_CONTENT).forEach(k => { if (c[k]) initial[k] = c[k]; });
    setContent(initial);
    if (c.customHtml) { setCustomHtml(c.customHtml); setPreviewMode('html'); }
    setMessages([{ role: 'assistant', content: `Ready to build the ${portal.client_name} Envision Portal. I can build brand identity, website mockups, social content, print, photography direction, motion, and brand voice — all in one immersive experience. What would you like to create?` }]);
    setSuggestions([
      `Build a complete Envision Portal for ${portal.client_name}`,
      'Generate the full cinematic HTML experience',
      'Start with brand identity and colors',
      'Upload a logo or brand asset to build around',
    ]);
    setHistory([]); setHistoryIndex(-1);
  }, [portal?.id]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const pushHistory = (c, html) => {
    const newH = history.slice(0, historyIndex + 1);
    newH.push({ content: c, customHtml: html });
    setHistory(newH); setHistoryIndex(newH.length - 1);
  };

  const undo = () => {
    if (historyIndex <= 0) return;
    const prev = history[historyIndex - 1];
    setHistoryIndex(historyIndex - 1);
    setContent(prev.content); setCustomHtml(prev.customHtml);
    if (prev.customHtml) setPreviewMode('html');
  };

  const redo = () => {
    if (historyIndex >= history.length - 1) return;
    const next = history[historyIndex + 1];
    setHistoryIndex(historyIndex + 1);
    setContent(next.content); setCustomHtml(next.customHtml);
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
    if (!apiKey) throw new Error('VITE_ANTHROPIC_API_KEY not configured');
    const isHtmlReq = /custom|html|cinematic|animation|full version|envision portal|experience|immersive|scroll|parallax|visual|redesign|template|like that/i.test(userMessage);
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: isHtmlReq ? 8000 : 2000,
        system: makeSystemPrompt(portal),
        messages: [
          ...messages.slice(-4).filter(m => m.role === 'user' || m.role === 'assistant').map(m => ({ role: m.role, content: m.content })),
          { role: 'user', content: `Current content: ${JSON.stringify(content)}\n${extraContext}\nRequest: ${userMessage}` }
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
      const m = raw.match(/"message"\s*:\s*"([^"]+)"/);
      return { type: 'chat', message: m?.[1] || raw.substring(0, 200), suggestions: [] };
    }
    return { type: 'chat', message: raw.substring(0, 200), suggestions: [] };
  };

  const applyParsed = (parsed) => {
    if (parsed.type === 'content' && parsed.content) {
      const newC = { ...content, ...parsed.content };
      setContent(newC); setPreviewMode('content');
      pushHistory(newC, customHtml);
      saveMutation.mutate({ content: { ...newC, customHtml } });
      return { changed: true, htmlGenerated: false };
    } else if (parsed.type === 'html' && parsed.html) {
      setCustomHtml(parsed.html); setPreviewMode('html');
      pushHistory(content, parsed.html);
      saveMutation.mutate({ content: { ...content, customHtml: parsed.html } });
      return { changed: false, htmlGenerated: true };
    }
    return { changed: false, htmlGenerated: false };
  };

  const handleSend = async (messageText) => {
    const text = messageText || input;
    if (!text.trim() || loading) return;
    setInput(''); setSuggestions([]);
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setLoading(true);
    try {
      const urlMatch = text.match(/https?:\/\/[^\s]+/);
      let extraContext = '';
      if (urlMatch) {
        setMessages(prev => [...prev, { role: 'assistant', content: `Analyzing ${urlMatch[0]}…` }]);
        try {
          const fetchRes = await api.post('/uploads/fetch-url', { url: urlMatch[0] });
          extraContext = `\nURL Analysis (${urlMatch[0]}): Title: ${fetchRes.title}, Colors: ${fetchRes.colors?.join(',')}, Fonts: ${fetchRes.fonts?.join(',')}, Animation: ${fetchRes.animationCount > 5 ? 'rich' : 'minimal'}, Parallax: ${fetchRes.hasParallax}. Apply this aesthetic.`;
          setMessages(prev => prev.slice(0, -1));
        } catch { extraContext = `\nApply a premium aesthetic inspired by ${urlMatch[0]}.`; }
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
    setShowAttachMenu(false); setUploadingFile(true);
    setMessages(prev => [...prev, { role: 'user', content: `Uploading ${file.name}…` }]);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const token = (() => { try { return JSON.parse(localStorage.getItem('envision-auth'))?.state?.token || ''; } catch { return ''; } })();
      const res = await fetch(`${API_URL}/uploads/asset`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: formData });
      const asset = await res.json();
      if (asset.error) throw new Error(asset.error);
      setMessages(prev => { const u = [...prev]; u[u.length-1] = { role: 'user', content: `Uploaded: ${file.name}`, imageUrl: asset.url }; return u; });
      setLoading(true);
      const parsed = await callClaude(`Uploaded asset: ${file.name} at URL ${asset.url}. It's a ${asset.type}. Incorporate it into the portal — if it's a logo use it in the logo section, if it's a photo use it in photography or as a hero background.`);
      const { changed, htmlGenerated } = applyParsed(parsed);
      setMessages(prev => [...prev, { role: 'assistant', content: parsed.message || 'Asset added!', changed, htmlGenerated }]);
      if (parsed.suggestions?.length) setSuggestions(parsed.suggestions.slice(0, 4));
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: `Upload failed: ${err.message}` }]);
    } finally { setUploadingFile(false); setLoading(false); }
  };

  const handleKey = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } };

  if (!portal || !content) return <div style={{ padding: 40, fontSize: 14, color: '#6B7280', fontFamily: 'Inter, sans-serif' }}>Loading portal…</div>;

  const saveBg = saveStatus === 'saved' ? '#10B981' : saveStatus === 'error' ? '#EF4444' : '#111827';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', fontFamily: 'Inter, sans-serif', position: 'relative' }}>
      {showSettings && <SettingsPanel portal={portal} onClose={() => setShowSettings(false)} />}

      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 20px', background: '#fff', borderBottom: '1px solid #E5E7EB', flexShrink: 0 }}>
        <button onClick={() => navigate('/portals')} style={{ fontSize: 13, color: '#6B7280', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>← Portals</button>
        <div style={{ width: 1, height: 16, background: '#E5E7EB' }} />
        <span style={{ fontSize: 14, fontWeight: 800, color: '#111827' }}>{portal.client_name}</span>
        <span style={{ fontSize: 11, background: '#EEF2FF', color: '#6366F1', borderRadius: 20, padding: '2px 10px', fontWeight: 700 }}>Envision Portal Builder</span>
        <div style={{ display: 'flex', gap: 4 }}>
          <button onClick={undo} disabled={historyIndex <= 0} title="Undo" style={{ width: 28, height: 28, borderRadius: 6, background: historyIndex > 0 ? '#F3F4F6' : 'transparent', border: 'none', cursor: historyIndex > 0 ? 'pointer' : 'not-allowed', color: historyIndex > 0 ? '#374151' : '#D1D5DB', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>↩</button>
          <button onClick={redo} disabled={historyIndex >= history.length - 1} title="Redo" style={{ width: 28, height: 28, borderRadius: 6, background: historyIndex < history.length - 1 ? '#F3F4F6' : 'transparent', border: 'none', cursor: historyIndex < history.length - 1 ? 'pointer' : 'not-allowed', color: historyIndex < history.length - 1 ? '#374151' : '#D1D5DB', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>↪</button>
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ fontSize: 11, color: saveStatus === 'saved' ? '#10B981' : 'transparent', fontWeight: 600 }}>✓ Saved</div>
        <button onClick={() => setShowSettings(true)} style={{ fontSize: 12, color: '#6B7280', background: '#F3F4F6', border: 'none', borderRadius: 7, padding: '6px 12px', cursor: 'pointer' }}>⚙ Settings</button>
        <button onClick={() => window.open(`${PORTAL_URL}/${portal.slug}`, '_blank')} style={{ fontSize: 12, color: '#374151', background: '#F3F4F6', border: 'none', borderRadius: 7, padding: '6px 12px', cursor: 'pointer' }}>Open ↗</button>
        <button onClick={handleSave} disabled={saveStatus === 'saving'} style={{ fontSize: 13, fontWeight: 700, padding: '7px 18px', background: saveBg, color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', transition: 'background .2s' }}>Save</button>
      </div>

      {/* Body */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '400px 1fr', overflow: 'hidden' }}>

        {/* Chat */}
        <div style={{ borderRight: '1px solid #E5E7EB', display: 'flex', flexDirection: 'column', background: '#fff', overflow: 'hidden' }}>
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 16px' }}>
            {messages.map((msg, i) => <Message key={i} msg={msg} />)}
            {(loading || uploadingFile) && (
              <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'flex-start' }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#6366F1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#fff' }}>✦</div>
                <div style={{ background: '#F3F4F6', borderRadius: '12px 12px 12px 4px', padding: '12px 16px' }}>
                  <div style={{ display: 'flex', gap: 5 }}>{[0,1,2].map(i => <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: '#9CA3AF', animation: 'bounce 1.4s infinite', animationDelay: `${i*.2}s` }} />)}</div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {suggestions.length > 0 && !loading && (
            <div style={{ padding: '0 16px 10px', display: 'flex', flexDirection: 'column', gap: 5 }}>
              {suggestions.map((s, i) => (
                <button key={i} onClick={() => handleSend(s)} style={{ textAlign: 'left', fontSize: 12, color: '#374151', background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 8, padding: '8px 12px', cursor: 'pointer', lineHeight: 1.4 }}
                  onMouseOver={e => e.currentTarget.style.background = '#F3F4F6'} onMouseOut={e => e.currentTarget.style.background = '#F9FAFB'}>
                  ↳ {s}
                </button>
              ))}
            </div>
          )}

          <div style={{ padding: '12px 16px', borderTop: '1px solid #E5E7EB' }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', marginBottom: 6 }}>
              <div style={{ position: 'relative' }}>
                <button onClick={() => setShowAttachMenu(s => !s)} style={{ width: 36, height: 36, borderRadius: 8, background: showAttachMenu ? '#111827' : '#F3F4F6', border: 'none', cursor: 'pointer', fontSize: 18, color: showAttachMenu ? '#fff' : '#6B7280', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .15s' }}>+</button>
                {showAttachMenu && (
                  <div style={{ position: 'absolute', bottom: '100%', left: 0, marginBottom: 6, background: '#fff', border: '1px solid #E5E7EB', borderRadius: 10, padding: 6, minWidth: 220, boxShadow: '0 8px 24px rgba(0,0,0,.12)', zIndex: 50 }}>
                    {[
                      { icon: '🖼', label: 'Upload image or video', action: () => { fileInputRef.current.accept='image/*,video/*'; fileInputRef.current.click(); setShowAttachMenu(false); } },
                      { icon: '🔗', label: 'Paste URL to analyze', action: () => { setShowAttachMenu(false); setInput('Analyze this URL and apply the design style: '); } },
                      { icon: '🎬', label: 'Build full cinematic portal', action: () => { setShowAttachMenu(false); handleSend('Generate the full cinematic Envision Portal HTML with all sections: brand identity, website mockup, social, print, photography, motion, and brand voice. Make it immersive with scroll animations and masked letterform hero.'); } },
                      { icon: '📐', label: 'Add website mockup section', action: () => { setShowAttachMenu(false); handleSend('Add a website design section with browser mockup and feature list'); } },
                      { icon: '📱', label: 'Add social media section', action: () => { setShowAttachMenu(false); handleSend('Add a social media and digital marketing section with platform grid'); } },
                      { icon: '🖨', label: 'Add print section', action: () => { setShowAttachMenu(false); handleSend('Add a print and packaging section'); } },
                    ].map(item => (
                      <button key={item.label} onClick={item.action} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '9px 12px', background: 'none', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: 12, color: '#111827', textAlign: 'left' }}
                        onMouseOver={e => e.currentTarget.style.background = '#F9FAFB'} onMouseOut={e => e.currentTarget.style.background = 'none'}>
                        <span>{item.icon}</span> {item.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKey} placeholder="Describe what to build, paste a URL, or ask anything…" rows={2}
                style={{ flex: 1, padding: '10px 12px', border: '1px solid #E5E7EB', borderRadius: 10, fontSize: 13, fontFamily: 'Inter, sans-serif', resize: 'none', outline: 'none', lineHeight: 1.5, color: '#111827' }}
                onFocus={e => e.target.style.borderColor = '#111827'} onBlur={e => e.target.style.borderColor = '#E5E7EB'} />
              <button onClick={() => handleSend()} disabled={loading || uploadingFile || !input.trim()} style={{ width: 36, height: 36, borderRadius: 10, background: input.trim() ? '#111827' : '#E5E7EB', border: 'none', cursor: input.trim() ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background .15s' }}>
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

      <style>{`@keyframes bounce{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-6px)}}`}</style>
    </div>
  );
}
