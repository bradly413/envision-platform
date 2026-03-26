import { useEffect, useMemo, useRef } from 'react';
import Reveal from 'reveal.js';
import RevealNotes from 'reveal.js/plugin/notes/notes.esm.js';
import RevealHighlight from 'reveal.js/plugin/highlight/highlight.esm.js';
import 'reveal.js/dist/reveal.css';
import 'reveal.js/plugin/highlight/monokai.css';
import './RevealPresentation.css';
import { track } from '../../lib/api';

const THEME_VARS = {
  black: {
    '--deck-bg': '#070a12',
    '--deck-fg': '#e5e7eb',
    '--deck-heading': '#ffffff',
    '--deck-accent': '#8ab4ff',
    '--deck-accent-strong': '#d5e3ff',
  },
  white: {
    '--deck-bg': '#f4f5f7',
    '--deck-fg': '#111827',
    '--deck-heading': '#0f172a',
    '--deck-accent': '#1d4ed8',
    '--deck-accent-strong': '#1e40af',
  },
  night: {
    '--deck-bg': '#05060b',
    '--deck-fg': '#f9fafb',
    '--deck-heading': '#ffffff',
    '--deck-accent': '#f59e0b',
    '--deck-accent-strong': '#fcd34d',
  },
  moon: {
    '--deck-bg': '#09111f',
    '--deck-fg': '#dbe3f0',
    '--deck-heading': '#f8fbff',
    '--deck-accent': '#6ea8ff',
    '--deck-accent-strong': '#b8d0ff',
  },
  league: {
    '--deck-bg': '#1b1c21',
    '--deck-fg': '#f3f4f6',
    '--deck-heading': '#ffffff',
    '--deck-accent': '#60a5fa',
    '--deck-accent-strong': '#bfdbfe',
  },
  serif: {
    '--deck-bg': '#e7ddcb',
    '--deck-fg': '#43352d',
    '--deck-heading': '#23170f',
    '--deck-accent': '#87542e',
    '--deck-accent-strong': '#5f381a',
  },
  blood: {
    '--deck-bg': '#12060b',
    '--deck-fg': '#f5e7ea',
    '--deck-heading': '#ffffff',
    '--deck-accent': '#ef4444',
    '--deck-accent-strong': '#fecaca',
  },
  simple: {
    '--deck-bg': '#f8fafc',
    '--deck-fg': '#0f172a',
    '--deck-heading': '#020617',
    '--deck-accent': '#2563eb',
    '--deck-accent-strong': '#1d4ed8',
  },
};

function coerceArray(value) {
  return Array.isArray(value) ? value : [];
}

function getSectionProps(slide = {}) {
  const props = {};
  const background = slide.background || {};

  if (slide.transition) props['data-transition'] = slide.transition;
  if (slide.autoAnimate !== false) props['data-auto-animate'] = true;
  if (slide.autoAnimateId) props['data-auto-animate-id'] = slide.autoAnimateId;
  if (slide.autoAnimateRestart) props['data-auto-animate-restart'] = true;

  if (background.type === 'color' && background.value) props['data-background-color'] = background.value;
  if (background.type === 'gradient' && background.value) props['data-background-gradient'] = background.value;
  if (background.type === 'image' && background.value) {
    props['data-background-image'] = background.value;
    if (background.size) props['data-background-size'] = background.size;
    if (background.position) props['data-background-position'] = background.position;
    if (background.repeat) props['data-background-repeat'] = background.repeat;
    if (background.opacity !== undefined) props['data-background-opacity'] = background.opacity;
  }
  if (background.type === 'video' && background.value) {
    props['data-background-video'] = background.value;
    if (background.loop) props['data-background-video-loop'] = true;
    if (background.muted !== false) props['data-background-video-muted'] = true;
    if (background.size) props['data-background-size'] = background.size;
    if (background.opacity !== undefined) props['data-background-opacity'] = background.opacity;
  }
  if (background.type === 'iframe' && background.value) {
    props['data-background-iframe'] = background.value;
    if (background.interactive) props['data-background-interactive'] = true;
    if (background.preload) props['data-preload'] = true;
  }
  if (background.transition) props['data-background-transition'] = background.transition;

  return props;
}

