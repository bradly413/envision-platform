import { motion } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  CINEMATIC_ATMOSPHERE_PRESETS,
  DEFAULT_CINEMATIC_FLOW,
  getSceneDefinition,
} from './sceneRegistry';

function rgba(hex, alpha) {
  const value = String(hex || '').replace('#', '');
  if (value.length !== 6) return `rgba(255,255,255,${alpha})`;
  const r = Number.parseInt(value.slice(0, 2), 16);
  const g = Number.parseInt(value.slice(2, 4), 16);
  const b = Number.parseInt(value.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function inferMediaKind(url = '') {
  const value = String(url || '').toLowerCase();
  if (/\.(mp4|mov|webm|m4v)(\?|#|$)/.test(value)) return 'video';
  if (/\.(png|jpg|jpeg|gif|webp|svg)(\?|#|$)/.test(value)) return 'image';
  return 'embed';
}

function splitHeadline(headline = '') {
  const words = String(headline || '').trim().split(/\s+/).filter(Boolean);
  if (words.length <= 2) return { lead: headline, trail: '' };
  const pivot = Math.ceil(words.length / 2);
  return {
    lead: words.slice(0, pivot).join(' '),
    trail: words.slice(pivot).join(' '),
  };
}

function mergeFlow(cinematicFlow = {}) {
  const defaults = DEFAULT_CINEMATIC_FLOW.cinematicFlow;
  const atmospherePreset = cinematicFlow?.atmosphere?.preset || defaults.atmosphere.preset;
  const presetValues = CINEMATIC_ATMOSPHERE_PRESETS[atmospherePreset] || CINEMATIC_ATMOSPHERE_PRESETS['deep-tech'];

  return {
    ...defaults,
    ...cinematicFlow,
    theme: {
      ...defaults.theme,
      ...(cinematicFlow.theme || {}),
    },
    shell: {
      ...defaults.shell,
      ...(cinematicFlow.shell || {}),
    },
    atmosphere: {
      ...defaults.atmosphere,
      ...presetValues,
      ...(cinematicFlow.atmosphere || {}),
    },
    motion: {
      ...defaults.motion,
      ...(cinematicFlow.motion || {}),
    },
    scenes: Array.isArray(cinematicFlow.scenes) && cinematicFlow.scenes.length
      ? cinematicFlow.scenes
      : defaults.scenes,
  };
}

function GrainOverlay({ enabled }) {
  if (!enabled) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 2,
        pointerEvents: 'none',
        opacity: 0.06,
        mixBlendMode: 'soft-light',
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 180 180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.1' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='180' height='180' filter='url(%23n)'/%3E%3C/svg%3E\")",
      }}
    />
  );
}

function AtmosphereLayer({ theme, atmosphere }) {
  const particles = useMemo(
    () => Array.from({ length: atmosphere.particles ? 24 : 10 }, (_, index) => ({
      id: index,
      left: `${(index * 17) % 100}%`,
      top: `${(index * 29) % 100}%`,
      size: 2 + (index % 4) * 2,
      duration: 16 + (index % 5) * 3,
      delay: (index % 6) * 0.8,
    })),
    [atmosphere.particles]
  );

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 0, overflow: 'hidden', pointerEvents: 'none', background: theme.base }}>
      <div
        style={{
          position: 'absolute',
          inset: '-10%',
          background: `radial-gradient(circle at 20% 20%, ${rgba(theme.accent, 0.26)} 0%, transparent 38%),
            radial-gradient(circle at 80% 24%, ${rgba(theme.accentAlt, 0.18)} 0%, transparent 34%),
            radial-gradient(circle at 50% 80%, ${rgba(theme.surface, 0.22)} 0%, transparent 46%)`,
          filter: 'blur(18px)',
          opacity: atmosphere.intensity === 'high' ? 1 : atmosphere.intensity === 'medium' ? 0.84 : 0.64,
        }}
      />

      {atmosphere.orbitalRings && (
        <>
          {[0, 1, 2].map((ring) => (
            <motion.div
              key={ring}
              animate={{ rotate: ring % 2 === 0 ? 360 : -360 }}
              transition={{ duration: 28 + ring * 10, ease: 'linear', repeat: Infinity }}
              style={{
                position: 'absolute',
                inset: `${12 + ring * 8}%`,
                borderRadius: '50%',
                border: `1px solid ${rgba(theme.text, 0.06 - ring * 0.01)}`,
              }}
            />
          ))}
        </>
      )}

      {atmosphere.floatingAtmosphere && (
        <>
          <motion.div
            animate={{ x: [0, 24, -16, 0], y: [0, -24, 20, 0], scale: [1, 1.08, 0.96, 1] }}
            transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              position: 'absolute',
              left: '8%',
              top: '18%',
              width: '28vw',
              height: '28vw',
              borderRadius: '50%',
              background: rgba(theme.accent, 0.12),
              filter: 'blur(60px)',
            }}
          />
          <motion.div
            animate={{ x: [0, -18, 22, 0], y: [0, 28, -16, 0], scale: [1, 0.94, 1.06, 1] }}
            transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              position: 'absolute',
              right: '10%',
              bottom: '14%',
              width: '24vw',
              height: '24vw',
              borderRadius: '50%',
              background: rgba(theme.accentAlt, 0.1),
              filter: 'blur(72px)',
            }}
          />
        </>
      )}

      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          animate={{ y: ['0%', '-12%', '0%'], opacity: [0.12, 0.38, 0.12] }}
          transition={{ duration: particle.duration, delay: particle.delay, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            position: 'absolute',
            left: particle.left,
            top: particle.top,
            width: particle.size,
            height: particle.size,
            borderRadius: '50%',
            background: rgba(theme.text, 0.55),
            boxShadow: `0 0 18px ${rgba(theme.accent, 0.22)}`,
          }}
        />
      ))}
    </div>
  );
}

