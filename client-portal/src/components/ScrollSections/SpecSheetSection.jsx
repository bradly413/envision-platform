import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

const adConcepts = [
  { headline: 'FEEL JAZZ. LIVE!', tag: 'Awareness', accent: '#c8a96e' },
  { headline: 'JAZZ. TONIGHT!', tag: 'Event Urgency', accent: '#e05a5a' },
  { headline: 'SEE IT. LIVE IT!', tag: 'Conversion', accent: '#7b8fd4' },
];

const adSizes = [
  { size: '300x250', format: 'Medium Rectangle', use: 'Primary display / retargeting', spec: 'PNG / HTML5 - 150 KB' },
  { size: '728x90', format: 'Leaderboard', use: 'Desktop awareness', spec: 'PNG / HTML5 - 150 KB' },
  { size: '160x600', format: 'Wide Skyscraper', use: 'Sidebar placement', spec: 'PNG / HTML5 - 150 KB' },
  { size: '320x50', format: 'Mobile Banner', use: 'Mobile awareness', spec: 'PNG / HTML5 - 100 KB' },
  { size: '1920x1080', format: 'CTV Full Screen', use: 'Connected TV / OTT :30 spot', spec: 'MP4 (H.264) - 500 MB' },
];

function CampaignHeader() {
  return (
    <section data-section="spec-sheet-header" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', padding: '80px 32px', textAlign: 'center' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 60% 40%, #1a1025 0%, #0F0F0F 70%)' }} />
      <div style={{ position: 'relative', maxWidth: 800, width: '100%' }}>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3, duration: 0.8 }} style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.25em', textTransform: 'uppercase', color: '#6B7280', marginBottom: 32 }}>
          Mix Media + Envision Marketing Consultants - March 2026
        </motion.div>
        <div style={{ perspective: 1000, marginBottom: 24 }}>
          <motion.h1 initial={{ opacity: 0, rotateX: 30, y: 60 }} animate={{ opacity: 1, rotateX: 0, y: 0 }} transition={{ delay: 0.5, duration: 1.1, ease: [0.16, 1, 0.3, 1] }} style={{ fontSize: 'clamp(52px, 9vw, 100px)', fontWeight: 800, color: '#F9FAFB', lineHeight: 1.0, margin: 0, transformOrigin: 'top center' }}>Jazz</motion.h1>
          <motion.h1 initial={{ opacity: 0, rotateX: 30, y: 60 }} animate={{ opacity: 1, rotateX: 0, y: 0 }} transition={{ delay: 0.72, duration: 1.1, ease: [0.16, 1, 0.3, 1] }} style={{ fontSize: 'clamp(52px, 9vw, 100px)', fontWeight: 800, color: '#9CA3AF', lineHeight: 1.0, margin: 0, transformOrigin: 'top center' }}>St. Louis</motion.h1>
        </div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.0, duration: 0.8 }} style={{ fontSize: 'clamp(14px, 1.8vw, 18px)', color: '#c8a96e', fontWeight: 300, letterSpacing: '.1em', marginBottom: 48 }}>
          "Your Night. Live." - Creative Spec Sheet - Campaign Launch May 1, 2026
        </motion.div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.7, duration: 0.6 }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, color: '#374151' }}>
          <span style={{ fontSize: 11, letterSpacing: '.1em', textTransform: 'uppercase' }}>Scroll to explore</span>
          <motion.div animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}>down</motion.div>
        </motion.div>
      </div>
    </section>
  );
}