function renderMedia(media) {
  if (!media?.src) return null;

  if (media.type === 'video') {
    return (
      <video
        src={media.src}
        autoPlay={media.autoplay}
        muted={media.muted !== false}
        loop={media.loop}
        controls={media.controls}
        playsInline
      />
    );
  }

  if (media.type === 'iframe') {
    return <iframe src={media.src} title={media.title || 'Embedded presentation media'} allow="autoplay; fullscreen" />;
  }

  return <img src={media.src} alt={media.alt || ''} />;
}

function renderFragments(fragments = []) {
  return coerceArray(fragments).map((fragment, index) => {
    const item = typeof fragment === 'string' ? { text: fragment } : fragment;
    const style = item.style || 'fade-up';
    return (
      <p
        key={`${item.text || 'fragment'}-${index}`}
        className={`fragment ${style}`}
        data-fragment-index={item.index}
        style={{ margin: 0, color: 'rgba(255,255,255,0.74)', lineHeight: 1.55 }}
      >
        {item.text}
      </p>
    );
  });
}

function renderActions(actions = []) {
  const items = coerceArray(actions);
  if (!items.length) return null;

  return (
    <div className="envision-slide__actions">
      {items.map((action, index) => (
        <a key={`${action.label || 'action'}-${index}`} className="envision-slide__button" href={action.href || '#'} target={action.target || undefined} rel="noreferrer">
          {action.label || 'Open'}
        </a>
      ))}
    </div>
  );
}

function renderSlideContent(slide = {}) {
  const layout = slide.layout || 'statement';
  const bullets = coerceArray(slide.bullets);
  const stats = coerceArray(slide.stats);
  const fragments = renderFragments(slide.fragments);
  const mediaNode = renderMedia(slide.media);

  if (layout === 'quote') {
    return (
      <>
        {slide.eyebrow && <p className="envision-slide__eyebrow">{slide.eyebrow}</p>}
        {slide.title && <blockquote className="envision-slide__quote">“{slide.title}”</blockquote>}
        {slide.subtitle && <p className="envision-slide__subtitle">{slide.subtitle}</p>}
        {renderActions(slide.actions)}
        {fragments}
      </>
    );
  }

  if (layout === 'stats') {
    return (
      <>
        {slide.eyebrow && <p className="envision-slide__eyebrow">{slide.eyebrow}</p>}
        {slide.title && <h2 className="envision-slide__title">{slide.title}</h2>}
        {slide.body && <p className="envision-slide__body">{slide.body}</p>}
        <div className="envision-slide__stats">
          {stats.map((stat, index) => (
            <div className="envision-slide__stat" key={`${stat.label || 'stat'}-${index}`}>
              <div className="envision-slide__stat-value">{stat.value}</div>
              <div className="envision-slide__stat-label">{stat.label}</div>
            </div>
          ))}
        </div>
        {fragments}
      </>
    );
  }

  if (layout === 'code') {
    return (
      <>
        {slide.eyebrow && <p className="envision-slide__eyebrow">{slide.eyebrow}</p>}
        {slide.title && <h2 className="envision-slide__title">{slide.title}</h2>}
        {slide.body && <p className="envision-slide__body">{slide.body}</p>}
        {slide.code?.content && (
          <pre className="envision-slide__code">
            <code
              className={slide.code.language ? `language-${slide.code.language}` : undefined}
              data-line-numbers={slide.code.lineNumbers || undefined}
            >
              {slide.code.content}
            </code>
          </pre>
        )}
        {fragments}
      </>
    );
  }

  if (layout === 'embed') {
    return (
      <>
        {slide.eyebrow && <p className="envision-slide__eyebrow">{slide.eyebrow}</p>}
        {slide.title && <h2 className="envision-slide__title">{slide.title}</h2>}
        {slide.body && <p className="envision-slide__body">{slide.body}</p>}
        <div className="envision-slide__media-frame">
          {slide.iframe?.src
            ? <iframe src={slide.iframe.src} title={slide.iframe.title || slide.title || 'Embedded content'} allow="autoplay; fullscreen" />
            : mediaNode}
        </div>
        {fragments}
      </>
    );
  }

  if (layout === 'text-image' || layout === 'full-bleed-media') {
    return (
      <div className="envision-slide__grid envision-slide__grid--media">
        <div style={{ display: 'grid', gap: '1.15rem' }}>
          {slide.eyebrow && <p className="envision-slide__eyebrow">{slide.eyebrow}</p>}
          {slide.title && <h2 className="envision-slide__title">{slide.title}</h2>}
          {slide.subtitle && <p className="envision-slide__subtitle">{slide.subtitle}</p>}
          {slide.body && <p className="envision-slide__body">{slide.body}</p>}
          {!!bullets.length && (
            <ul className="envision-slide__bullets">
              {bullets.map((bullet, index) => <li key={`${bullet}-${index}`}>{bullet}</li>)}
            </ul>
          )}
          {renderActions(slide.actions)}
          {fragments}
        </div>
        <div className="envision-slide__media-frame">
          {slide.iframe?.src
            ? <iframe src={slide.iframe.src} title={slide.iframe.title || slide.title || 'Embedded content'} allow="autoplay; fullscreen" />
            : mediaNode}
        </div>
      </div>
    );
  }

  return (
    <>
      {slide.eyebrow && <p className="envision-slide__eyebrow">{slide.eyebrow}</p>}
      {slide.title && <h2 className="envision-slide__title">{slide.title}</h2>}
      {slide.subtitle && <p className="envision-slide__subtitle">{slide.subtitle}</p>}
      {slide.body && <p className="envision-slide__body">{slide.body}</p>}
      {!!bullets.length && (
        <ul className="envision-slide__bullets">
          {bullets.map((bullet, index) => <li key={`${bullet}-${index}`}>{bullet}</li>)}
        </ul>
      )}
      {renderActions(slide.actions)}
      {fragments}
    </>
  );
}

