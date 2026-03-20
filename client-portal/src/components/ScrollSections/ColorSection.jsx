import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

const DEFAULT_COLORS = [
  { name: 'Primary', hex: '#1A1A2E', role: 'Brand authority' },
  { name: 'Secondary', hex: '#E8D5B7', role: 'Warmth & approachability' },
  { name: 'Accent', hex: '#C9A84C', role: 'Energy & precision' },
  { name: 'Neutral', hex: '#F4F4F0', role: 'Space & clarity' },
];

export default function ColorSection({ content = {} }) {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.2 });
  const colors = content.palette || DEFAULT_COLORS;

  return (
    <section ref={ref} data-section="color-palette" style={{ padding: '120px 32px' }}>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.2em', textTransform: 'uppercase', color: '#6B7280', marginBottom: 20 }}>03 — Color palette</div>
        <h2 style={{ fontSize: 'clamp(28px, 5vw, 52px)', fontWeight: 800, color: '#F9FAFB', margin: '0 0 48px' }}>
          {content.headline || 'The palette.'}
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${colors.length}, 1fr)`, gap: 16 }}>
          {colors.map((color, i) => (
            <motion.div key={color.name} initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: i * 0.1, duration: 0.7 }}>
              <div style={{ height: 120, borderRadius: 10, background: color.hex, marginBottom: 14, border: '1px solid rgba(255,255,255,.08)' }} />
              <div style={{ fontSize: 14, fontWeight: 700, color: '#F9FAFB', marginBottom: 2 }}>{color.name}</div>
              <div style={{ fontSize: 12, color: '#6B7280', fontFamily: 'monospace', marginBottom: 4 }}>{color.hex}</div>
              <div style={{ fontSize: 12, color: '#9CA3AF' }}>{color.role}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
