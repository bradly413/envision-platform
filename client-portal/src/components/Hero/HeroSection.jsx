import { motion } from 'framer-motion';

export default function HeroSection({ clientName, company, content = {}, experience = {} }) {
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

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5, duration: 0.6 }}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, color: '#374151' }}>
          <span style={{ fontSize: 12, letterSpacing: '.1em', textTransform: 'uppercase' }}>Scroll to explore</span>
          <motion.div animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}>↓</motion.div>
        </motion.div>
      </motion.div>
    </section>
  );
}