function Slide({ slide }) {
  const sectionProps = getSectionProps(slide);
  const verticalSlides = coerceArray(slide.verticalSlides);

  if (verticalSlides.length) {
    return (
      <section>
        <Slide slide={{ ...slide, verticalSlides: [] }} />
        {verticalSlides.map((child, index) => (
          <Slide key={`${child.id || child.title || 'vertical'}-${index}`} slide={child} />
        ))}
      </section>
    );
  }

  return (
    <section id={slide.id || undefined} {...sectionProps}>
      <div className="envision-slide" data-layout={slide.layout || 'statement'}>
        <div className="envision-slide__card">
          {renderSlideContent(slide)}
          {slide.notes && <aside className="notes">{slide.notes}</aside>}
        </div>
      </div>
    </section>
  );
}

export default function RevealPresentation({ portalId, presentation = {} }) {
  const revealRef = useRef(null);
  const deckRef = useRef(null);

  const themeStyle = useMemo(
    () => THEME_VARS[presentation.theme] || THEME_VARS.black,
    [presentation.theme]
  );

  useEffect(() => {
    if (!revealRef.current) return undefined;

    const deck = new Reveal(revealRef.current, {
      controls: presentation.controls ?? true,
      progress: presentation.progress ?? true,
      slideNumber: presentation.slideNumber ?? false,
      transition: presentation.transition || 'slide',
      backgroundTransition: presentation.backgroundTransition || 'fade',
      autoAnimate: presentation.autoAnimate ?? true,
      view: presentation.scrollView ? 'scroll' : undefined,
      scrollProgress: presentation.scrollView ? true : undefined,
      scrollSnap: presentation.scrollView ? (presentation.scrollSnap || 'mandatory') : undefined,
      showNotes: presentation.showNotes ?? false,
      autoSlide: presentation.autoSlide ?? 0,
      loop: presentation.loop ?? false,
      hash: presentation.hash ?? false,
      controlsTutorial: true,
      center: true,
      plugins: [RevealNotes, RevealHighlight],
    });

    deck.initialize().then(() => {
      track.event(portalId, 'presentation_open', {
        title: presentation.title || null,
        totalSlides: deck.getTotalSlides(),
      });
    });

    deck.on('slidechanged', (event) => {
      const title = event.currentSlide?.querySelector('.envision-slide__title')?.textContent || null;
      track.event(portalId, 'slide_view', {
        indexh: event.indexh,
        indexv: event.indexv,
        title,
      });
    });

    deckRef.current = deck;

    return () => {
      deck.destroy();
      deckRef.current = null;
    };
  }, [portalId, presentation]);

  return (
    <div className="envision-reveal-shell" style={themeStyle}>
      <div className="reveal envision-reveal" ref={revealRef}>
        <div className="slides">
          {coerceArray(presentation.slides).map((slide, index) => (
            <Slide key={`${slide.id || slide.title || 'slide'}-${index}`} slide={slide} />
          ))}
        </div>
      </div>
      {presentation.customCss ? <style>{presentation.customCss}</style> : null}
    </div>
  );
}
