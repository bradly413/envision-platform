import { useEffect, useRef, useState } from 'react';
import { usePortalStore } from '../lib/store';
import { track } from '../lib/api';
import HeroSection from '../components/Hero/HeroSection';
import BrandSection from '../components/ScrollSections/BrandSection';
import LogoSection from '../components/ScrollSections/LogoSection';
import ColorSection from '../components/ScrollSections/ColorSection';
import TypographySection from '../components/ScrollSections/TypographySection';
import ApprovalSection from '../components/Approval/ApprovalSection';

export default function PresentationPage() {
  const { portal } = usePortalStore();
  const [scrollDepth, setScrollDepth] = useState(0);
  const startTime = useRef(Date.now());

  useEffect(() => {
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
  }, [scrollDepth, portal?.id]);

  // Track section views via IntersectionObserver
  useEffect(() => {
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
  }, [portal?.id]);

  if (!portal) return null;
  const content = portal.content || {};

  return (
    <div style={{ fontFamily: 'Inter, sans-serif', background: '#0F0F0F', color: '#F9FAFB' }}>
      <HeroSection clientName={portal.clientName} company={portal.company} content={content.hero} />
      <BrandSection content={content.brand} />
      <LogoSection content={content.logo} portalId={portal.id} />
      <ColorSection content={content.colors} />
      <TypographySection content={content.typography} />
      <ApprovalSection portalId={portal.id} clientName={portal.clientName} />
    </div>
  );
}
