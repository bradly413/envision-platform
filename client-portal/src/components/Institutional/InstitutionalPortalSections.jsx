import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

const INSTITUTIONAL_COLORS = {
  bg: '#F3F0E8',
  paper: '#FAF7F1',
  ink: '#1F2A3A',
  muted: '#5E6877',
  line: 'rgba(31,42,58,0.16)',
  panel: '#E8E2D6',
  accent: '#2F3A4D',
};

function SectionShell({ sectionId, eyebrow, title, children, dark = false }) {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.18 });

  return (
    <section
      ref={ref}
      data-section={sectionId}
      style={{
        padding: '110px 32px',
        background: dark ? INSTITUTIONAL_COLORS.accent : 'transparent',
        color: dark ? '#F8F6F1' : INSTITUTIONAL_COLORS.ink,
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 36 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.85 }}
        style={{ maxWidth: 1120, margin: '0 auto' }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '.18em',
            textTransform: 'uppercase',
            color: dark ? 'rgba(248,246,241,0.6)' : INSTITUTIONAL_COLORS.muted,
            marginBottom: 18,
          }}
        >
          {eyebrow}
        </div>
        <h2
          style={{
            fontSize: 'clamp(32px, 5vw, 66px)',
            fontWeight: 800,
            letterSpacing: '-0.04em',
            lineHeight: 0.98,
            margin: '0 0 28px',
            color: dark ? '#F8F6F1' : INSTITUTIONAL_COLORS.ink,
          }}
        >
          {title}
        </h2>
        {children}
      </motion.div>
    </section>
  );
}

