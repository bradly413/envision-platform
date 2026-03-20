import { motion } from 'framer-motion';

export default function HeroSection({ clientName, company, content = {} }) {
  return (
    <section data-section="hero" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '80px 32px', position: 'relative', overflow: 'hidden' }}>
      {/* Subtle background texture */}
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, #1A1A2E 0%, #0F0F0F 70%)', opacity: 0.8 }} />

      <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.2, ease: 'easeOut' }} style={{ position: 'relative', maxWidth: 640 }}>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4, duration: 0.8 }}
          style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.25em', textTransform: 'uppercase', color: '#6B7280', marginBottom: 24 }}>
          Bradley Robert Creative · Brand Reveal
        </motion.div>

        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7, duration: 0.9 }}
          style={{ fontSize: 'clamp(40px, 8vw, 80px)', fontWeight: 800, color: '#F9FAFB', lineHeight: 1.1, margin: '0 0 24px' }}>
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