function VideoSection() {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.2 });
  return (
    <section ref={ref} data-section="spec-video" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', padding: '120px 32px', maxWidth: 960, margin: '0 auto' }}>
      <motion.div initial={{ opacity: 0, y: 60 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.9 }} style={{ width: '100%' }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.2em', textTransform: 'uppercase', color: '#6B7280', marginBottom: 20 }}>01 - Video Production</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'start' }}>
          <div>
            <h2 style={{ fontSize: 'clamp(32px, 5vw, 56px)', fontWeight: 800, color: '#F9FAFB', lineHeight: 1.1, margin: '0 0 16px' }}>:30 Connected TV<br /><span style={{ color: '#9CA3AF' }}>/ OTT and Pre-Roll</span></h2>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#c8a96e', letterSpacing: '.1em', textTransform: 'uppercase', margin: 0 }}>"Your Night. Live." - Jazz St. Louis - 2026</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <motion.div initial={{ opacity: 0, x: 30 }} animate={inView ? { opacity: 1, x: 0 } : {}} transition={{ delay: 0.2, duration: 0.7 }} style={{ borderLeft: '2px solid #374151', paddingLeft: 20 }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.2em', textTransform: 'uppercase', color: '#6B7280', marginBottom: 8 }}>Placement</div>
              <div style={{ fontSize: 14, color: '#9CA3AF', lineHeight: 1.7 }}>Connected TV/OTT - Hulu, Peacock, Philo, local broadcast streaming - and YouTube pre-roll. Non-skippable format recommended for CTV.</div>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 30 }} animate={inView ? { opacity: 1, x: 0 } : {}} transition={{ delay: 0.35, duration: 0.7 }} style={{ borderLeft: '2px solid #374151', paddingLeft: 20 }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.2em', textTransform: 'uppercase', color: '#6B7280', marginBottom: 8 }}>Targeting</div>
              <div style={{ fontSize: 14, color: '#9CA3AF', lineHeight: 1.7 }}>Adults 35-64 - HHI $75K+ - St. Louis DMA</div>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

function DisplaySection() {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.15 });
  return (
    <section ref={ref} data-section="spec-display" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', padding: '120px 32px', maxWidth: 960, margin: '0 auto' }}>
      <motion.div initial={{ opacity: 0, y: 60 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.9 }} style={{ width: '100%' }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.2em', textTransform: 'uppercase', color: '#6B7280', marginBottom: 20 }}>02 - Programmatic Display</div>
        <h2 style={{ fontSize: 'clamp(28px, 5vw, 52px)', fontWeight: 800, color: '#F9FAFB', lineHeight: 1.15, margin: '0 0 48px' }}>Digital Ad Creative <span style={{ color: '#9CA3AF' }}>(300x250)</span></h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginBottom: 40 }}>
          {adConcepts.map((ad, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 40 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.15 + i * 0.12, duration: 0.7 }} whileHover={{ y: -6, transition: { duration: 0.2 } }} style={{ border: '1px solid #1F2937', borderRadius: 4, padding: '32px 24px', background: '#111111' }}>
              <div style={{ display: 'inline-block', fontSize: 10, fontWeight: 700, letterSpacing: '.15em', textTransform: 'uppercase', color: ad.accent, border: '1px solid ' + ad.accent + '50', padding: '4px 10px', borderRadius: 2, marginBottom: 20 }}>{ad.tag}</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: '#F9FAFB', lineHeight: 1.15 }}>{ad.headline}</div>
            </motion.div>
          ))}
        </div>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.2em', textTransform: 'uppercase', color: '#6B7280', marginBottom: 20 }}>Creative Suite - Ad Sizes</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
          {adSizes.map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.5 + i * 0.08, duration: 0.5 }} style={{ border: '1px solid #1A1A1A', borderRadius: 4, padding: '18px 20px', background: '#0D0D0D' }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#c8a96e', marginBottom: 4 }}>{s.size}</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#F9FAFB', letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 8 }}>{s.format}</div>
              <div style={{ fontSize: 11, color: '#4B5563', lineHeight: 1.6 }}>{s.use}<br />{s.spec}</div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}

function WebsiteSection() {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.15 });
  return (
    <section ref={ref} data-section="spec-website" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', padding: '120px 32px', maxWidth: 960, margin: '0 auto' }}>
      <motion.div initial={{ opacity: 0, y: 60 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.9 }} style={{ width: '100%' }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.2em', textTransform: 'uppercase', color: '#6B7280', marginBottom: 20 }}>03 - Website Concept</div>
        <h2 style={{ fontSize: 'clamp(28px, 5vw, 52px)', fontWeight: 800, color: '#F9FAFB', lineHeight: 1.15, margin: '0 0 16px' }}>Landing Page <span style={{ color: '#9CA3AF' }}>/ Redesign Mockup</span></h2>
        <p style={{ fontSize: 16, color: '#6B7280', lineHeight: 1.7, maxWidth: 560, margin: '0 0 36px' }}>An interactive prototype for jazzstl.org built to drive campaign conversion. Navigation and select features are functional.</p>
        <motion.div initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.3, duration: 0.8 }} style={{ border: '1px solid #1F2937', borderRadius: 4, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', background: '#111111', borderBottom: '1px solid #1F2937' }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#FF5F57', opacity: 0.6 }} />
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#FFBD2E', opacity: 0.6 }} />
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#28C840', opacity: 0.6 }} />
            </div>
            <div style={{ fontSize: 11, color: '#374151' }}>stlouis-jazz-showcase.lovable.app</div>
            <a href="https://stlouis-jazz-showcase.lovable.app" target="_blank" rel="noopener noreferrer" style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.15em', textTransform: 'uppercase', color: '#c8a96e', textDecoration: 'none', border: '1px solid #c8a96e40', padding: '4px 12px', borderRadius: 2 }}>Open</a>
          </div>
          <iframe src="https://stlouis-jazz-showcase.lovable.app" style={{ width: '100%', height: 520, border: 'none', display: 'block' }} title="Jazz St. Louis Website Mockup" />
        </motion.div>
      </motion.div>
    </section>
  );
}

function CampaignFooter() {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.2 });
  return (
    <section ref={ref} data-section="spec-footer" style={{ padding: '100px 32px', maxWidth: 960, margin: '0 auto', borderTop: '1px solid #1A1A1A' }}>
      <motion.div initial={{ opacity: 0, y: 40 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.9 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.2em', textTransform: 'uppercase', color: '#6B7280', marginBottom: 16 }}>Multi-Media Campaign Preview</div>
        <h3 style={{ fontSize: 'clamp(20px, 3vw, 32px)', fontWeight: 800, color: '#F9FAFB', margin: '0 0 16px', lineHeight: 1.2 }}>May 2026 - April 2027</h3>
        <p style={{ fontSize: 14, color: '#4B5563', lineHeight: 1.8, maxWidth: 480, margin: '0 0 20px' }}>Full proposal includes channel strategy, flight schedule, budget ranges ($207,000-$262,500), KPI framework, and tactical recommendations.</p>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#c8a96e', letterSpacing: '.1em', textTransform: 'uppercase' }}>Full Campaign Proposal Available Upon Request</div>
      </motion.div>
    </section>
  );
}

export default function SpecSheetSection() {
  return (
    <div style={{ background: '#0F0F0F' }}>
      <CampaignHeader />
      <VideoSection />
      <DisplaySection />
      <WebsiteSection />
      <CampaignFooter />
    </div>
  );
}
