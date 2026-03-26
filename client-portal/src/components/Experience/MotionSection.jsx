import { motion, useReducedMotion } from 'framer-motion';

function buildStyle(effectName) {
  switch (effectName) {
    case 'glass-panel':
      return {
        background: 'linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 24px 80px rgba(0,0,0,0.24)',
        backdropFilter: 'blur(20px)',
        borderRadius: 28,
      };
    case 'parallax-panels':
      return {
        background: 'linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01))',
      };
    case 'sticky-story':
      return {
        position: 'relative',
      };
    case 'magnetic-cards':
      return {
        background: 'linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.015))',
        borderRadius: 24,
      };
    case 'color-glow':
      return {
        boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.04), 0 0 80px rgba(255,255,255,0.06)',
        borderRadius: 24,
      };
    case 'headline-shift':
      return {
        background: 'linear-gradient(180deg, rgba(255,255,255,0.02), transparent)',
      };
    case 'editorial-rise':
      return {
        background: 'transparent',
      };
    case 'magnetic-cta':
      return {
        background: 'linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))',
        borderRadius: 28,
      };
    default:
      return {};
  }
}

export default function MotionSection({ effectName, index = 0, children }) {
  const reducedMotion = useReducedMotion();
  const style = buildStyle(effectName);

  return (
    <motion.div
      initial={reducedMotion ? false : { opacity: 0, y: 44 }}
      whileInView={reducedMotion ? {} : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.18 }}
      transition={{ duration: 0.85, delay: index * 0.05 }}
      whileHover={reducedMotion || effectName !== 'magnetic-cards' ? undefined : { y: -6, scale: 1.01 }}
      style={{
        position: 'relative',
        zIndex: 1,
        margin: '0 auto',
        ...style,
      }}
    >
      {effectName === 'sticky-story' ? (
        <div style={{ position: 'relative' }}>
          <div style={{ position: 'absolute', inset: '8% 8% auto 8%', height: 1, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent)' }} />
          {children}
        </div>
      ) : (
        children
      )}
    </motion.div>
  );
}
