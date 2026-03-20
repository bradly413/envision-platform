import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

export default function BrandSection({ content = {} }) {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.2 });

  return (
    <section ref={ref} data-section="brand-strategy" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', padding: '120px 32px', maxWidth: 960, margin: '0 auto' }}>
      <motion.div initial={{ opacity: 0, y: 60 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.9 }} style={{ width: '100%' }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.2em', textTransform: 'uppercase', color: '#6B7280', marginBottom: 20 }}>01 — Brand strategy</div>
        <h2 style={{ fontSize: 'clamp(28px, 5vw, 52px)', fontWeight: 800, color: '#F9FAFB', lineHeight: 1.15, margin: '0 0 32px' }}>
          {content.headline || 'The story behind the brand.'}
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48 }}>
          <div>
            <p style={{ fontSize: 17, color: '#9CA3AF', lineHeight: 1.8, margin: 0 }}>
              {content.positioning || 'Your brand positioning statement goes here. This should describe what makes this brand distinct and the emotional territory it owns.'}
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {(content.pillars || [{ title: 'Pillar 1', desc: 'Description' }, { title: 'Pillar 2', desc: 'Description' }, { title: 'Pillar 3', desc: 'Description' }]).map((p, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: 30 }} animate={inView ? { opacity: 1, x: 0 } : {}} transition={{ delay: 0.2 + i * 0.15, duration: 0.7 }}
                style={{ borderLeft: '2px solid #374151', paddingLeft: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#F9FAFB', marginBottom: 4 }}>{p.title}</div>
                <div style={{ fontSize: 13, color: '#6B7280' }}>{p.desc}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </section>
  );
}
