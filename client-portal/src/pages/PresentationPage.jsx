import React, { useEffect, useState } from 'react';
import { usePortalStore } from '../lib/store';
import { portalAuth, track } from '../lib/api';
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

class PortalErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error: error.message || String(error) };
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{
          minHeight: '100vh', display: 'grid', placeItems: 'center',
          background: '#09090B', color: '#E2E8F0', fontFamily: 'Inter, sans-serif',
          padding: 32, textAlign: 'center',
        }}>
          <div style={{ maxWidth: 480 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.14em', color: '#F87171', marginBottom: 16 }}>
              Rendering Error
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}>
              This presentation couldn't load
            </div>
            <div style={{ fontSize: 14, color: '#94A3B8', lineHeight: 1.7, marginBottom: 24 }}>
              The content format may be incompatible with the current renderer. Please contact your brand team to re-publish this portal.
            </div>
            <div style={{ fontSize: 11, color: '#475569', fontFamily: 'monospace', padding: 12, borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
              {this.state.error}
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function ContentNotRecognized({ mode }) {
  return (
    <div style={{
      minHeight: '100vh', display: 'grid', placeItems: 'center',
      background: '#09090B', color: '#E2E8F0', fontFamily: 'Inter, sans-serif',
      padding: 32, textAlign: 'center',
    }}>
      <div style={{ maxWidth: 480 }}>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.14em', color: '#FBBF24', marginBottom: 16 }}>
          Content Unavailable
        </div>
        <div style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}>
          This portal is being updated
        </div>
        <div style={{ fontSize: 14, color: '#94A3B8', lineHeight: 1.7 }}>
          The presentation content hasn't been published yet, or the format needs to be refreshed. Please check back soon or contact your brand team.
        </div>
        {mode ? (
          <div style={{ marginTop: 16, fontSize: 11, color: '#475569' }}>
            Content mode: {mode}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function LoadingPresentation() {
  return (
    <div style={{
      minHeight: '100vh', display: 'grid', placeItems: 'center',
      background: '#09090B', color: '#E2E8F0', fontFamily: 'Inter, sans-serif',
      padding: 32, textAlign: 'center',
    }}>
      <div style={{ maxWidth: 420 }}>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.14em', color: '#A7F3D0', marginBottom: 16 }}>
          Loading Presentation
        </div>
        <div style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}>
          Restoring your session
        </div>
        <div style={{ fontSize: 14, color: '#94A3B8', lineHeight: 1.7 }}>
          Your presentation is being securely refreshed.
        </div>
      </div>
    </div>
  );
}

function SessionUnavailable({ message }) {
  return (
    <div style={{
      minHeight: '100vh', display: 'grid', placeItems: 'center',
      background: '#09090B', color: '#E2E8F0', fontFamily: 'Inter, sans-serif',
      padding: 32, textAlign: 'center',
    }}>
      <div style={{ maxWidth: 480 }}>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.14em', color: '#FBBF24', marginBottom: 16 }}>
          Session Unavailable
        </div>
        <div style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}>
          Please sign in again
        </div>
        <div style={{ fontSize: 14, color: '#94A3B8', lineHeight: 1.7 }}>
          {message || 'We could not refresh this presentation session.'}
        </div>
      </div>
    </div>
  );
}

function UploadedHtmlPresentation({ htmlUpload }) {
  const rawDocument = htmlUpload?.document || '';
  const title = htmlUpload?.title || htmlUpload?.fileName || 'HTML presentation';

  return (
    <div style={{ minHeight: '100vh', background: '#050816' }}>
      <div style={{
        position: 'fixed',
        inset: '0 auto auto 0',
        zIndex: 20,
        padding: '10px 14px',
        fontFamily: 'Inter, sans-serif',
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '.08em',
        textTransform: 'uppercase',
        color: 'rgba(226,232,240,0.72)',
        background: 'linear-gradient(180deg, rgba(5,8,22,0.86), rgba(5,8,22,0))',
        pointerEvents: 'none',
      }}>
        {title}
      </div>
      <iframe
        title={title}
        srcDoc={rawDocument}
        sandbox="allow-same-origin allow-scripts allow-forms allow-modals allow-popups allow-downloads"
        style={{
          width: '100%',
          minHeight: '100vh',
          border: 'none',
          display: 'block',
          background: '#fff',
        }}
      />
    </div>
  );
}

export default function PresentationPage() {
  const { token, portal, setPortalAuth, logout } = usePortalStore();
  const [scrollDepth, setScrollDepth] = useState(0);
  const [sessionError, setSessionError] = useState('');
  const hasHydratedContent = Boolean(portal) && portal.content !== null && portal.content !== undefined;
  const needsSessionRefresh = Boolean(token) && !hasHydratedContent;
  const rawContent = portal?.content || {};
  const isWrappedPortal = rawContent?.mode === 'portal' && rawContent?.portal;
  const isPresentationMode = rawContent?.mode === 'presentation' && rawContent?.presentation;
  const isCinematicFlowMode = rawContent?.mode === 'cinematic-flow' && rawContent?.cinematicFlow;
  const isCinematicCodeMode = rawContent?.mode === 'cinematic-code' && rawContent?.cinematicCode?.files;
  const isUploadedHtmlMode = rawContent?.mode === 'uploaded-html' && rawContent?.htmlUpload?.document;
  const isPortalMode = isWrappedPortal || (!isPresentationMode && !isCinematicFlowMode && !isCinematicCodeMode && rawContent?.hero);
  const content = isWrappedPortal ? rawContent.portal : rawContent;
  const experience = resolveExperience(content.experience || {});
  const theme = resolvePortalTheme({ content, experience, portal });

  useEffect(() => {
    if (!needsSessionRefresh) return undefined;

    let active = true;
    setSessionError('');

    portalAuth.current()
      .then((data) => {
        if (!active) return;
        const resolvedPortal = data?.portal || {};
        setPortalAuth(token, {
          id: resolvedPortal.id || portal?.id,
          slug: resolvedPortal.slug || portal?.slug,
          templateId: resolvedPortal.templateId || portal?.templateId || '',
          clientName: resolvedPortal.clientName || portal?.clientName || '',
          company: resolvedPortal.company || portal?.company || '',
          content: resolvedPortal.content ?? {},
        });
      })
      .catch((err) => {
        if (!active) return;
        const status = err?.response?.status;
        if (status === 401 || status === 403 || status === 404) {
          logout();
        }
        setSessionError(err?.response?.data?.error || 'Please return to your portal link and sign in again.');
      });

    return () => {
      active = false;
    };
  }, [logout, needsSessionRefresh, portal, setPortalAuth, token]);

  useEffect(() => {
    if (isPresentationMode || isCinematicFlowMode || !portal?.id) return undefined;
    const handleScroll = () => {
      const el = document.documentElement;
      const pct = Math.round((el.scrollTop / (el.scrollHeight - el.clientHeight)) * 100);
      if (pct > scrollDepth) {
        setScrollDepth(pct);
        if (pct % 25 === 0) {
          track.event(portal.id, 'scroll', { percent: pct });
        }
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isCinematicFlowMode, isPresentationMode, scrollDepth, portal?.id]);

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

  if (!portal && !token) return null;
  if (!hasHydratedContent) {
    return sessionError ? <SessionUnavailable message={sessionError} /> : <LoadingPresentation />;
  }

  if (isPresentationMode) {
    return (
      <PortalErrorBoundary>
        <RevealPresentation portalId={portal.id} presentation={rawContent.presentation} />
      </PortalErrorBoundary>
    );
  }

  if (isCinematicFlowMode) {
    return (
      <PortalErrorBoundary>
        <CinematicFlowRenderer portalId={portal.id} cinematicFlow={rawContent.cinematicFlow} />
      </PortalErrorBoundary>
    );
  }

  if (isCinematicCodeMode) {
    return (
      <PortalErrorBoundary>
        <CinematicCodeRenderer files={rawContent.cinematicCode.files} />
      </PortalErrorBoundary>
    );
  }

  if (isUploadedHtmlMode) {
    return (
      <PortalErrorBoundary>
        <UploadedHtmlPresentation htmlUpload={rawContent.htmlUpload} />
      </PortalErrorBoundary>
    );
  }

  if (!isPortalMode) {
    return <ContentNotRecognized mode={rawContent?.mode} />;
  }

  return (
    <PortalErrorBoundary>
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
    </PortalErrorBoundary>
  );
}