function ProgressRail({ currentIndex, total, theme }) {
  const progress = total > 1 ? currentIndex / (total - 1) : 1;

  return (
    <div style={{ position: 'fixed', left: 24, top: 24, bottom: 24, zIndex: 4, display: 'flex', alignItems: 'center' }}>
      <div style={{ width: 4, height: 180, background: rgba(theme.text, 0.08), borderRadius: 999, overflow: 'hidden' }}>
        <motion.div
          animate={{ height: `${Math.max(progress * 100, 8)}%` }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          style={{
            width: '100%',
            background: `linear-gradient(180deg, ${theme.accent}, ${theme.accentAlt})`,
            borderRadius: 999,
          }}
        />
      </div>
    </div>
  );
}

function SectionDots({ scenes, currentIndex, theme, onNavigate }) {
  return (
    <div style={{ position: 'fixed', right: 24, top: '50%', transform: 'translateY(-50%)', zIndex: 4, display: 'flex', flexDirection: 'column', gap: 10 }}>
      {scenes.map((scene, index) => {
        const definition = getSceneDefinition(scene.type);
        const active = index === currentIndex;
        const label = scene.headline || definition?.label || `Scene ${index + 1}`;
        return (
          <button
            key={scene.id || `${scene.type}-${index}`}
            onClick={() => onNavigate(index)}
            title={label}
            style={{
              width: active ? 26 : 12,
              height: 12,
              borderRadius: 999,
              border: `1px solid ${active ? theme.accentAlt : rgba(theme.text, 0.24)}`,
              background: active ? theme.accent : rgba(theme.text, 0.08),
              cursor: 'pointer',
              transition: 'all 180ms ease',
            }}
          />
        );
      })}
    </div>
  );
}

function SceneShell({ align = 'left', children }) {
  return (
    <div
      style={{
        minHeight: '100vh',
        padding: 'clamp(88px, 10vw, 120px) clamp(28px, 5vw, 64px)',
        display: 'grid',
        alignItems: 'center',
        position: 'relative',
      }}
    >
      <div style={{ width: '100%', maxWidth: 1200, margin: '0 auto', textAlign: align === 'center' ? 'center' : 'left' }}>
        {children}
      </div>
    </div>
  );
}

function SceneEyebrow({ children, theme }) {
  if (!children) return null;
  return (
    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.22em', textTransform: 'uppercase', color: rgba(theme.text, 0.55), marginBottom: 20 }}>
      {children}
    </div>
  );
}

function SceneMediaSurface({ scene, theme, height = 360, radius = 28, overlay = 0.24 }) {
  if (!scene?.mediaUrl) return null;

  const kind = inferMediaKind(scene.mediaUrl);
  const mediaFit = scene.mediaFit || 'cover';
  const focalPoint = scene.focalPoint || 'center center';

  return (
    <div
      style={{
        position: 'relative',
        height,
        borderRadius: radius,
        overflow: 'hidden',
        border: `1px solid ${rgba(theme.text, 0.08)}`,
        background: rgba(theme.surface, 0.18),
        boxShadow: `0 30px 100px ${rgba(theme.base, 0.42)}`,
      }}
    >
      {kind === 'video' ? (
        <video
          src={scene.mediaUrl}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          style={{ width: '100%', height: '100%', objectFit: mediaFit, objectPosition: focalPoint }}
        />
      ) : kind === 'image' ? (
        <img
          src={scene.mediaUrl}
          alt={scene.mediaLabel || scene.headline || 'Scene media'}
          style={{ width: '100%', height: '100%', objectFit: mediaFit, objectPosition: focalPoint }}
        />
      ) : (
        <iframe
          src={scene.mediaUrl}
          title={scene.mediaLabel || scene.headline || 'Scene embed'}
          style={{ width: '100%', height: '100%', border: 'none', background: '#000' }}
          allow="autoplay; fullscreen"
        />
      )}

      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(180deg, ${rgba(theme.base, overlay * 0.3)}, ${rgba(theme.base, overlay)})`,
          pointerEvents: 'none',
        }}
      />

      {scene.mediaLabel ? (
        <div
          style={{
            position: 'absolute',
            left: 18,
            bottom: 16,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '.14em',
            textTransform: 'uppercase',
            color: rgba(theme.text, 0.82),
            zIndex: 1,
          }}
        >
          {scene.mediaLabel}
        </div>
      ) : null}
    </div>
  );
}

function getReferenceText(scene = {}) {
  const references = Array.isArray(scene.referenceAssets) ? scene.referenceAssets : [];
  return references
    .map((reference) => reference?.excerpt || reference?.brief?.summary || reference?.label || '')
    .filter(Boolean)
    .join(' ');
}

function OpeningTitleScene({ scene, theme }) {
  const parts = splitHeadline(scene.headline || 'Brand Narrative');
  return (
    <SceneShell align={scene.layout === 'center-monument' ? 'center' : scene.align || 'left'}>
      <motion.div initial={{ opacity: 0, y: 26 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.45 }} transition={{ duration: 0.9 }} style={{ position: 'relative' }}>
        {(scene.backgroundWord || parts.trail) ? (
          <div
            style={{
              position: 'absolute',
              inset: 'auto 0 18% 0',
              fontSize: 'clamp(64px, 15vw, 220px)',
              lineHeight: 0.82,
              letterSpacing: '-0.09em',
              fontWeight: 800,
              color: rgba(theme.text, 0.07),
              pointerEvents: 'none',
              transform: scene.layout === 'center-monument' ? 'translateY(0)' : 'translateX(-4%)',
            }}
          >
            {scene.backgroundWord || parts.trail}
          </div>
        ) : null}
        <SceneEyebrow theme={theme}>{scene.eyebrow || 'Cinematic Flow'}</SceneEyebrow>
        <div style={{ position: 'relative', zIndex: 1, fontSize: 'clamp(58px, 11vw, 150px)', lineHeight: 0.88, letterSpacing: '-0.07em', fontWeight: 800, color: theme.text, marginBottom: 24 }}>
          <div>{parts.lead}</div>
          {parts.trail ? <div style={{ color: rgba(theme.text, 0.68) }}>{parts.trail}</div> : null}
        </div>
        {scene.subheadline ? (
          <div style={{ position: 'relative', zIndex: 1, fontSize: 'clamp(18px, 2.2vw, 28px)', lineHeight: 1.5, color: rgba(theme.text, 0.72), maxWidth: 720, margin: scene.layout === 'center-monument' ? '0 auto' : 0 }}>
            {scene.subheadline}
          </div>
        ) : null}
        <div style={{ position: 'relative', zIndex: 1, marginTop: 26, display: 'inline-flex', alignItems: 'center', gap: 10, color: rgba(theme.text, 0.42), fontSize: 11, letterSpacing: '.16em', textTransform: 'uppercase' }}>
          <span>Scroll to explore</span>
          <span style={{ color: theme.accent }}>↓</span>
        </div>
      </motion.div>
    </SceneShell>
  );
}

function WordmarkRevealScene({ scene, theme }) {
  return (
    <SceneShell align="center">
      <motion.div initial={{ opacity: 0, scale: 0.96 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true, amount: 0.4 }} transition={{ duration: 0.9 }} style={{ maxWidth: 980, margin: '0 auto' }}>
        <SceneEyebrow theme={theme}>{scene.eyebrow || 'Wordmark Reveal'}</SceneEyebrow>
        <div style={{ display: 'grid', gap: 18, justifyItems: 'center' }}>
          <div style={{ width: 'min(580px, 72vw)', height: 1, background: `linear-gradient(90deg, transparent, ${rgba(theme.text, 0.2)}, transparent)` }} />
          <div style={{ fontSize: 'clamp(56px, 10vw, 128px)', lineHeight: 0.9, letterSpacing: '-0.06em', fontWeight: 800, color: theme.text }}>
            {scene.wordmark || scene.headline || 'Wordmark'}
          </div>
          <div style={{ width: 'min(580px, 72vw)', height: 1, background: `linear-gradient(90deg, transparent, ${rgba(theme.accent, 0.45)}, transparent)` }} />
        </div>
        {scene.logoUrl ? (
          <div style={{ margin: '28px auto 0', maxWidth: 460 }}>
            <SceneMediaSurface scene={{ ...scene, mediaUrl: scene.logoUrl, mediaFit: 'contain', focalPoint: 'center center' }} theme={theme} height={220} radius={24} overlay={0.12} />
          </div>
        ) : null}
        {scene.descriptor || scene.tagline ? (
          <div style={{ fontSize: 'clamp(16px, 2vw, 24px)', color: rgba(theme.text, 0.68), maxWidth: 720, margin: '26px auto 0' }}>
            {scene.descriptor || scene.tagline}
          </div>
        ) : null}
      </motion.div>
    </SceneShell>
  );
}

function BrandContextScene({ scene, theme }) {
  const bullets = Array.isArray(scene.bullets) ? scene.bullets.filter(Boolean) : [];
  return (
    <SceneShell>
      <motion.div initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.35 }} transition={{ duration: 0.85 }}>
        <SceneEyebrow theme={theme}>{scene.eyebrow || 'Brand Context'}</SceneEyebrow>
        <div style={{ display: 'grid', gridTemplateColumns: scene.mediaUrl ? '1.05fr 0.95fr' : '1.2fr 0.8fr', gap: 36, alignItems: 'start' }}>
          <div>
            <div style={{ width: 64, height: 2, background: `linear-gradient(90deg, ${theme.accent}, transparent)`, marginBottom: 20 }} />
            <h2 style={{ fontSize: 'clamp(40px, 6vw, 84px)', lineHeight: 0.96, letterSpacing: '-0.05em', fontWeight: 800, color: theme.text, margin: 0 }}>
              {scene.headline || 'The opportunity'}
            </h2>
            <p style={{ fontSize: 'clamp(18px, 1.8vw, 24px)', lineHeight: 1.7, color: rgba(theme.text, 0.76), maxWidth: 760, marginTop: 24 }}>
              {scene.body || 'Frame the challenge, category, and emotional territory.'}
            </p>
            {scene.callout ? (
              <div style={{ marginTop: 22, padding: '16px 18px', borderRadius: 18, border: `1px solid ${rgba(theme.accentAlt, 0.2)}`, background: rgba(theme.accent, 0.08), color: rgba(theme.text, 0.8), fontSize: 15, lineHeight: 1.65, maxWidth: 620 }}>
                {scene.callout}
              </div>
            ) : null}
          </div>
          <div style={{ display: 'grid', gap: 14 }}>
            {scene.mediaUrl ? (
              <SceneMediaSurface scene={scene} theme={theme} height={220} radius={22} overlay={0.18} />
            ) : null}
            {bullets.map((bullet, index) => (
              <motion.div
                key={`${bullet}-${index}`}
                initial={{ opacity: 0, x: 16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ delay: index * 0.08, duration: 0.45 }}
                style={{ border: `1px solid ${rgba(theme.text, 0.08)}`, background: rgba(theme.surface, 0.24), borderRadius: 18, padding: '18px 18px 20px' }}
              >
                <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: theme.accent, marginBottom: 8 }}>
                  Point {String(index + 1).padStart(2, '0')}
                </div>
                <div style={{ fontSize: 15, lineHeight: 1.7, color: rgba(theme.text, 0.8) }}>{bullet}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </SceneShell>
  );
}

function LogoEvolutionScene({ scene, theme }) {
  const highlights = Array.isArray(scene.highlights) ? scene.highlights.filter(Boolean) : [];
  return (
    <SceneShell>
      <motion.div initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.35 }} transition={{ duration: 0.85 }}>
        <SceneEyebrow theme={theme}>{scene.eyebrow || 'Identity Evolution'}</SceneEyebrow>
        <div style={{ fontSize: 'clamp(38px, 5vw, 72px)', lineHeight: 0.98, letterSpacing: '-0.05em', fontWeight: 800, color: theme.text, marginBottom: 28 }}>
          {scene.headline || 'From what was there to what is ready.'}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: scene.mediaUrl ? '0.85fr auto 0.85fr 0.9fr' : '1fr auto 1fr', gap: 28, alignItems: 'center' }}>
          <div style={{ padding: '28px 24px', borderRadius: 24, border: `1px solid ${rgba(theme.text, 0.08)}`, background: rgba(theme.surface, 0.14) }}>
            <div style={{ fontSize: 11, letterSpacing: '.18em', textTransform: 'uppercase', color: rgba(theme.text, 0.5), marginBottom: 12 }}>Before</div>
            <div style={{ fontSize: 'clamp(30px, 4vw, 52px)', lineHeight: 1, color: rgba(theme.text, 0.52), fontWeight: 700, letterSpacing: '-0.04em' }}>
              {scene.before || 'Before'}
            </div>
          </div>
          <div style={{ fontSize: 28, color: theme.accent, opacity: 0.85 }}>→</div>
          <div style={{ padding: '28px 24px', borderRadius: 24, border: `1px solid ${rgba(theme.accentAlt, 0.24)}`, background: `linear-gradient(180deg, ${rgba(theme.surface, 0.26)}, ${rgba(theme.accent, 0.12)})`, boxShadow: `0 28px 90px ${rgba(theme.accent, 0.16)}` }}>
            <div style={{ fontSize: 11, letterSpacing: '.18em', textTransform: 'uppercase', color: rgba(theme.text, 0.55), marginBottom: 12 }}>After</div>
            <div style={{ fontSize: 'clamp(30px, 4vw, 52px)', lineHeight: 1, color: theme.text, fontWeight: 800, letterSpacing: '-0.05em' }}>
              {scene.after || 'After'}
            </div>
          </div>
          {scene.mediaUrl ? (
            <SceneMediaSurface scene={scene} theme={theme} height={260} radius={24} overlay={0.14} />
          ) : null}
        </div>
        {scene.rationale ? (
          <p style={{ fontSize: 17, lineHeight: 1.7, color: rgba(theme.text, 0.72), maxWidth: 780, marginTop: 28 }}>
            {scene.rationale}
          </p>
        ) : null}
        {highlights.length ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 22 }}>
            {highlights.map((highlight) => (
              <div key={highlight} style={{ padding: '8px 12px', borderRadius: 999, background: rgba(theme.text, 0.08), color: rgba(theme.text, 0.78), fontSize: 12, letterSpacing: '.08em', textTransform: 'uppercase' }}>
                {highlight}
              </div>
            ))}
          </div>
        ) : null}
      </motion.div>
    </SceneShell>
  );
}

function IconDeconstructionScene({ scene, theme }) {
  const parts = Array.isArray(scene.parts) ? scene.parts.filter(Boolean) : [];
  const references = Array.isArray(scene.referenceAssets) ? scene.referenceAssets.filter(Boolean) : [];
  const iconReference = scene.iconUrl || references.find((reference) => reference.kind === 'image')?.url || scene.mediaUrl;

  return (
    <SceneShell>
      <motion.div initial={{ opacity: 0, y: 26 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.35 }} transition={{ duration: 0.8 }}>
        <SceneEyebrow theme={theme}>{scene.eyebrow || 'Icon Deconstruction'}</SceneEyebrow>
        <div style={{ display: 'grid', gridTemplateColumns: '0.95fr 1.05fr', gap: 28, alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 'clamp(38px, 5vw, 70px)', lineHeight: 0.96, letterSpacing: '-0.05em', fontWeight: 800, color: theme.text, marginBottom: 18 }}>
              {scene.headline || 'The symbol, unpacked.'}
            </div>
            {scene.notes ? (
              <p style={{ fontSize: 16, lineHeight: 1.7, color: rgba(theme.text, 0.72), maxWidth: 620 }}>
                {scene.notes}
              </p>
            ) : null}
            <div style={{ display: 'grid', gap: 14, marginTop: 24 }}>
              {(parts.length ? parts : [{ label: 'Signal', description: 'Add symbolic parts to explain the icon logic.' }]).map((part, index) => (
                <motion.div
                  key={`${part.label || 'part'}-${index}`}
                  initial={{ opacity: 0, x: 18 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.45 }}
                  transition={{ delay: index * 0.08, duration: 0.45 }}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '72px 1fr',
                    gap: 14,
                    alignItems: 'start',
                    padding: '18px 18px 20px',
                    borderRadius: 22,
                    border: `1px solid ${rgba(theme.text, 0.08)}`,
                    background: `linear-gradient(180deg, ${rgba(theme.surface, 0.22)}, ${rgba(theme.surface, 0.08)})`,
                  }}
                >
                  <div
                    style={{
                      width: 72,
                      height: 72,
                      borderRadius: 18,
                      background: `linear-gradient(160deg, ${rgba(theme.accent, 0.22)}, ${rgba(theme.accentAlt, 0.12)})`,
                      border: `1px solid ${rgba(theme.accentAlt, 0.22)}`,
                      display: 'grid',
                      placeItems: 'center',
                      color: theme.text,
                      fontSize: 24,
                      fontWeight: 800,
                    }}
                  >
                    {part.label || `0${index + 1}`}
                  </div>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: theme.text, marginBottom: 8 }}>{part.label || `Part ${index + 1}`}</div>
                    <div style={{ fontSize: 14, lineHeight: 1.7, color: rgba(theme.text, 0.72) }}>
                      {part.description || part.desc || 'Explain the symbolic meaning carried by this piece of the mark.'}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
          <div>
            {iconReference ? (
              <SceneMediaSurface
                scene={{
                  ...scene,
                  mediaUrl: iconReference,
                  mediaLabel: scene.mediaLabel || 'Primary symbol',
                  mediaFit: scene.mediaFit || 'contain',
                }}
                theme={theme}
                height={460}
                radius={28}
                overlay={0.12}
              />
            ) : (
              <div
                style={{
                  height: 460,
                  borderRadius: 28,
                  border: `1px solid ${rgba(theme.text, 0.08)}`,
                  background: `radial-gradient(circle at center, ${rgba(theme.accent, 0.2)}, ${rgba(theme.surface, 0.06)})`,
                  display: 'grid',
                  placeItems: 'center',
                  color: rgba(theme.text, 0.42),
                  fontSize: 13,
                  letterSpacing: '.14em',
                  textTransform: 'uppercase',
                }}
              >
                Icon surface
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </SceneShell>
  );
}

function LogoSystemScene({ scene, theme }) {
  const variants = Array.isArray(scene.variants) ? scene.variants.filter(Boolean) : [];
  const rules = Array.isArray(scene.rules) ? scene.rules.filter(Boolean) : [];

  return (
    <SceneShell>
      <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.35 }} transition={{ duration: 0.8 }}>
        <SceneEyebrow theme={theme}>{scene.eyebrow || 'Logo System'}</SceneEyebrow>
        <div style={{ fontSize: 'clamp(38px, 5vw, 72px)', lineHeight: 0.96, letterSpacing: '-0.05em', fontWeight: 800, color: theme.text, marginBottom: 22 }}>
          {scene.headline || 'A system built for range and consistency.'}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1.05fr 0.95fr', gap: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
            {(variants.length ? variants : [{ name: 'Primary lockup' }, { name: 'Stacked lockup' }, { name: 'Monochrome mark' }]).map((variant, index) => (
              <motion.div
                key={`${variant.name || 'variant'}-${index}`}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.45 }}
                transition={{ delay: index * 0.06, duration: 0.45 }}
                style={{
                  minHeight: 220,
                  borderRadius: 24,
                  border: `1px solid ${rgba(theme.text, 0.08)}`,
                  background: `linear-gradient(180deg, ${rgba(theme.surface, 0.2)}, ${rgba(theme.surface, 0.08)})`,
                  padding: 20,
                  display: 'grid',
                  alignContent: 'space-between',
                }}
              >
                {variant.src ? (
                  <img src={variant.src} alt={variant.name || `Variant ${index + 1}`} style={{ width: '100%', height: 108, objectFit: 'contain', objectPosition: 'center' }} />
                ) : (
                  <div style={{ height: 108, borderRadius: 18, display: 'grid', placeItems: 'center', background: rgba(theme.text, 0.04), color: rgba(theme.text, 0.5), fontSize: 12, letterSpacing: '.1em', textTransform: 'uppercase' }}>
                    Logo variant
                  </div>
                )}
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: theme.text }}>{variant.name || `Variant ${index + 1}`}</div>
                  {variant.description || variant.usage ? (
                    <div style={{ fontSize: 13, lineHeight: 1.65, color: rgba(theme.text, 0.68), marginTop: 8 }}>
                      {variant.description || variant.usage}
                    </div>
                  ) : null}
                </div>
              </motion.div>
            ))}
          </div>
          <div style={{ display: 'grid', gap: 14 }}>
            {(rules.length ? rules : ['Clear space equal to the icon height.', 'Maintain original proportions at all sizes.', 'Use icon-only marks for compact digital placements.']).map((rule, index) => (
              <motion.div
                key={`${rule}-${index}`}
                initial={{ opacity: 0, x: 14 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.45 }}
                transition={{ delay: index * 0.05, duration: 0.4 }}
                style={{ padding: '18px 18px 20px', borderRadius: 20, border: `1px solid ${rgba(theme.text, 0.08)}`, background: rgba(theme.surface, 0.16) }}
              >
                <div style={{ fontSize: 11, letterSpacing: '.14em', textTransform: 'uppercase', color: theme.accent, marginBottom: 8 }}>
                  Rule {String(index + 1).padStart(2, '0')}
                </div>
                <div style={{ fontSize: 14, lineHeight: 1.7, color: rgba(theme.text, 0.74) }}>{rule}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </SceneShell>
  );
}

function TypographySystemScene({ scene, theme }) {
  const fonts = Array.isArray(scene.fonts) ? scene.fonts.filter(Boolean) : [];

  return (
    <SceneShell>
      <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.35 }} transition={{ duration: 0.8 }}>
        <SceneEyebrow theme={theme}>{scene.eyebrow || 'Typography System'}</SceneEyebrow>
        <div style={{ fontSize: 'clamp(38px, 5vw, 72px)', lineHeight: 0.96, letterSpacing: '-0.05em', fontWeight: 800, color: theme.text, marginBottom: 18 }}>
          {scene.headline || 'A typographic voice with hierarchy and intent.'}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 18 }}>
          {(fonts.length ? fonts : [{ name: 'Display', typeface: 'Poppins', usage: 'Headlines and key statements' }, { name: 'Body', typeface: 'Inter', usage: 'Body copy and supporting details' }]).map((font, index) => (
            <motion.div
              key={`${font.name || 'font'}-${index}`}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.45 }}
              transition={{ delay: index * 0.06, duration: 0.45 }}
              style={{
                borderRadius: 24,
                border: `1px solid ${rgba(theme.text, 0.08)}`,
                background: `linear-gradient(180deg, ${rgba(theme.surface, 0.2)}, ${rgba(theme.surface, 0.08)})`,
                padding: 22,
              }}
            >
              <div style={{ fontSize: 12, letterSpacing: '.16em', textTransform: 'uppercase', color: theme.accent, marginBottom: 12 }}>
                {font.name || `Font ${index + 1}`}
              </div>
              <div style={{ fontSize: 'clamp(36px, 4vw, 60px)', lineHeight: 0.95, letterSpacing: '-0.05em', color: theme.text, fontWeight: 700, marginBottom: 10 }}>
                {font.typeface || 'Typeface'}
              </div>
              <div style={{ fontSize: 15, lineHeight: 1.7, color: rgba(theme.text, 0.72), marginBottom: 18 }}>
                {font.usage || font.description || 'Use this typeface to shape hierarchy, tone, and reading flow.'}
              </div>
              <div style={{ paddingTop: 14, borderTop: `1px solid ${rgba(theme.text, 0.08)}` }}>
                <div style={{ fontSize: 26, lineHeight: 1.06, letterSpacing: '-0.04em', color: theme.text, fontWeight: 700 }}>Aa Bb Cc</div>
                <div style={{ fontSize: 14, lineHeight: 1.7, color: rgba(theme.text, 0.62), marginTop: 10 }}>
                  The quick brown fox jumps over the lazy dog.
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </SceneShell>
  );
}

function ColorDirectionScene({ scene, theme }) {
  const palette = Array.isArray(scene.palette) ? scene.palette.filter((entry) => entry?.hex) : [];
  return (
    <SceneShell>
      <motion.div initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.35 }} transition={{ duration: 0.85 }}>
        <SceneEyebrow theme={theme}>{scene.eyebrow || 'Color Direction'}</SceneEyebrow>
        <div style={{ display: 'grid', gridTemplateColumns: palette.length >= 4 ? '0.92fr 1.08fr' : '1fr', gap: 28, alignItems: 'start' }}>
          <div>
            <div style={{ fontSize: 'clamp(38px, 5vw, 72px)', lineHeight: 0.98, letterSpacing: '-0.05em', fontWeight: 800, color: theme.text, marginBottom: 18 }}>
              {scene.headline || 'A palette with intention.'}
            </div>
            {scene.summary ? (
              <p style={{ fontSize: 17, lineHeight: 1.7, color: rgba(theme.text, 0.72), maxWidth: 760, marginBottom: 28 }}>
                {scene.summary}
              </p>
            ) : null}
            {palette.length >= 3 ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: 10, marginBottom: 16 }}>
                <div style={{ height: 220, borderRadius: 26, background: palette[0]?.hex || theme.accent, boxShadow: `0 30px 90px ${rgba(palette[0]?.hex || theme.accent, 0.32)}` }} />
                <div style={{ display: 'grid', gap: 10 }}>
                  <div style={{ height: 105, borderRadius: 22, background: palette[1]?.hex || theme.accentAlt }} />
                  <div style={{ height: 105, borderRadius: 22, background: palette[2]?.hex || theme.surface }} />
                </div>
              </div>
            ) : null}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
            {palette.map((entry, index) => (
              <motion.div
                key={`${entry.hex}-${index}`}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.45 }}
                transition={{ delay: index * 0.06, duration: 0.45 }}
                style={{ borderRadius: 22, overflow: 'hidden', border: `1px solid ${rgba(theme.text, 0.08)}`, background: rgba(theme.surface, 0.18) }}
              >
                <div style={{ height: 144, background: entry.hex }} />
                <div style={{ padding: '16px 16px 18px' }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: theme.text }}>{entry.name || entry.hex}</div>
                  <div style={{ fontSize: 12, color: rgba(theme.text, 0.65), marginTop: 4 }}>{entry.hex}</div>
                  {entry.role ? <div style={{ fontSize: 12, color: rgba(theme.text, 0.72), marginTop: 8, lineHeight: 1.6 }}>{entry.role}</div> : null}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </SceneShell>
  );
}

function ApplicationsShowcaseScene({ scene, theme }) {
  const items = Array.isArray(scene.items) ? scene.items.filter(Boolean) : [];
  const references = Array.isArray(scene.referenceAssets) ? scene.referenceAssets.filter(Boolean) : [];
  const fallbackItems = references.slice(0, 4).map((reference, index) => ({
    title: reference.label || `Reference ${index + 1}`,
    description: reference.excerpt || reference.brief?.summary || '',
    kind: reference.kind,
  }));
  const displayItems = items.length ? items : fallbackItems;
  return (
    <SceneShell>
      <motion.div initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.35 }} transition={{ duration: 0.85 }}>
        <SceneEyebrow theme={theme}>{scene.eyebrow || 'Applications'}</SceneEyebrow>
        <div style={{ fontSize: 'clamp(38px, 5vw, 72px)', lineHeight: 0.98, letterSpacing: '-0.05em', fontWeight: 800, color: theme.text, marginBottom: 18 }}>
          {scene.headline || 'How the system appears in the world.'}
        </div>
        {scene.supportingText ? (
          <p style={{ fontSize: 17, lineHeight: 1.7, color: rgba(theme.text, 0.72), maxWidth: 760, marginBottom: 28 }}>
            {scene.supportingText}
          </p>
        ) : null}
        <div style={{ display: 'grid', gridTemplateColumns: scene.mediaUrl ? '1.15fr 0.85fr' : 'repeat(auto-fit, minmax(220px, 1fr))', gap: 18 }}>
          {scene.mediaUrl ? (
            <div>
              <SceneMediaSurface scene={scene} theme={theme} height={420} radius={28} overlay={0.16} />
            </div>
          ) : null}
          <div style={{ display: 'grid', gridTemplateColumns: scene.mediaUrl ? '1fr' : 'repeat(auto-fit, minmax(220px, 1fr))', gap: 18 }}>
          {displayItems.map((item, index) => (
            <motion.div
              key={`${item.title || item.label || index}`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.45 }}
              transition={{ delay: index * 0.08, duration: 0.45 }}
              style={{
                padding: 20,
                borderRadius: 24,
                background: `linear-gradient(180deg, ${rgba(theme.surface, 0.24)}, ${rgba(theme.surface, 0.12)})`,
                border: `1px solid ${rgba(theme.text, 0.08)}`,
                minHeight: 220,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ fontSize: 12, letterSpacing: '.14em', textTransform: 'uppercase', color: theme.accent, marginBottom: 14 }}>
                {item.format || item.kind || `Item ${index + 1}`}
              </div>
              <div style={{ fontSize: 22, lineHeight: 1.12, letterSpacing: '-0.03em', color: theme.text, fontWeight: 700 }}>
                {item.title || item.label || 'Application'}
              </div>
              {item.body || item.desc || item.description ? (
                <div style={{ fontSize: 14, lineHeight: 1.7, color: rgba(theme.text, 0.72), marginTop: 14 }}>
                  {item.body || item.desc || item.description}
                </div>
              ) : null}
            </motion.div>
          ))}
          </div>
        </div>
      </motion.div>
    </SceneShell>
  );
}

function SocialMediaShowcaseScene({ scene, theme }) {
  const items = Array.isArray(scene.items) ? scene.items.filter(Boolean) : [];
  const platforms = Array.isArray(scene.platforms) ? scene.platforms.filter(Boolean) : [];
  const references = Array.isArray(scene.referenceAssets) ? scene.referenceAssets.filter(Boolean) : [];
  const displayItems = items.length
    ? items
    : references.slice(0, 6).map((reference, index) => ({
        title: reference.label || `Post ${index + 1}`,
        description: reference.excerpt || reference.brief?.summary || '',
        mediaUrl: reference.url,
        platform: reference.platform || platforms[index % (platforms.length || 1)] || 'Social',
      }));

  return (
    <SceneShell>
      <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.35 }} transition={{ duration: 0.8 }}>
        <SceneEyebrow theme={theme}>{scene.eyebrow || 'Social Rollout'}</SceneEyebrow>
        <div style={{ fontSize: 'clamp(38px, 5vw, 72px)', lineHeight: 0.96, letterSpacing: '-0.05em', fontWeight: 800, color: theme.text, marginBottom: 16 }}>
          {scene.headline || 'A campaign built for feeds, stories, and motion.'}
        </div>
        {scene.supportingText ? (
          <div style={{ fontSize: 16, lineHeight: 1.7, color: rgba(theme.text, 0.72), maxWidth: 760, marginBottom: 24 }}>
            {scene.supportingText}
          </div>
        ) : null}
        {platforms.length ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 20 }}>
            {platforms.map((platform) => (
              <div key={platform} style={{ padding: '8px 12px', borderRadius: 999, background: rgba(theme.text, 0.08), color: rgba(theme.text, 0.74), fontSize: 12, letterSpacing: '.08em', textTransform: 'uppercase' }}>
                {platform}
              </div>
            ))}
          </div>
        ) : null}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 18 }}>
          {(displayItems.length ? displayItems : [{ title: 'Story frame', description: 'Add social concepts, carousels, or reel directions here.', platform: 'Instagram' }]).map((item, index) => (
            <motion.div
              key={`${item.title || 'social'}-${index}`}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.45 }}
              transition={{ delay: index * 0.06, duration: 0.45 }}
              style={{
                borderRadius: 26,
                border: `1px solid ${rgba(theme.text, 0.08)}`,
                background: `linear-gradient(180deg, ${rgba(theme.surface, 0.22)}, ${rgba(theme.surface, 0.08)})`,
                overflow: 'hidden',
                boxShadow: `0 24px 80px ${rgba(theme.base, 0.2)}`,
              }}
            >
              {item.mediaUrl ? (
                <SceneMediaSurface scene={{ mediaUrl: item.mediaUrl, mediaLabel: item.platform || item.format || 'Social', mediaFit: item.mediaFit || 'cover' }} theme={theme} height={260} radius={0} overlay={0.1} />
              ) : (
                <div style={{ height: 260, background: `linear-gradient(160deg, ${rgba(theme.accent, 0.18)}, ${rgba(theme.accentAlt, 0.06)})`, display: 'grid', placeItems: 'center', color: rgba(theme.text, 0.5), fontSize: 12, letterSpacing: '.1em', textTransform: 'uppercase' }}>
                  Social frame
                </div>
              )}
              <div style={{ padding: 18 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center' }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: theme.text }}>{item.title || `Social concept ${index + 1}`}</div>
                  <div style={{ fontSize: 11, letterSpacing: '.12em', textTransform: 'uppercase', color: theme.accent }}>
                    {item.platform || item.format || 'Social'}
                  </div>
                </div>
                {item.description || item.body || item.desc ? (
                  <div style={{ fontSize: 14, lineHeight: 1.7, color: rgba(theme.text, 0.7), marginTop: 10 }}>
                    {item.description || item.body || item.desc}
                  </div>
                ) : null}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </SceneShell>
  );
}

function CollateralShowcaseScene({ scene, theme }) {
  const items = Array.isArray(scene.items) ? scene.items.filter(Boolean) : [];
  const references = Array.isArray(scene.referenceAssets) ? scene.referenceAssets.filter(Boolean) : [];
  const visualReferences = references.filter((reference) => ['image', 'video'].includes(reference.kind));
  const displayItems = items.length
    ? items
    : visualReferences.slice(0, 3).map((reference, index) => ({
        title: reference.label || `Collateral ${index + 1}`,
        description: reference.excerpt || reference.brief?.summary || '',
        mediaUrl: reference.url,
      }));

  return (
    <SceneShell>
      <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.35 }} transition={{ duration: 0.8 }}>
        <SceneEyebrow theme={theme}>{scene.eyebrow || 'Collateral'}</SceneEyebrow>
        <div style={{ fontSize: 'clamp(38px, 5vw, 72px)', lineHeight: 0.96, letterSpacing: '-0.05em', fontWeight: 800, color: theme.text, marginBottom: 18 }}>
          {scene.headline || 'Branded materials with tactile presence.'}
        </div>
        {scene.body ? (
          <div style={{ fontSize: 17, lineHeight: 1.7, color: rgba(theme.text, 0.72), maxWidth: 760, marginBottom: 24 }}>
            {scene.body}
          </div>
        ) : null}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 18 }}>
          {(displayItems.length ? displayItems : [{ title: 'Business cards', description: 'Show tactile collateral here.' }]).map((item, index) => (
            <motion.div
              key={`${item.title || 'collateral'}-${index}`}
              initial={{ opacity: 0, y: 18, rotateX: 2 }}
              whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
              viewport={{ once: true, amount: 0.45 }}
              transition={{ delay: index * 0.07, duration: 0.45 }}
              style={{
                borderRadius: 28,
                border: `1px solid ${rgba(theme.text, 0.08)}`,
                background: `linear-gradient(180deg, ${rgba(theme.surface, 0.2)}, ${rgba(theme.surface, 0.08)})`,
                boxShadow: `0 24px 80px ${rgba(theme.base, 0.24)}`,
                overflow: 'hidden',
              }}
            >
              {item.mediaUrl ? (
                <SceneMediaSurface scene={{ mediaUrl: item.mediaUrl, mediaLabel: item.label || item.title, mediaFit: item.mediaFit || 'cover' }} theme={theme} height={220} radius={0} overlay={0.1} />
              ) : (
                <div style={{ height: 220, background: `radial-gradient(circle at 20% 20%, ${rgba(theme.accent, 0.2)}, transparent 50%), ${rgba(theme.surface, 0.2)}` }} />
              )}
              <div style={{ padding: 20 }}>
                <div style={{ fontSize: 18, lineHeight: 1.15, letterSpacing: '-0.03em', fontWeight: 700, color: theme.text }}>{item.title || `Collateral ${index + 1}`}</div>
                {item.description || item.desc || item.body ? (
                  <div style={{ fontSize: 14, lineHeight: 1.7, color: rgba(theme.text, 0.7), marginTop: 10 }}>
                    {item.description || item.desc || item.body}
                  </div>
                ) : null}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </SceneShell>
  );
}

function BrandPhilosophyScene({ scene, theme }) {
  const principles = Array.isArray(scene.principles) ? scene.principles.filter(Boolean) : [];
  return (
    <SceneShell align="center">
      <motion.div initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.35 }} transition={{ duration: 0.85 }} style={{ maxWidth: 1080, margin: '0 auto' }}>
        <SceneEyebrow theme={theme}>{scene.eyebrow || 'Brand Philosophy'}</SceneEyebrow>
        <div style={{ fontSize: 'clamp(42px, 6vw, 84px)', lineHeight: 0.94, letterSpacing: '-0.05em', fontWeight: 800, color: theme.text, marginBottom: 24 }}>
          {scene.headline || 'The philosophy behind the system.'}
        </div>
        {scene.supportingText ? (
          <div style={{ fontSize: 'clamp(17px, 1.9vw, 24px)', lineHeight: 1.7, color: rgba(theme.text, 0.72), maxWidth: 760, margin: '0 auto 28px' }}>
            {scene.supportingText}
          </div>
        ) : null}
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.max(1, Math.min(principles.length || 1, 3))}, minmax(0, 1fr))`, gap: 14 }}>
          {(principles.length ? principles : ['Strategic.', 'Modern.', 'Memorable.']).map((principle, index) => (
            <motion.div
              key={`${principle}-${index}`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.45 }}
              transition={{ delay: index * 0.08, duration: 0.45 }}
              style={{ padding: '32px 20px', borderRadius: 24, border: `1px solid ${rgba(theme.text, 0.08)}`, background: `linear-gradient(180deg, ${rgba(theme.surface, 0.22)}, ${rgba(theme.surface, 0.08)})` }}
            >
              <div style={{ fontSize: 'clamp(26px, 3vw, 40px)', lineHeight: 1, letterSpacing: '-0.04em', color: theme.text, fontWeight: 700 }}>
                {principle}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </SceneShell>
  );
}

function BusinessCardsShowcaseScene({ scene, theme }) {
  const items = Array.isArray(scene.items) ? scene.items.filter(Boolean) : [];
  const references = Array.isArray(scene.referenceAssets) ? scene.referenceAssets.filter(Boolean) : [];
  const visualReferences = references.filter((reference) => ['image', 'video'].includes(reference.kind));
  const cardSet = items.length
    ? items.slice(0, 3)
    : visualReferences.slice(0, 3).map((reference, index) => ({
        title: reference.label || `Card ${index + 1}`,
        description: reference.excerpt || reference.brief?.summary || '',
        mediaUrl: reference.url,
      }));

  const fallbackCards = [
    { label: 'Front', angle: -8, dx: -36, dy: 24, accent: rgba(theme.surface, 0.78) },
    { label: 'Back', angle: 0, dx: 0, dy: 0, accent: rgba(theme.accent, 0.22) },
    { label: 'Light', angle: 8, dx: 40, dy: 28, accent: rgba(theme.accentAlt, 0.18) },
  ];

  return (
    <SceneShell>
      <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.35 }} transition={{ duration: 0.8 }}>
        <SceneEyebrow theme={theme}>{scene.eyebrow || 'Business Cards'}</SceneEyebrow>
        <div style={{ display: 'grid', gridTemplateColumns: '0.88fr 1.12fr', gap: 28, alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 'clamp(38px, 5vw, 72px)', lineHeight: 0.96, letterSpacing: '-0.05em', fontWeight: 800, color: theme.text, marginBottom: 18 }}>
              {scene.headline || 'A tactile signature the brand can hold.'}
            </div>
            {scene.body ? (
              <div style={{ fontSize: 16, lineHeight: 1.72, color: rgba(theme.text, 0.72), maxWidth: 620 }}>
                {scene.body}
              </div>
            ) : (
              <div style={{ fontSize: 16, lineHeight: 1.72, color: rgba(theme.text, 0.72), maxWidth: 620 }}>
                Business cards should feel like the brand in miniature: material, contrast, hierarchy, and signature details all compressed into one tactile moment.
              </div>
            )}
            <div style={{ display: 'grid', gap: 12, marginTop: 24 }}>
              {(cardSet.length ? cardSet : fallbackCards).map((item, index) => (
                <div
                  key={`${item.title || item.label || 'detail'}-${index}`}
                  style={{ padding: '14px 16px', borderRadius: 18, border: `1px solid ${rgba(theme.text, 0.08)}`, background: rgba(theme.surface, 0.16) }}
                >
                  <div style={{ fontSize: 12, letterSpacing: '.14em', textTransform: 'uppercase', color: theme.accent, marginBottom: 6 }}>
                    {item.title || item.label || `Card ${index + 1}`}
                  </div>
                  <div style={{ fontSize: 14, lineHeight: 1.65, color: rgba(theme.text, 0.72) }}>
                    {item.description || item.body || item.desc || 'Use this card surface to show a distinct face of the brand system.'}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ position: 'relative', minHeight: 420, display: 'grid', placeItems: 'center' }}>
            {(cardSet.length ? cardSet : fallbackCards).map((item, index) => {
              const fallback = fallbackCards[index] || fallbackCards[fallbackCards.length - 1];
              const angle = typeof item.angle === 'number' ? item.angle : fallback.angle;
              const dx = typeof item.dx === 'number' ? item.dx : fallback.dx;
              const dy = typeof item.dy === 'number' ? item.dy : fallback.dy;
              return (
                <motion.div
                  key={`${item.title || item.label || 'card'}-${index}`}
                  initial={{ opacity: 0, y: 28 + index * 10, rotate: angle - 2 }}
                  whileInView={{ opacity: 1, y: dy, rotate: angle }}
                  viewport={{ once: true, amount: 0.45 }}
                  transition={{ delay: index * 0.08, duration: 0.5 }}
                  style={{
                    position: 'absolute',
                    width: 'min(300px, 72vw)',
                    aspectRatio: '1.75 / 1',
                    borderRadius: 22,
                    overflow: 'hidden',
                    transform: `translate(${dx}px, ${dy}px) rotate(${angle}deg)`,
                    border: `1px solid ${rgba(theme.text, 0.08)}`,
                    boxShadow: `0 28px 80px ${rgba(theme.base, 0.28)}`,
                    background: `linear-gradient(160deg, ${item.accent || fallback.accent}, ${rgba(theme.base, 0.9)})`,
                    display: 'grid',
                  }}
                >
                  {item.mediaUrl ? (
                    <SceneMediaSurface scene={{ mediaUrl: item.mediaUrl, mediaLabel: item.title || item.label, mediaFit: item.mediaFit || 'cover' }} theme={theme} height={999} radius={0} overlay={0.08} />
                  ) : (
                    <div style={{ padding: 24, display: 'grid', alignContent: 'space-between' }}>
                      <div style={{ fontSize: 11, letterSpacing: '.18em', textTransform: 'uppercase', color: rgba(theme.text, 0.5) }}>
                        {item.title || item.label || `Card ${index + 1}`}
                      </div>
                      <div style={{ fontSize: 'clamp(26px, 3vw, 40px)', lineHeight: 0.92, letterSpacing: '-0.05em', color: theme.text, fontWeight: 800 }}>
                        {scene.brandName || scene.wordmark || 'Brand Mark'}
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </motion.div>
    </SceneShell>
  );
}

function QuoteScene({ scene, theme }) {
  return (
    <SceneShell align="center">
      <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.35 }} transition={{ duration: 0.8 }} style={{ maxWidth: 920, margin: '0 auto' }}>
        <SceneEyebrow theme={theme}>{scene.eyebrow || 'Key Statement'}</SceneEyebrow>
        <div style={{ fontSize: 'clamp(56px, 10vw, 132px)', lineHeight: 0.8, color: rgba(theme.accent, 0.3), marginBottom: 10 }}>“</div>
        <div style={{ fontSize: 'clamp(34px, 4.8vw, 72px)', lineHeight: 1.04, letterSpacing: '-0.05em', color: theme.text, fontWeight: 700 }}>
          {scene.body || scene.headline || getReferenceText(scene) || 'A statement worth giving the room to absorb.'}
        </div>
        {scene.attribution ? (
          <div style={{ marginTop: 22, fontSize: 12, color: rgba(theme.text, 0.5), letterSpacing: '.16em', textTransform: 'uppercase' }}>
            {scene.attribution}
          </div>
        ) : null}
      </motion.div>
    </SceneShell>
  );
}

function StatsScene({ scene, theme }) {
  const items = Array.isArray(scene.items) ? scene.items.filter(Boolean) : [];
  return (
    <SceneShell>
      <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.35 }} transition={{ duration: 0.8 }}>
        <SceneEyebrow theme={theme}>{scene.eyebrow || 'Proof'}</SceneEyebrow>
        <div style={{ fontSize: 'clamp(38px, 5vw, 70px)', lineHeight: 0.98, letterSpacing: '-0.05em', fontWeight: 800, color: theme.text, marginBottom: 18 }}>
          {scene.headline || 'Proof points worth foregrounding.'}
        </div>
        {scene.supportingText ? (
          <div style={{ fontSize: 17, lineHeight: 1.7, color: rgba(theme.text, 0.72), maxWidth: 760, marginBottom: 28 }}>
            {scene.supportingText}
          </div>
        ) : null}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 18 }}>
          {(items.length ? items : [{ title: 'Stat', description: 'Key proof point' }]).map((item, index) => (
            <motion.div
              key={`${item.title || item.label || index}`}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.45 }}
              transition={{ delay: index * 0.06, duration: 0.45 }}
              style={{ padding: '22px 20px', borderRadius: 24, background: rgba(theme.surface, 0.18), border: `1px solid ${rgba(theme.text, 0.08)}` }}
            >
              <div style={{ fontSize: 'clamp(30px, 3vw, 44px)', lineHeight: 0.96, letterSpacing: '-0.04em', fontWeight: 800, color: theme.text }}>
                {item.value || item.title || item.label || 'Stat'}
              </div>
              <div style={{ fontSize: 14, lineHeight: 1.6, color: rgba(theme.text, 0.68), marginTop: 10 }}>
                {item.description || item.desc || item.body || item.label || ''}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </SceneShell>
  );
}

function GalleryScene({ scene, theme }) {
  const references = Array.isArray(scene.referenceAssets) ? scene.referenceAssets.filter(Boolean) : [];
  const imageReferences = references.filter((reference) => reference.kind === 'image' && reference.url);
  const leadMediaUrl = scene.mediaUrl || imageReferences[0]?.url || '';
  const secondaryReferences = imageReferences.slice(leadMediaUrl ? 1 : 0, leadMediaUrl ? 3 : 2);
  return (
    <SceneShell>
      <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.35 }} transition={{ duration: 0.8 }}>
        <SceneEyebrow theme={theme}>{scene.eyebrow || 'Gallery'}</SceneEyebrow>
        <div style={{ fontSize: 'clamp(38px, 5vw, 70px)', lineHeight: 0.98, letterSpacing: '-0.05em', fontWeight: 800, color: theme.text, marginBottom: 18 }}>
          {scene.headline || 'Selected visual references.'}
        </div>
        {scene.body ? (
          <div style={{ fontSize: 17, lineHeight: 1.7, color: rgba(theme.text, 0.72), maxWidth: 760, marginBottom: 28 }}>
            {scene.body}
          </div>
        ) : null}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 14 }}>
          {leadMediaUrl ? (
            <SceneMediaSurface scene={{ ...scene, mediaUrl: leadMediaUrl, mediaLabel: scene.mediaLabel || imageReferences[0]?.label }} theme={theme} height={360} radius={28} overlay={0.14} />
          ) : (
            <div style={{ height: 360, borderRadius: 28, border: `1px solid ${rgba(theme.text, 0.08)}`, background: rgba(theme.surface, 0.16), display: 'flex', alignItems: 'center', justifyContent: 'center', color: rgba(theme.text, 0.42), fontSize: 13, letterSpacing: '.12em', textTransform: 'uppercase' }}>
              Add gallery media
            </div>
          )}
          <div style={{ display: 'grid', gap: 14 }}>
            {secondaryReferences.map((reference, index) => (
              <SceneMediaSurface key={`${reference.id || reference.url}-${index}`} scene={{ mediaUrl: reference.url, mediaLabel: reference.label, mediaFit: 'cover', focalPoint: 'center center' }} theme={theme} height={173} radius={22} overlay={0.14} />
            ))}
          </div>
        </div>
      </motion.div>
    </SceneShell>
  );
}

