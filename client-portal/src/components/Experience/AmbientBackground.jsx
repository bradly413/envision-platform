import { motion } from 'framer-motion';

export default function AmbientBackground({ experience }) {
  const bg = experience?.background || {};

  return (
    <div aria-hidden="true" style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
      <div style={{ position: 'absolute', inset: 0, background: bg.base || '#0F0F0F' }} />

      <motion.div
        animate={{ x: ['-8%', '6%', '-6%'], y: ['-6%', '3%', '-2%'], scale: [1, 1.08, 0.96] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          position: 'absolute',
          top: '-10%',
          left: '-10%',
          width: '60vw',
          height: '60vw',
          borderRadius: '50%',
          background: `radial-gradient(circle, ${bg.gradientA || 'rgba(127,29,29,0.24)'} 0%, transparent 68%)`,
          filter: 'blur(40px)',
          opacity: 0.95,
        }}
      />

      <motion.div
        animate={{ x: ['8%', '-5%', '4%'], y: ['6%', '-4%', '2%'], scale: [0.92, 1.05, 1] }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          position: 'absolute',
          right: '-12%',
          top: '8%',
          width: '52vw',
          height: '52vw',
          borderRadius: '50%',
          background: `radial-gradient(circle, ${bg.gradientB || 'rgba(30,58,138,0.22)'} 0%, transparent 72%)`,
          filter: 'blur(44px)',
          opacity: 0.9,
        }}
      />

      <motion.div
        animate={{ x: ['0%', '10%', '-4%'], y: ['0%', '-6%', '8%'], scale: [0.9, 1.04, 0.98] }}
        transition={{ duration: 26, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          position: 'absolute',
          left: '18%',
          bottom: '-18%',
          width: '48vw',
          height: '48vw',
          borderRadius: '50%',
          background: `radial-gradient(circle, ${bg.gradientC || 'rgba(146,64,14,0.16)'} 0%, transparent 72%)`,
          filter: 'blur(48px)',
          opacity: 0.8,
        }}
      />
    </div>
  );
}
