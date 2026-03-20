import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

export default function TypographySection({ content = {} }) {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.2 });

  return (
    <section ref={ref} data-section="typography" style={{ padding: '120px 32px', background: '#111' }}>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.2em', textTransform: 'uppercase', color: '#6B7280', marginBottom: 20 }}>04 — Typography</div>
        <h2 style={{ fontSize: 'clamp(28px, 5vw, 52px)', fontWeight: 800, color: '#F9FAFB', margin: '0 0 48px' }}>
          {content.headline || 'The voice, set in type.'}
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48 }}>
          {(content.fonts || [{ name: 'Display', typeface: 'Your heading font', usage: 'Headlines, hero text' }, { name: 'Body', typeface: 'Your body font', usage: 'Paragraphs, UI elements' }]).map((font, i) => (
            <motion.div key={font.name} initial={{ opacity: 0, x: i === 0 ? -30 : 30 }} animate={inView ? { opacity: 1, x: 0 } : {}} transition={{ delay: 0.2, duration: 0.8 }}>
              <div style={{ fontSize: 11, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 12 }}>{font.name}</div>
              <div style={{ fontSize: 'clamp(32px, 5vw, 56px)', fontWeight: 800, color: '#F9FAFB', lineHeight: 1.1, marginBottom: 16, fontFamily: font.stack || 'inherit' }}>
                {font.typeface}
              </div>
              <div style={{ fontSize: 13, color: '#6B7280' }}>{font.usage}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