function FullBleedMediaScene({ scene, theme }) {
  return (
    <SceneShell align="center">
      <motion.div initial={{ opacity: 0, scale: 0.98 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true, amount: 0.35 }} transition={{ duration: 0.85 }} style={{ width: '100%' }}>
        {scene.headline ? <SceneEyebrow theme={theme}>{scene.headline}</SceneEyebrow> : null}
        <SceneMediaSurface scene={scene} theme={theme} height={560} radius={32} overlay={0.08} />
        {scene.caption ? (
          <div style={{ marginTop: 14, fontSize: 13, color: rgba(theme.text, 0.56), letterSpacing: '.12em', textTransform: 'uppercase' }}>
            {scene.caption}
          </div>
        ) : null}
      </motion.div>
    </SceneShell>
  );
}

function EmbedScene({ scene, theme }) {
  return (
    <SceneShell>
      <motion.div initial={{ opacity: 0, y: 22 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.35 }} transition={{ duration: 0.8 }}>
        <SceneEyebrow theme={theme}>{scene.eyebrow || 'Live Prototype'}</SceneEyebrow>
        <div style={{ fontSize: 'clamp(38px, 5vw, 72px)', lineHeight: 0.96, letterSpacing: '-0.05em', fontWeight: 800, color: theme.text, marginBottom: 16 }}>
          {scene.headline || 'An embedded reference inside the story.'}
        </div>
        {scene.body ? (
          <div style={{ fontSize: 16, lineHeight: 1.7, color: rgba(theme.text, 0.72), maxWidth: 760, marginBottom: 24 }}>
            {scene.body}
          </div>
        ) : null}
        <SceneMediaSurface
          scene={{ ...scene, mediaUrl: scene.embedUrl || scene.mediaUrl, mediaLabel: scene.mediaLabel || 'Embedded experience' }}
          theme={theme}
          height={540}
          radius={28}
          overlay={0.08}
        />
      </motion.div>
    </SceneShell>
  );
}