export function InstitutionalHero({ content = {}, clientName, company }) {
  const schoolName = company || clientName || 'Institutional Rebrand';

  return (
    <section
      data-section="hero"
      style={{
        minHeight: '100vh',
        padding: '72px 32px 56px',
        background: `linear-gradient(180deg, ${INSTITUTIONAL_COLORS.paper} 0%, ${INSTITUTIONAL_COLORS.bg} 100%)`,
        color: INSTITUTIONAL_COLORS.ink,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: '32px',
          border: `1px solid ${INSTITUTIONAL_COLORS.line}`,
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          maxWidth: 1180,
          margin: '0 auto',
          minHeight: 'calc(100vh - 128px)',
          display: 'grid',
          gridTemplateColumns: '360px 1fr',
          gap: 40,
          alignItems: 'center',
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9 }}
          style={{
            background: INSTITUTIONAL_COLORS.accent,
            color: '#F8F6F1',
            borderRadius: 28,
            padding: '30px 28px',
            boxShadow: '0 20px 60px rgba(20, 27, 38, 0.14)',
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.16em', textTransform: 'uppercase', opacity: 0.65, marginBottom: 18 }}>
            Proposed identity
          </div>
          <div style={{ border: '1px solid rgba(248,246,241,0.18)', borderRadius: 24, padding: 20, marginBottom: 18 }}>
            <div style={{ aspectRatio: '1 / 1', borderRadius: '50%', border: '2px solid rgba(248,246,241,0.72)', display: 'grid', placeItems: 'center', padding: 26 }}>
              <div style={{ width: '100%', height: '100%', borderRadius: '50%', border: '1px solid rgba(248,246,241,0.52)', display: 'grid', placeItems: 'center' }}>
                <div style={{ width: '58%', aspectRatio: '1 / 1.1', borderRadius: '20px 20px 28px 28px', border: '2px solid rgba(248,246,241,0.9)', display: 'grid', placeItems: 'center', fontSize: 36, fontWeight: 700 }}>
                  PCS
                </div>
              </div>
            </div>
          </div>
          <div style={{ fontSize: 11, letterSpacing: '.12em', textTransform: 'uppercase', opacity: 0.6 }}>Institutional mark study</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.95, delay: 0.08 }}
          style={{ textAlign: 'left' }}
        >
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.22em', textTransform: 'uppercase', color: INSTITUTIONAL_COLORS.muted, marginBottom: 20 }}>
            {content.eyebrow || 'Charter rebrand concept'}
          </div>
          <div style={{ fontSize: 14, color: INSTITUTIONAL_COLORS.muted, textTransform: 'uppercase', letterSpacing: '.14em', marginBottom: 12 }}>
            {schoolName}
          </div>
          <h1
            style={{
              fontSize: 'clamp(46px, 8vw, 108px)',
              lineHeight: 0.93,
              margin: '0 0 18px',
              fontWeight: 800,
              letterSpacing: '-0.05em',
              color: INSTITUTIONAL_COLORS.ink,
              maxWidth: 760,
            }}
          >
            {content.headline || 'A school identity built on trust, curiosity, and academic character.'}
          </h1>
          <div
            style={{
              fontSize: 'clamp(24px, 3vw, 42px)',
              lineHeight: 1.06,
              color: '#384457',
              fontWeight: 700,
              maxWidth: 700,
              marginBottom: 24,
            }}
          >
            {content.subheadline || 'More institutional. More welcoming. More distinctive for families and leadership alike.'}
          </div>
          <p style={{ fontSize: 18, lineHeight: 1.85, color: INSTITUTIONAL_COLORS.muted, maxWidth: 700, margin: 0 }}>
            {content.intro || 'This concept repositions the school with a more established visual presence while preserving warmth, student-centered values, and community confidence.'}
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 14, marginTop: 34, maxWidth: 760 }}>
            {[
              { label: 'Position', value: 'Institutional, not generic' },
              { label: 'Audience', value: 'Parents, board, leadership' },
              { label: 'Signal', value: 'Curious and empowered learners' },
            ].map((item) => (
              <div key={item.label} style={{ background: 'rgba(255,255,255,0.5)', border: `1px solid ${INSTITUTIONAL_COLORS.line}`, borderRadius: 18, padding: '16px 18px' }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: INSTITUTIONAL_COLORS.muted, marginBottom: 8 }}>{item.label}</div>
                <div style={{ fontSize: 15, lineHeight: 1.45, color: INSTITUTIONAL_COLORS.ink, fontWeight: 700 }}>{item.value}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export function InstitutionalStrategySection({ content = {} }) {
  const pillars = Array.isArray(content.pillars) ? content.pillars.slice(0, 3) : [];

  return (
    <SectionShell
      sectionId="brand-strategy"
      eyebrow={content.eyebrow || 'Strategic Foundation'}
      title={content.headline || 'A more credible face for a deeply student-centered school.'}
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1.05fr 0.95fr', gap: 34, alignItems: 'start' }}>
        <div style={{ background: '#FFFDF8', border: `1px solid ${INSTITUTIONAL_COLORS.line}`, borderRadius: 28, padding: 28 }}>
          <p style={{ fontSize: 18, lineHeight: 1.9, color: INSTITUTIONAL_COLORS.muted, margin: 0 }}>
            {content.positioning || 'The identity should reassure families, elevate the school beyond generic education branding, and express a culture of rigor, curiosity, and long-term student growth.'}
          </p>
        </div>
        <div style={{ display: 'grid', gap: 14 }}>
          {pillars.map((pillar, index) => (
            <motion.div
              key={pillar.title || index}
              initial={{ opacity: 0, x: 22 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.35 }}
              transition={{ duration: 0.7, delay: index * 0.08 }}
              style={{ background: INSTITUTIONAL_COLORS.panel, borderRadius: 24, padding: '20px 22px', border: `1px solid ${INSTITUTIONAL_COLORS.line}` }}
            >
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: INSTITUTIONAL_COLORS.muted, marginBottom: 8 }}>
                Pillar {index + 1}
              </div>
              <div style={{ fontSize: 24, lineHeight: 1.1, color: INSTITUTIONAL_COLORS.ink, fontWeight: 800, marginBottom: 8 }}>{pillar.title}</div>
              <div style={{ fontSize: 15, lineHeight: 1.7, color: INSTITUTIONAL_COLORS.muted }}>{pillar.desc}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </SectionShell>
  );
}

export function InstitutionalLogoSection({ content = {} }) {
  return (
    <SectionShell
      sectionId="logo"
      eyebrow={content.eyebrow || 'Identity System'}
      title={content.headline || 'The crest turns the school into a more established institution.'}
      dark
    >
      <div style={{ display: 'grid', gridTemplateColumns: '0.92fr 1.08fr', gap: 28, alignItems: 'stretch' }}>
        <div style={{ borderRadius: 30, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', padding: 26, display: 'grid', placeItems: 'center' }}>
          <div style={{ width: 'min(340px, 100%)', aspectRatio: '1 / 1', borderRadius: '50%', border: '2px solid rgba(248,246,241,0.7)', display: 'grid', placeItems: 'center', padding: 24 }}>
            <div style={{ width: '100%', height: '100%', borderRadius: '50%', border: '1px solid rgba(248,246,241,0.4)', display: 'grid', placeItems: 'center' }}>
              <div style={{ width: '58%', aspectRatio: '1 / 1.1', border: '2px solid rgba(248,246,241,0.92)', borderRadius: '18px 18px 28px 28px', display: 'grid', placeItems: 'center', fontSize: 44, fontWeight: 700 }}>
                PCS
              </div>
            </div>
          </div>
        </div>
        <div style={{ display: 'grid', gap: 16 }}>
          <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 24, padding: 24 }}>
            <div style={{ fontSize: 12, color: 'rgba(248,246,241,0.62)', textTransform: 'uppercase', letterSpacing: '.12em', marginBottom: 10 }}>Mark logic</div>
            <div style={{ fontSize: 17, lineHeight: 1.85, color: 'rgba(248,246,241,0.8)' }}>
              {content.rationale || 'The crest introduces heritage, seriousness, and civic confidence while still feeling approachable for a family-facing school community.'}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 14 }}>
            {['Seal', 'Horizontal', 'Monogram'].map((label) => (
              <div key={label} style={{ borderRadius: 22, border: '1px solid rgba(255,255,255,0.1)', padding: 20, background: 'rgba(255,255,255,0.03)' }}>
                <div style={{ fontSize: 10, color: 'rgba(248,246,241,0.58)', textTransform: 'uppercase', letterSpacing: '.12em', marginBottom: 24 }}>{label}</div>
                <div style={{ fontSize: label === 'Monogram' ? 42 : 24, fontWeight: 800, letterSpacing: '-0.03em', color: '#F8F6F1' }}>
                  {label === 'Monogram' ? 'PCS' : 'Premier Charter School'}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </SectionShell>
  );
}

export function InstitutionalSystemSection({ colors = {}, typography = {}, cta = {} }) {
  const palette = Array.isArray(colors.palette) ? colors.palette.slice(0, 4) : [];
  const fonts = Array.isArray(typography.fonts) ? typography.fonts.slice(0, 2) : [];

  return (
    <SectionShell
      sectionId="color-palette"
      eyebrow={colors.eyebrow || typography.eyebrow || 'Visual Language'}
      title={colors.headline || typography.headline || 'A disciplined academic palette with classic typographic presence.'}
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1.08fr 0.92fr', gap: 28 }}>
        <div style={{ background: '#FFFDF8', border: `1px solid ${INSTITUTIONAL_COLORS.line}`, borderRadius: 28, padding: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: INSTITUTIONAL_COLORS.muted, marginBottom: 16 }}>Color architecture</div>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.max(palette.length, 1)}, minmax(0, 1fr))`, gap: 14 }}>
            {palette.map((color) => (
              <div key={color.name}>
                <div style={{ height: 180, borderRadius: 18, background: color.hex, border: `1px solid ${INSTITUTIONAL_COLORS.line}`, marginBottom: 10 }} />
                <div style={{ fontSize: 12, fontWeight: 700, color: INSTITUTIONAL_COLORS.ink }}>{color.name}</div>
                <div style={{ fontSize: 11, fontFamily: 'monospace', color: INSTITUTIONAL_COLORS.muted, marginTop: 4 }}>{color.hex}</div>
                <div style={{ fontSize: 11, color: INSTITUTIONAL_COLORS.muted, marginTop: 6, lineHeight: 1.5 }}>{color.role}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: 'grid', gap: 16 }}>
          <div style={{ background: '#FFFDF8', border: `1px solid ${INSTITUTIONAL_COLORS.line}`, borderRadius: 28, padding: 24 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: INSTITUTIONAL_COLORS.muted, marginBottom: 16 }}>Typography</div>
            {fonts.map((font) => (
              <div key={font.name} style={{ marginBottom: 18 }}>
                <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.12em', color: INSTITUTIONAL_COLORS.muted, marginBottom: 8 }}>{font.name}</div>
                <div style={{ fontFamily: font.stack || 'inherit', fontSize: 'clamp(26px, 4vw, 52px)', fontWeight: 800, lineHeight: 1.02, color: INSTITUTIONAL_COLORS.ink }}>
                  {font.typeface}
                </div>
                <div style={{ fontSize: 13, lineHeight: 1.6, color: INSTITUTIONAL_COLORS.muted, marginTop: 8 }}>{font.usage}</div>
              </div>
            ))}
          </div>
          <div style={{ background: INSTITUTIONAL_COLORS.accent, color: '#F8F6F1', borderRadius: 28, padding: 24 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', opacity: 0.58, marginBottom: 12 }}>
              {cta.eyebrow || 'Stakeholder confidence'}
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, lineHeight: 1.08, marginBottom: 10 }}>{cta.headline || 'A stronger public face for the next chapter.'}</div>
            <div style={{ fontSize: 15, lineHeight: 1.8, color: 'rgba(248,246,241,0.76)' }}>
              {cta.body || 'The system is designed to present the school as rigorous, welcoming, and deeply intentional across families, admissions, fundraising, and leadership communications.'}
            </div>
          </div>
        </div>
      </div>
    </SectionShell>
  );
}

