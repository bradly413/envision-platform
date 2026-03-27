import { motion } from 'framer-motion';

function DefaultHero({ cinematic, glassPanel, zoomEffect, content, clientName, experience }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40, scale: zoomEffect ? 0.96 : 1 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 1.2, ease: 'easeOut' }}
      style={{
        position: 'relative',
        maxWidth: 760,
        padding: glassPanel ? '32px 28px' : 0,
        borderRadius: glassPanel ? 28 : 0,
        border: glassPanel ? '1px solid rgba(255,255,255,0.08)' : 'none',
        background: glassPanel ? 'linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.015))' : 'transparent',
        backdropFilter: glassPanel ? 'blur(18px)' : 'none',
        boxShadow: glassPanel ? '0 24px 80px rgba(0,0,0,0.24)' : 'none',
      }}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4, duration: 0.8 }}
        style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.25em', textTransform: 'uppercase', color: '#6B7280', marginBottom: 24 }}>
        Envision Creative · {experience?.presetLabel || 'Brand Reveal'}
      </motion.div>

      <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7, duration: 0.9 }}
        style={{
          fontSize: 'clamp(40px, 8vw, 86px)',
          fontWeight: 800,
          color: '#F9FAFB',
          lineHeight: 1.02,
          margin: '0 0 24px',
          letterSpacing: cinematic ? '-0.04em' : '-0.02em',
          textShadow: cinematic ? '0 10px 40px rgba(0,0,0,0.28)' : 'none',
        }}>
        {content.headline || `${clientName},`}<br />
        <span style={{ color: '#9CA3AF' }}>{content.subheadline || 'meet your new brand.'}</span>
      </motion.h1>

      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.1, duration: 0.8 }}
        style={{ fontSize: 18, color: '#6B7280', lineHeight: 1.7, maxWidth: 480, margin: '0 auto 48px' }}>
        {content.intro || 'Everything you see here was crafted specifically for you. Scroll to experience your full brand identity.'}
      </motion.p>
    </motion.div>
  );
}

function MinimalHero({ content, clientName, company, experience }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1.0, ease: 'easeOut' }}
      style={{ position: 'relative', width: 'min(1080px, 100%)', textAlign: 'left' }}
    >
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.22em', textTransform: 'uppercase', color: '#6B7280', marginBottom: 24 }}>
        Envision Creative · {experience?.presetLabel || 'Brand Reveal'}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 36, alignItems: 'end' }}>
        <div>
          <div style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 14 }}>{company || 'Brand Reveal'}</div>
          <h1 style={{ fontSize: 'clamp(34px, 7vw, 78px)', fontWeight: 800, color: '#F9FAFB', lineHeight: 0.98, margin: 0, letterSpacing: '-0.04em' }}>
            {content.headline || clientName || 'A quieter kind of authority.'}
          </h1>
        </div>
        <div style={{ borderLeft: '1px solid rgba(255,255,255,0.12)', paddingLeft: 24 }}>
          <div style={{ fontSize: 12, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '.12em', marginBottom: 12 }}>Direction</div>
          <div style={{ fontSize: 'clamp(22px, 3.6vw, 40px)', fontWeight: 700, color: '#D1D5DB', lineHeight: 1.08, marginBottom: 16 }}>
            {content.subheadline || 'Refined. Focused. Memorable.'}
          </div>
          <p style={{ fontSize: 15, color: '#9CA3AF', lineHeight: 1.8, margin: 0 }}>
            {content.intro || 'A disciplined identity system with less noise, more conviction, and a stronger point of view.'}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

function IdentityHero({ content, clientName, company, experience }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1.0, ease: 'easeOut' }}
      style={{ position: 'relative', width: 'min(1120px, 100%)', textAlign: 'left' }}
    >
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.22em', textTransform: 'uppercase', color: '#6B7280', marginBottom: 20 }}>
        Envision Creative · {experience?.presetLabel || 'Full Identity'}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 32, alignItems: 'start' }}>
        <div>
          <div style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 10 }}>{company || 'Identity System'}</div>
          <h1 style={{ fontSize: 'clamp(38px, 8vw, 88px)', fontWeight: 800, color: '#F9FAFB', lineHeight: 0.95, margin: '0 0 18px', letterSpacing: '-0.05em' }}>
            {content.headline || clientName || 'A complete identity.'}
          </h1>
          <div style={{ fontSize: 'clamp(24px, 4vw, 46px)', fontWeight: 700, color: '#A5B4FC', lineHeight: 1.02, marginBottom: 20 }}>
            {content.subheadline || 'Built to scale across every touchpoint.'}
          </div>
          <p style={{ fontSize: 16, color: '#9CA3AF', lineHeight: 1.8, maxWidth: 720, margin: 0 }}>
            {content.intro || 'This presentation moves beyond a single reveal and into the full working system: rationale, mark, palette, type, and application logic.'}
          </p>
        </div>
        <div style={{ display: 'grid', gap: 12 }}>
          {[
            { label: 'Scope', value: 'Strategy' },
            { label: 'System', value: 'Logo / Color / Type' },
            { label: 'Outcome', value: 'Identity built for rollout' },
          ].map((item) => (
            <div key={item.label} style={{ padding: '16px 18px', borderRadius: 18, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)' }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: '#6B7280', marginBottom: 8 }}>{item.label}</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#F9FAFB', lineHeight: 1.2 }}>{item.value}</div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

export default function HeroSection({ clientName, company, content = {}, experience = {}, variant = 'default' }) {
  const cinematic = experience?.heroEffects?.includes('shader-background');
  const glassPanel = experience?.heroEffects?.includes('glass-panel');
  const zoomEffect = experience?.heroEffects?.includes('slow-zoom') || experience?.heroEffects?.includes('camera-zoom');

  return (
    <section data-section="hero" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '80px 32px', position: 'relative', overflow: 'hidden' }}>
      {/* Subtle background texture */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: cinematic
          ? 'radial-gradient(ellipse at center, rgba(28,25,52,0.92) 0%, rgba(8,8,14,0.94) 70%)'
          : 'radial-gradient(ellipse at center, #1A1A2E 0%, #0F0F0F 70%)',
        opacity: 0.8,
      }} />

      {variant === 'minimal' ? (
        <MinimalHero content={content} clientName={clientName} company={company} experience={experience} />
      ) : variant === 'identity' ? (
        <IdentityHero content={content} clientName={clientName} company={company} experience={experience} />
      ) : (
        <DefaultHero
          cinematic={cinematic}
          glassPanel={glassPanel}
          zoomEffect={zoomEffect}
          content={content}
          clientName={clientName}
          experience={experience}
        />
      )}

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5, duration: 0.6 }}
        style={{ position: 'absolute', left: '50%', bottom: 56, transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, color: '#374151' }}>
        <span style={{ fontSize: 12, letterSpacing: '.1em', textTransform: 'uppercase' }}>Scroll to explore</span>
        <motion.div animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}>↓</motion.div>
      </motion.div>
    </section>
  );
}