function CtaScene({ scene, theme }) {
  return (
    <SceneShell align="center">
      <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.35 }} transition={{ duration: 0.8 }} style={{ maxWidth: 900, margin: '0 auto' }}>
        <SceneEyebrow theme={theme}>{scene.eyebrow || 'Next Step'}</SceneEyebrow>
        <div style={{ fontSize: 'clamp(40px, 6vw, 88px)', lineHeight: 0.94, letterSpacing: '-0.06em', color: theme.text, fontWeight: 800, marginBottom: 18 }}>
          {scene.headline || 'Ready for the next move.'}
        </div>
        {scene.body ? (
          <div style={{ fontSize: 'clamp(17px, 2vw, 24px)', lineHeight: 1.65, color: rgba(theme.text, 0.72), maxWidth: 720, margin: '0 auto' }}>
            {scene.body}
          </div>
        ) : null}
        <div style={{ marginTop: 28, display: 'inline-flex', alignItems: 'center', gap: 12, padding: '14px 20px', borderRadius: 999, background: rgba(theme.accent, 0.14), border: `1px solid ${rgba(theme.accentAlt, 0.28)}`, color: theme.text, fontSize: 13, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase' }}>
          <span>{scene.cta?.label || 'Approve direction'}</span>
          <span style={{ color: theme.accentAlt }}>→</span>
        </div>
      </motion.div>
    </SceneShell>
  );
}

