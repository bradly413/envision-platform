import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { track } from '../../lib/api';

export default function LogoSection({ content = {}, portalId }) {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.2 });

  return (
    <section ref={ref} data-section="logo" style={{ padding: '120px 32px', background: '#111' }}>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        <motion.div initial={{ opacity: 0, y: 40 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.9 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.2em', textTransform: 'uppercase', color: '#6B7280', marginBottom: 20 }}>02 — Logo system</div>
          <h2 style={{ fontSize: 'clamp(28px, 5vw, 52px)', fontWeight: 800, color: '#F9FAFB', margin: '0 0 48px' }}>
            {content.headline || 'Your mark.'}
          </h2>
          {/* Logo display area */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2, marginBottom: 48 }}>
            {['Light', 'Dark', 'Icon only'].map((variant, i) => (
              <motion.div key={variant} initial={{ opacity: 0, scale: 0.95 }} animate={inView ? { opacity: 1, scale: 1 } : {}} transition={{ delay: i * 0.1, duration: 0.7 }}
                style={{ aspectRatio: '16/9', background: i === 0 ? '#F9FAFB' : i === 1 ? '#0F0F0F' : '#1F1F1F', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #374151' }}>
                {content.logoUrl ? (
                  <img src={content.logoUrl} alt={variant} style={{ maxWidth: '60%', maxHeight: '60%', filter: i === 0 ? 'none' : 'invert(1)' }} />
                ) : (
                  <div style={{ fontSize: 12, color: i === 0 ? '#374151' : '#6B7280' }}>{variant} logo</div>
                )}
              </motion.div>
            ))}
          </div>
          {content.rationale && <p style={{ fontSize: 16, color: '#6B7280', lineHeight: 1.8, maxWidth: 600 }}>{content.rationale}</p>}
        </motion.div>
      </div>
    </section>
  );
}
