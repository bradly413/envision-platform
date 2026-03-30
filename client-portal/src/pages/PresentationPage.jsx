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
import CinematicFlowRenderer from '../components/CinematicFlow/CinematicFlowRenderer';
import CinematicCodeRenderer from '../components/CinematicCode/CinematicCodeRenderer';
import PortalChatWidget from '../components/PortalChat/PortalChatWidget';
import { resolveExperience, resolvePortalTheme } from '../lib/experience';

export default function PresentationPage() {
  const { portal } = usePortalStore();
  const [scrollDepth, setScrollDepth] = useState(0);
  const rawContent = portal?.content || {};
  const isWrappedPortal = rawContent?.mode === 'portal' && rawContent?.portal;
  const isPresentationMode = rawContent?.mode === 'presentation' && rawContent?.presentation;
  const isCinematicFlowMode = rawContent?.mode === 'cinematic-flow' && rawContent?.cinematicFlow;
  const isCinematicCodeMode = rawContent?.mode === 'cinematic-code' && rawContent?.cinematicCode?.files;
  const content = isWrappedPortal ? rawContent.portal : rawContent;
  const experience = resolveExperience(content.experience || {});
  const theme = resolvePortalTheme({ content, experience, portal });

  useEffect(() => {
    if (isPresentationMode || isCinematicFlowMode || !portal?.id) return undefined;
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
  }, [isCinematicFlowMode, isPresentationMode, scrollDepth, portal?.id]);

  // Track section views via IntersectionObserver
  useEffect(() => {
    if (isPresentationMode || isCinematicFlowMode || !portal?.id) return undefined;
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
  }, [isCinematicFlowMode, isPresentationMode, portal?.id]);

  if (!portal) return null;
  if (isPresentationMode) {
    return <RevealPresentation portalId={portal.id} presentation={rawContent.presentation} />;
  }
  if (isCinematicFlowMode) {
    return <CinematicFlowRenderer portalId={portal.id} cinematicFlow={rawContent.cinematicFlow} />;
  }
  if (isCinematicCodeMode) {
    return <CinematicCodeRenderer files={rawContent.cinematicCode.files} />;
  }

  return (
    <div style={{ fontFamily: 'Inter, sans-serif', background: theme.base, color: theme.textPrimary, position: 'relative', overflow: 'hidden' }}>
      <AmbientBackground experience={experience} theme={theme} />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <HeroSection clientName={portal.clientName} company={portal.company} content={content.hero} experience={experience} theme={theme} />
        <MotionSection effectName={experience.sectionEffects.about?.[0]} index={0} theme={theme}>
          <BrandSection content={content.brand} theme={theme} />
        </MotionSection>
        <MotionSection effectName={experience.sectionEffects.deliverables?.[0]} index={1} theme={theme}>
          <LogoSection content={content.logo} portalId={portal.id} theme={theme} />
        </MotionSection>
        <MotionSection effectName={experience.sectionEffects.palette?.[0]} index={2} theme={theme}>
          <ColorSection content={content.colors} theme={theme} />
        </MotionSection>
        <MotionSection effectName={experience.sectionEffects.typography?.[0]} index={3} theme={theme}>
          <TypographySection content={content.typography} theme={theme} />
        </MotionSection>
        <MotionSection effectName={experience.sectionEffects.cta?.[0]} index={4} theme={theme}>
          <ApprovalSection portalId={portal.id} clientName={portal.clientName} content={content.cta} theme={theme} />
        </MotionSection>
      </div>
      <PortalChatWidget portalId={portal.id} />
    </div>
  );
}
