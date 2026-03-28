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

function OpeningTitleScene({ scene, theme }) {
  return (
    <SceneShell align={scene.layout === 'center-monument' ? 'center' : scene.align || 'left'}>
      <motion.div initial={{ opacity: 0, y: 26 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.45 }} transition={{ duration: 0.9 }}>
        <SceneEyebrow theme={theme}>{scene.eyebrow || 'Cinematic Flow'}</SceneEyebrow>
        <div style={{ fontSize: 'clamp(58px, 11vw, 150px)', lineHeight: 0.9, letterSpacing: '-0.07em', fontWeight: 800, color: theme.text, marginBottom: 24 }}>
          {scene.headline || 'Brand Narrative'}
        </div>
        {scene.subheadline ? (
          <div style={{ fontSize: 'clamp(18px, 2.2vw, 28px)', lineHeight: 1.5, color: rgba(theme.text, 0.72), maxWidth: 720, margin: scene.layout === 'center-monument' ? '0 auto' : 0 }}>
            {scene.subheadline}
          </div>
        ) : null}
      </motion.div>
    </SceneShell>
  );
}

function WordmarkRevealScene({ scene, theme }) {
  return (
    <SceneShell align="center">
      <motion.div initial={{ opacity: 0, scale: 0.96 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true, amount: 0.4 }} transition={{ duration: 0.9 }}>
        <SceneEyebrow theme={theme}>{scene.eyebrow || 'Wordmark Reveal'}</SceneEyebrow>
        <div style={{ fontSize: 'clamp(56px, 10vw, 128px)', lineHeight: 0.9, letterSpacing: '-0.06em', fontWeight: 800, color: theme.text, marginBottom: 18 }}>
          {scene.wordmark || scene.headline || 'Wordmark'}
        </div>
        {scene.descriptor || scene.tagline ? (
          <div style={{ fontSize: 'clamp(16px, 2vw, 24px)', color: rgba(theme.text, 0.68), maxWidth: 720, margin: '0 auto' }}>
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
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 36, alignItems: 'start' }}>
          <div>
            <h2 style={{ fontSize: 'clamp(40px, 6vw, 84px)', lineHeight: 0.96, letterSpacing: '-0.05em', fontWeight: 800, color: theme.text, margin: 0 }}>
              {scene.headline || 'The opportunity'}
            </h2>
            <p style={{ fontSize: 'clamp(18px, 1.8vw, 24px)', lineHeight: 1.7, color: rgba(theme.text, 0.76), maxWidth: 760, marginTop: 24 }}>
              {scene.body || 'Frame the challenge, category, and emotional territory.'}
            </p>
          </div>
          <div style={{ display: 'grid', gap: 12 }}>
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
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 28, alignItems: 'center' }}>
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

function ColorDirectionScene({ scene, theme }) {
  const palette = Array.isArray(scene.palette) ? scene.palette.filter((entry) => entry?.hex) : [];
  return (
    <SceneShell>
      <motion.div initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.35 }} transition={{ duration: 0.85 }}>
        <SceneEyebrow theme={theme}>{scene.eyebrow || 'Color Direction'}</SceneEyebrow>
        <div style={{ fontSize: 'clamp(38px, 5vw, 72px)', lineHeight: 0.98, letterSpacing: '-0.05em', fontWeight: 800, color: theme.text, marginBottom: 18 }}>
          {scene.headline || 'A palette with intention.'}
        </div>
        {scene.summary ? (
          <p style={{ fontSize: 17, lineHeight: 1.7, color: rgba(theme.text, 0.72), maxWidth: 760, marginBottom: 28 }}>
            {scene.summary}
          </p>
        ) : null}
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
      </motion.div>
    </SceneShell>
  );
}

function ApplicationsShowcaseScene({ scene, theme }) {
  const items = Array.isArray(scene.items) ? scene.items.filter(Boolean) : [];
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 18 }}>
          {items.map((item, index) => (
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
      </motion.div>
    </SceneShell>
  );
}

function ClosingStatementScene({ scene, theme }) {
  return (
    <SceneShell align="center">
      <motion.div initial={{ opacity: 0, y: 26 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.4 }} transition={{ duration: 0.9 }}>
        <SceneEyebrow theme={theme}>{scene.eyebrow || 'Closing'}</SceneEyebrow>
        <div style={{ fontSize: 'clamp(48px, 9vw, 120px)', lineHeight: 0.92, letterSpacing: '-0.06em', fontWeight: 800, color: theme.text, marginBottom: 20 }}>
          {scene.headline || 'The system is ready.'}
        </div>
        {scene.body ? (
          <div style={{ fontSize: 'clamp(16px, 2vw, 24px)', lineHeight: 1.6, color: rgba(theme.text, 0.7), maxWidth: 740, margin: '0 auto' }}>
            {scene.body}
          </div>
        ) : null}
        {scene.cta?.label || scene.footerNote ? (
          <div style={{ marginTop: 28, display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
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
  'logo-evolution': LogoEvolutionScene,
  'color-direction': ColorDirectionScene,
  'applications-showcase': ApplicationsShowcaseScene,
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
