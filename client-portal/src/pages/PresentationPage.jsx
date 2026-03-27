import { useEffect, useState } from 'react';
import { usePortalStore } from '../lib/store';
import { track } from '../lib/api';
import HeroSection from '../components/Hero/HeroSection';
import BrandSection from '../components/ScrollSections/BrandSection';
import LogoSection from '../components/ScrollSections/LogoSection';
import ColorSection from '../components/ScrollSections/ColorSection';
import TypographySection from '../components/ScrollSections/TypographySection';
import ApprovalSection from '../components/Approval/ApprovalSection';
import AmbientBackground from '../components/Experience/AmbientBackground';
import MotionSection from '../components/Experience/MotionSection';
import RevealPresentation from '../components/Presentation/RevealPresentation';
import { resolveExperience } from '../lib/experience';
import {
  InstitutionalHero,
  InstitutionalStrategySection,
  InstitutionalLogoSection,
  InstitutionalSystemSection,
} from '../components/Institutional/InstitutionalPortalSections';

function inferInstitutionalPortal(portal, content = {}) {
  const text = [
    portal?.clientName,
    portal?.company,
    content?.hero?.headline,
    content?.hero?.subheadline,
    content?.hero?.intro,
    content?.brand?.headline,
    content?.brand?.positioning,
    ...(Array.isArray(content?.brand?.pillars) ? content.brand.pillars.flatMap((pillar) => [pillar?.title, pillar?.desc]) : []),
    content?.cta?.headline,
    content?.cta?.body,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return /(school|academy|charter|student|students|learner|learners|campus|admissions|faculty|education|pre-k|prek|elementary|middle school)/.test(text);
}

function MinimalOverviewSection({ content = {}, company = '' }) {
  const pillars = Array.isArray(content.brand?.pillars) ? content.brand.pillars.slice(0, 3) : [];
  const colors = Array.isArray(content.colors?.palette) ? content.colors.palette.slice(0, 4) : [];

  return (
    <section data-section="brand-overview" style={{ padding: '120px 32px' }}>
      <div style={{ maxWidth: 1120, margin: '0 auto', display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: 40, alignItems: 'start' }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.2em', textTransform: 'uppercase', color: '#6B7280', marginBottom: 18 }}>01 — Overview</div>
          <h2 style={{ fontSize: 'clamp(28px, 5vw, 56px)', fontWeight: 800, color: '#F9FAFB', lineHeight: 1.08, margin: '0 0 18px' }}>
            {content.brand?.headline || 'The system behind the shift.'}
          </h2>
          <p style={{ fontSize: 16, color: '#9CA3AF', lineHeight: 1.85, margin: '0 0 28px', maxWidth: 640 }}>
            {content.brand?.positioning || 'A focused identity direction that clarifies the brand story and removes visual noise.'}
          </p>
          <div style={{ display: 'grid', gap: 14 }}>
            {pillars.map((pillar) => (
              <div key={pillar.title} style={{ padding: '16px 0', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#F9FAFB', marginBottom: 6 }}>{pillar.title}</div>
                <div style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.7 }}>{pillar.desc}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: 'grid', gap: 18 }}>
          <div style={{ padding: '22px 24px', borderRadius: 24, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: '#6B7280', marginBottom: 10 }}>Brand posture</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#F9FAFB', lineHeight: 1.2 }}>{company || 'Refined visual authority'}</div>
          </div>
          <div style={{ padding: '22px 24px', borderRadius: 24, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: '#6B7280', marginBottom: 14 }}>Palette snapshot</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
              {colors.map((color) => (
                <div key={color.name}>
                  <div style={{ height: 86, borderRadius: 16, background: color.hex, border: '1px solid rgba(255,255,255,0.08)' }} />
                  <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 8 }}>{color.name}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function IdentitySystemSection({ content = {} }) {
  const fonts = Array.isArray(content.typography?.fonts) ? content.typography.fonts.slice(0, 2) : [];
  const colors = Array.isArray(content.colors?.palette) ? content.colors.palette.slice(0, 5) : [];

  return (
    <section data-section="identity-system" style={{ padding: '120px 32px', background: '#101014' }}>
      <div style={{ maxWidth: 1120, margin: '0 auto' }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.2em', textTransform: 'uppercase', color: '#6B7280', marginBottom: 18 }}>02 — Identity system</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28 }}>
          <div style={{ padding: 28, borderRadius: 28, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 14 }}>Logo rationale</div>
            <div style={{ fontSize: 'clamp(24px, 4vw, 40px)', fontWeight: 800, color: '#F9FAFB', lineHeight: 1.08, marginBottom: 16 }}>
              {content.logo?.headline || 'A mark built for recognition.'}
            </div>
            <div style={{ fontSize: 15, color: '#6B7280', lineHeight: 1.8 }}>
              {content.logo?.rationale || 'The identity is designed to hold up across premium touchpoints, from presentations to rollout assets.'}
            </div>
          </div>
          <div style={{ padding: 28, borderRadius: 28, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 14 }}>Type system</div>
            <div style={{ display: 'grid', gap: 16 }}>
              {fonts.map((font) => (
                <div key={font.name}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#6B7280', letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 8 }}>{font.name}</div>
                  <div style={{ fontSize: 'clamp(26px, 4vw, 48px)', fontWeight: 800, color: '#F9FAFB', fontFamily: font.stack || 'inherit', lineHeight: 1.05 }}>{font.typeface}</div>
                  <div style={{ fontSize: 13, color: '#9CA3AF', marginTop: 8 }}>{font.usage}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div style={{ marginTop: 28, padding: 28, borderRadius: 28, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 16 }}>Color architecture</div>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.max(colors.length, 1)}, minmax(0, 1fr))`, gap: 12 }}>
            {colors.map((color) => (
              <div key={color.name} style={{ minWidth: 0 }}>
                <div style={{ height: 120, borderRadius: 18, background: color.hex, border: '1px solid rgba(255,255,255,0.08)', marginBottom: 10 }} />
                <div style={{ fontSize: 12, fontWeight: 700, color: '#F9FAFB' }}>{color.name}</div>
                <div style={{ fontSize: 11, color: '#9CA3AF', fontFamily: 'monospace', marginTop: 3 }}>{color.hex}</div>
                <div style={{ fontSize: 11, color: '#6B7280', marginTop: 6 }}>{color.role}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default function PresentationPage() {
  const { portal } = usePortalStore();
  const [scrollDepth, setScrollDepth] = useState(0);
  const rawContent = portal?.content || {};
  const isWrappedPortal = rawContent?.mode === 'portal' && rawContent?.portal;
  const isPresentationMode = rawContent?.mode === 'presentation' && rawContent?.presentation;
  const content = isWrappedPortal ? rawContent.portal : rawContent;
  const isInstitutionalPortal = inferInstitutionalPortal(portal, content);
  const normalizedExperience = content.experience || {};
  const experience = resolveExperience(
    isInstitutionalPortal && !normalizedExperience.preset
      ? { ...normalizedExperience, preset: 'institutional-academic' }
      : normalizedExperience
  );
  const templateId = content.portalTemplate || portal?.templateId || 'brand-reveal-v1';

  useEffect(() => {
    if (isPresentationMode || !portal?.id) return undefined;
    const handleScroll = () => {
      const el = document.documentElement;
      const pct = Math.round((el.scrollTop / (el.scrollHeight - el.clientHeight)) * 100);
      if (pct > scrollDepth) {
        setScrollDepth(pct);
        // Track every 25% milestone
        if (pct % 25 === 0) {
          track.event(portal.id, 'scroll', { percent: pct });
        }
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isPresentationMode, scrollDepth, portal?.id]);

  // Track section views via IntersectionObserver
  useEffect(() => {
    if (isPresentationMode || !portal?.id) return undefined;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const section = entry.target.dataset.section;
          if (section) track.event(portal?.id, 'section_view', { section });
        }
      });
    }, { threshold: 0.5 });

    document.querySelectorAll('[data-section]').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, [isPresentationMode, portal?.id]);

  if (!portal) return null;
  if (isPresentationMode) {
    return <RevealPresentation portalId={portal.id} presentation={rawContent.presentation} />;
  }

  if (isInstitutionalPortal) {
    return (
      <div style={{ fontFamily: 'Inter, sans-serif', background: '#F3F0E8', color: '#1F2A3A', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <InstitutionalHero
            clientName={portal.clientName}
            company={portal.company}
            content={content.hero}
          />
          <MotionSection effectName={experience.sectionEffects.about?.[0]} index={0}>
            <InstitutionalStrategySection content={content.brand} />
          </MotionSection>
          <MotionSection effectName={experience.sectionEffects.deliverables?.[0]} index={1}>
            <InstitutionalLogoSection content={content.logo} />
          </MotionSection>
          <MotionSection effectName={experience.sectionEffects.palette?.[0]} index={2}>
            <InstitutionalSystemSection colors={content.colors} typography={content.typography} cta={content.cta} />
          </MotionSection>
          <MotionSection effectName={experience.sectionEffects.cta?.[0]} index={3}>
            <ApprovalSection portalId={portal.id} clientName={portal.clientName} content={content.cta} />
          </MotionSection>
        </div>
      </div>
    );
  }

  const heroVariant = templateId === 'brand-reveal-minimal'
    ? 'minimal'
    : templateId === 'full-identity'
      ? 'identity'
      : 'default';

  return (
    <div style={{ fontFamily: 'Inter, sans-serif', background: experience.background?.base || '#0F0F0F', color: '#F9FAFB', position: 'relative', overflow: 'hidden' }}>
      <AmbientBackground experience={experience} />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <HeroSection
          clientName={portal.clientName}
          company={portal.company}
          content={content.hero}
          experience={experience}
          variant={heroVariant}
        />
        {templateId === 'brand-reveal-minimal' ? (
          <>
            <MotionSection effectName={experience.sectionEffects.about?.[0]} index={0}>
              <MinimalOverviewSection content={content} company={portal.company} />
            </MotionSection>
            <MotionSection effectName={experience.sectionEffects.palette?.[0]} index={1}>
              <ColorSection content={content.colors} />
            </MotionSection>
            <MotionSection effectName={experience.sectionEffects.typography?.[0]} index={2}>
              <TypographySection content={content.typography} />
            </MotionSection>
            <MotionSection effectName={experience.sectionEffects.deliverables?.[0]} index={3}>
              <LogoSection content={content.logo} portalId={portal.id} />
            </MotionSection>
            <MotionSection effectName={experience.sectionEffects.cta?.[0]} index={4}>
              <ApprovalSection portalId={portal.id} clientName={portal.clientName} content={content.cta} />
            </MotionSection>
          </>
        ) : templateId === 'full-identity' ? (
          <>
            <MotionSection effectName={experience.sectionEffects.about?.[0]} index={0}>
              <BrandSection content={content.brand} />
            </MotionSection>
            <MotionSection effectName={experience.sectionEffects.deliverables?.[0]} index={1}>
              <IdentitySystemSection content={content} />
            </MotionSection>
            <MotionSection effectName={experience.sectionEffects.palette?.[0]} index={2}>
              <LogoSection content={content.logo} portalId={portal.id} />
            </MotionSection>
            <MotionSection effectName={experience.sectionEffects.typography?.[0]} index={3}>
              <TypographySection content={content.typography} />
            </MotionSection>
            <MotionSection effectName={experience.sectionEffects.cta?.[0]} index={4}>
              <ApprovalSection portalId={portal.id} clientName={portal.clientName} content={content.cta} />
            </MotionSection>
          </>
        ) : (
          <>
            <MotionSection effectName={experience.sectionEffects.about?.[0]} index={0}>
              <BrandSection content={content.brand} />
            </MotionSection>
            <MotionSection effectName={experience.sectionEffects.deliverables?.[0]} index={1}>
              <LogoSection content={content.logo} portalId={portal.id} />
            </MotionSection>
            <MotionSection effectName={experience.sectionEffects.palette?.[0]} index={2}>
              <ColorSection content={content.colors} />
            </MotionSection>
            <MotionSection effectName={experience.sectionEffects.typography?.[0]} index={3}>
              <TypographySection content={content.typography} />
            </MotionSection>
            <MotionSection effectName={experience.sectionEffects.cta?.[0]} index={4}>
              <ApprovalSection portalId={portal.id} clientName={portal.clientName} content={content.cta} />
            </MotionSection>
          </>
        )}
      </div>
    </div>
  );
}