function ClosingStatementScene({ scene, theme }) {
  return (
    <SceneShell align="center">
      <motion.div initial={{ opacity: 0, y: 26 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.4 }} transition={{ duration: 0.9 }} style={{ position: 'relative', maxWidth: 980, margin: '0 auto' }}>
        <div style={{ position: 'absolute', inset: 'auto 0 18% 0', fontSize: 'clamp(72px, 15vw, 220px)', lineHeight: 0.82, letterSpacing: '-0.09em', fontWeight: 800, color: rgba(theme.text, 0.06), pointerEvents: 'none' }}>
          {scene.backgroundWord || 'Ready'}
        </div>
        <SceneEyebrow theme={theme}>{scene.eyebrow || 'Closing'}</SceneEyebrow>
        <div style={{ position: 'relative', zIndex: 1, fontSize: 'clamp(48px, 9vw, 120px)', lineHeight: 0.92, letterSpacing: '-0.06em', fontWeight: 800, color: theme.text, marginBottom: 20 }}>
          {scene.headline || 'The system is ready.'}
        </div>
        {scene.body ? (
          <div style={{ position: 'relative', zIndex: 1, fontSize: 'clamp(16px, 2vw, 24px)', lineHeight: 1.6, color: rgba(theme.text, 0.7), maxWidth: 740, margin: '0 auto' }}>
            {scene.body}
          </div>
        ) : null}
        {scene.cta?.label || scene.footerNote ? (
          <div style={{ position: 'relative', zIndex: 1, marginTop: 28, display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
            {scene.cta?.label ? (
              <div style={{ padding: '12px 18px', borderRadius: 999, background: rgba(theme.accent, 0.18), border: `1px solid ${rgba(theme.accentAlt, 0.28)}`, color: theme.text, fontSize: 13, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase' }}>
                {scene.cta.label}
              </div>
            ) : null}
            {scene.footerNote ? <div style={{ fontSize: 12, color: rgba(theme.text, 0.52) }}>{scene.footerNote}</div> : null}
          </div>
        ) : null}
      </motion.div>
    </SceneShell>
  );
}

function GenericScene({ scene, theme, index }) {
  const definition = getSceneDefinition(scene.type);
  return (
    <SceneShell>
      <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.35 }} transition={{ duration: 0.7 }}>
        <SceneEyebrow theme={theme}>{definition?.label || `Scene ${index + 1}`}</SceneEyebrow>
        <div style={{ fontSize: 'clamp(34px, 4vw, 60px)', lineHeight: 1, letterSpacing: '-0.04em', fontWeight: 800, color: theme.text, marginBottom: 16 }}>
          {scene.headline || definition?.purpose || 'Scene'}
        </div>
        <div style={{ fontSize: 16, lineHeight: 1.7, color: rgba(theme.text, 0.72), maxWidth: 760 }}>
          {scene.body || scene.subheadline || definition?.fallback || 'This scene type is scaffolded and ready for a dedicated renderer.'}
        </div>
      </motion.div>
    </SceneShell>
  );
}

const SCENE_COMPONENTS = {
  'opening-title': OpeningTitleScene,
  'wordmark-reveal': WordmarkRevealScene,
  'brand-context': BrandContextScene,
  'brand-philosophy': BrandPhilosophyScene,
  'logo-evolution': LogoEvolutionScene,
  'icon-deconstruction': IconDeconstructionScene,
  'logo-system': LogoSystemScene,
  'typography-system': TypographySystemScene,
  'color-direction': ColorDirectionScene,
  'applications-showcase': ApplicationsShowcaseScene,
  'social-media-showcase': SocialMediaShowcaseScene,
  'collateral-showcase': CollateralShowcaseScene,
  'business-cards-showcase': BusinessCardsShowcaseScene,
  'quote-scene': QuoteScene,
  'stats-scene': StatsScene,
  'full-bleed-media': FullBleedMediaScene,
  'gallery-scene': GalleryScene,
  'embed-scene': EmbedScene,
  'cta-scene': CtaScene,
  'closing-statement': ClosingStatementScene,
};

export default function CinematicFlowRenderer({ portalId, cinematicFlow }) {
  void portalId;

  const flow = useMemo(() => mergeFlow(cinematicFlow), [cinematicFlow]);
  const containerRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    const handleScroll = () => {
      const sectionHeight = container.clientHeight || 1;
      const nextIndex = Math.round(container.scrollTop / sectionHeight);
      setCurrentIndex(Math.max(0, Math.min(nextIndex, flow.scenes.length - 1)));
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [flow.scenes.length]);

  useEffect(() => {
    if (!flow.shell.keyboardNav) return undefined;

    const handleKeyDown = (event) => {
      if (!['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', ' '].includes(event.key)) return;
      event.preventDefault();
      const delta = event.key === 'ArrowUp' || event.key === 'PageUp' ? -1 : 1;
      const nextIndex = Math.max(0, Math.min(currentIndex + delta, flow.scenes.length - 1));
      const container = containerRef.current;
      if (!container) return;
      container.scrollTo({ top: nextIndex * container.clientHeight, behavior: 'smooth' });
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, flow.scenes.length, flow.shell.keyboardNav]);

  const navigateTo = (index) => {
    const container = containerRef.current;
    if (!container) return;
    container.scrollTo({ top: index * container.clientHeight, behavior: 'smooth' });
  };

  return (
    <div style={{ position: 'relative', minHeight: '100vh', background: flow.theme.base, color: flow.theme.text }}>
      <AtmosphereLayer theme={flow.theme} atmosphere={flow.atmosphere} />
      <GrainOverlay enabled={flow.shell.grainOverlay} />
      {flow.shell.progressBar ? <ProgressRail currentIndex={currentIndex} total={flow.scenes.length} theme={flow.theme} /> : null}
      {flow.shell.sectionIndicator ? (
        <SectionDots scenes={flow.scenes} currentIndex={currentIndex} theme={flow.theme} onNavigate={navigateTo} />
      ) : null}

      <div
        ref={containerRef}
        style={{
          position: 'relative',
          zIndex: 3,
          height: '100vh',
          overflowY: 'auto',
          scrollSnapType: flow.shell.scrollBehavior === 'snap' ? 'y mandatory' : 'none',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {flow.scenes.map((scene, index) => {
          const SceneComponent = SCENE_COMPONENTS[scene.type] || GenericScene;
          return (
            <section
              key={scene.id || `${scene.type}-${index}`}
              style={{
                position: 'relative',
                minHeight: '100vh',
                scrollSnapAlign: flow.shell.scrollBehavior === 'snap' ? 'start' : 'none',
              }}
            >
              <SceneComponent scene={scene} index={index} theme={flow.theme} flow={flow} />
            </section>
          );
        })}
      </div>
    </div>
  );
}
