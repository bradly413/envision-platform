import React from 'react'
import HeroSection from '../../../client-portal/src/components/Hero/HeroSection'
import BrandSection from '../../../client-portal/src/components/ScrollSections/BrandSection'
import LogoSection from '../../../client-portal/src/components/ScrollSections/LogoSection'
import ColorSection from '../../../client-portal/src/components/ScrollSections/ColorSection'
import TypographySection from '../../../client-portal/src/components/ScrollSections/TypographySection'
import MotionSection from '../../../client-portal/src/components/Experience/MotionSection'
import {resolveExperience} from '../../../client-portal/src/lib/experience'
import {AnimatePresence, motion, useReducedMotion} from 'framer-motion'

const STYLE_TO_EXPERIENCE = {
  cinematic: 'cinematic-editorial',
  editorial: 'cinematic-editorial',
  luxury: 'luxury-minimal',
  bold: 'bold-campaign',
  minimal: 'modern-tech',
}

const STYLE_TO_TEMPLATE = {
  cinematic: 'brand-reveal-v1',
  editorial: 'brand-reveal-v1',
  luxury: 'brand-reveal-minimal',
  bold: 'full-identity',
  minimal: 'brand-reveal-minimal',
}

const PRESENTATION_THEMES = {
  black: {
    background: '#070A12',
    surface: 'rgba(255,255,255,0.04)',
    border: 'rgba(255,255,255,0.08)',
    text: '#E5E7EB',
    accent: '#8AB4FF',
  },
  moon: {
    background: '#09111F',
    surface: 'rgba(255,255,255,0.04)',
    border: 'rgba(255,255,255,0.08)',
    text: '#DBE3F0',
    accent: '#6EA8FF',
  },
  serif: {
    background: '#E7DDCB',
    surface: 'rgba(35,23,15,0.06)',
    border: 'rgba(35,23,15,0.12)',
    text: '#43352D',
    accent: '#87542E',
  },
  simple: {
    background: '#F8FAFC',
    surface: 'rgba(15,23,42,0.04)',
    border: 'rgba(15,23,42,0.08)',
    text: '#0F172A',
    accent: '#2563EB',
  },
}

function rgba(hex, alpha) {
  const value = String(hex || '').replace('#', '')
  if (value.length !== 6) return `rgba(255,255,255,${alpha})`
  const r = Number.parseInt(value.slice(0, 2), 16)
  const g = Number.parseInt(value.slice(2, 4), 16)
  const b = Number.parseInt(value.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

const BACKGROUND_OVERRIDES = {
  aurora: {
    base: '#07111f',
    gradientA: 'rgba(30, 64, 175, 0.34)',
    gradientB: 'rgba(16, 185, 129, 0.24)',
    gradientC: 'rgba(244, 114, 182, 0.18)',
    deckTheme: 'moon',
  },
  softaurora: {
    base: '#09111f',
    gradientA: 'rgba(96, 165, 250, 0.26)',
    gradientB: 'rgba(244, 114, 182, 0.18)',
    gradientC: 'rgba(192, 132, 252, 0.16)',
    deckTheme: 'moon',
  },
  lightrays: {
    base: '#0b1020',
    gradientA: 'rgba(250, 204, 21, 0.24)',
    gradientB: 'rgba(59, 130, 246, 0.2)',
    gradientC: 'rgba(255, 255, 255, 0.12)',
    deckTheme: 'black',
  },
  gridscan: {
    base: '#0a1020',
    gradientA: 'rgba(37, 99, 235, 0.2)',
    gradientB: 'rgba(34, 197, 94, 0.14)',
    gradientC: 'rgba(14, 165, 233, 0.16)',
    deckTheme: 'simple',
  },
  colorbends: {
    base: '#140b16',
    gradientA: 'rgba(236, 72, 153, 0.24)',
    gradientB: 'rgba(249, 115, 22, 0.18)',
    gradientC: 'rgba(99, 102, 241, 0.18)',
    deckTheme: 'black',
  },
  threads: {
    base: '#090911',
    gradientA: 'rgba(168, 85, 247, 0.18)',
    gradientB: 'rgba(59, 130, 246, 0.18)',
    gradientC: 'rgba(16, 185, 129, 0.12)',
    deckTheme: 'black',
  },
}

const COMPONENT_EFFECT_OVERRIDES = {
  'scroll-stack': {
    sectionEffects: {
      about: ['sticky-story'],
      deliverables: ['parallax-panels'],
    },
    heroEffects: ['shader-background', 'title-reveal', 'slow-zoom'],
    template: 'full-identity',
  },
  'spotlight-card': {
    sectionEffects: {
      deliverables: ['magnetic-cards'],
      cta: ['magnetic-cta'],
    },
  },
  'animated-list': {
    sectionEffects: {
      about: ['editorial-rise'],
      deliverables: ['glass-panel'],
    },
    template: 'brand-reveal-minimal',
  },
}

const ANIMATION_EFFECT_OVERRIDES = {
  'animated-content': {
    sectionEffects: {
      about: ['parallax-panels'],
      typography: ['headline-shift'],
    },
    heroEffects: ['shader-background', 'title-reveal'],
  },
  orbitimages: {
    sectionEffects: {
      deliverables: ['glass-panel'],
      palette: ['color-glow'],
    },
  },
  'star-border': {
    sectionEffects: {
      deliverables: ['color-glow'],
      cta: ['magnetic-cta'],
    },
  },
}

function getPlanSubject(plan, client) {
  return cleanText(
    client?.name ||
    client?.company ||
    plan?.briefSubject ||
    plan?.fetchedContext?.client ||
    ''
  )
}

const TEXT_EFFECT_OVERRIDES = {
  blurtext: {
    heroEffects: ['glass-panel', 'title-reveal'],
    deckTheme: 'moon',
  },
  splittext: {
    heroEffects: ['title-reveal', 'slow-zoom'],
    deckTheme: 'black',
  },
  rotatingtext: {
    heroEffects: ['title-reveal', 'camera-zoom'],
    deckTheme: 'simple',
  },
  shinytext: {
    heroEffects: ['glass-panel', 'title-reveal'],
    deckTheme: 'serif',
  },
}

function cleanText(value = '') {
  return String(value || '').replace(/\s+/g, ' ').trim()
}

function normalizeAssetKey(value = '') {
  return cleanText(value).toLowerCase().replace(/[^a-z0-9]+/g, '')
}

function mergeUnique(base = [], extra = []) {
  return [...new Set([...(base || []), ...(extra || [])])]
}

function mergeSectionEffects(base = {}, override = {}) {
  const next = {...(base || {})}

  for (const [key, value] of Object.entries(override || {})) {
    next[key] = mergeUnique(next[key] || [], value || [])
  }

  return next
}

function getSelectedAsset(plan, category) {
  return (plan?.selectedAssets || []).find((item) => item.category === category) || null
}

function getFirstHexColor(value = '') {
  const match = String(value || '').match(/#(?:[0-9a-fA-F]{3}){1,2}/)
  return match ? match[0] : null
}

function resolveAssetDrivenTheme(plan, styleMode) {
  const backgroundAsset = getSelectedAsset(plan, 'backgrounds')
  const textAsset = getSelectedAsset(plan, 'text-animations')
  const animationAsset = getSelectedAsset(plan, 'animations')
  const componentAsset = getSelectedAsset(plan, 'components')

  const backgroundOverride = BACKGROUND_OVERRIDES[normalizeAssetKey(backgroundAsset?.id || backgroundAsset?.title || '')] || {}
  const textOverride = TEXT_EFFECT_OVERRIDES[normalizeAssetKey(textAsset?.id || textAsset?.title || '')] || {}
  const animationOverride = ANIMATION_EFFECT_OVERRIDES[normalizeAssetKey(animationAsset?.id || animationAsset?.title || '')] || {}
  const componentOverride = COMPONENT_EFFECT_OVERRIDES[normalizeAssetKey(componentAsset?.id || componentAsset?.title || '')] || {}

  return {
    backgroundOverride,
    textOverride,
    animationOverride,
    componentOverride,
  }
}

function getReferenceDrivenDirection(plan, styleMode) {
  const libraryMatches = Array.isArray(plan?.fetchedContext?.libraryMatches)
    ? plan.fetchedContext.libraryMatches
    : []

  const tags = new Set()
  const titles = []

  libraryMatches.forEach((item) => {
    titles.push(cleanText(item?.title || ''))
    ;(item?.tags || []).forEach((tag) => tags.add(cleanText(tag).toLowerCase()))
    if (item?.libraryType) tags.add(cleanText(item.libraryType).toLowerCase())
  })

  const has = (value) => tags.has(value)
  const titleText = titles.join(' ').toLowerCase()
  const includesTitle = (pattern) => pattern.test(titleText)

  const base = {
    template: null,
    preset: null,
    palette: null,
    heroEffects: [],
    sectionEffects: {},
    framing: '',
  }

  if (has('luxury') || includesTitle(/chanel|luxury|atelier|material/)) {
    return {
      ...base,
      template: 'brand-reveal-minimal',
      preset: 'luxury-minimal',
      palette: [
        {name: 'Graphite', hex: '#141414', role: 'Primary field'},
        {name: 'Champagne', hex: '#D6C6A5', role: 'Luxury accent'},
        {name: 'Porcelain', hex: '#F5F1E8', role: 'Soft contrast'},
        {name: 'Bronze', hex: '#8E6B3E', role: 'Material cue'},
      ],
      heroEffects: ['glass-panel', 'slow-zoom'],
      sectionEffects: {
        brand: ['editorial-rise'],
        logo: ['glass-panel'],
      },
      framing: 'Luxury editorial restraint with warmer material contrast.',
    }
  }

  if (has('editorial') || has('brand-identity') || includesTitle(/editorial|poster|brand|identity/)) {
    return {
      ...base,
      template: styleMode === 'minimal' ? 'brand-reveal-minimal' : 'brand-reveal-v1',
      preset: 'cinematic-editorial',
      palette: [
        {name: 'Night Ink', hex: '#0B1120', role: 'Base contrast'},
        {name: 'Fog', hex: '#CBD5E1', role: 'Typography support'},
        {name: 'Slate', hex: '#334155', role: 'Structure'},
        {name: 'Signal Blue', hex: '#60A5FA', role: 'Editorial accent'},
      ],
      heroEffects: ['title-reveal'],
      sectionEffects: {
        brand: ['sticky-story'],
        typography: ['headline-shift'],
      },
      framing: 'Poster-like editorial pacing with stronger typography and whitespace.',
    }
  }

  if (has('gsap') || has('motion') || has('parallax') || has('cinematic') || includesTitle(/gsap|scroll|motion|dora|dribbble/)) {
    return {
      ...base,
      template: styleMode === 'bold' ? 'full-identity' : 'brand-reveal-v1',
      preset: styleMode === 'bold' ? 'bold-campaign' : 'cinematic-editorial',
      heroEffects: ['title-reveal', 'slow-zoom', 'shader-background'],
      sectionEffects: {
        about: ['sticky-story'],
        deliverables: ['parallax-panels'],
        cta: ['magnetic-cta'],
      },
      framing: 'Motion-led composition with scrollytelling beats and depth cues.',
    }
  }

  if (has('systems') || has('product-storytelling') || includesTitle(/vionaro|grass|system|product/)) {
    return {
      ...base,
      template: 'full-identity',
      preset: 'modern-tech',
      palette: [
        {name: 'Carbon', hex: '#111111', role: 'Primary field'},
        {name: 'Steel', hex: '#6B7280', role: 'System tone'},
        {name: 'Cloud', hex: '#E5E7EB', role: 'Typography contrast'},
        {name: 'Precision Blue', hex: '#3B82F6', role: 'Interaction accent'},
      ],
      heroEffects: ['title-reveal'],
      sectionEffects: {
        brand: ['sticky-story'],
        palette: ['color-glow'],
        deliverables: ['glass-panel'],
      },
      framing: 'System-led storytelling with industrial clarity and modular chapters.',
    }
  }

  return base
}

const SECTION_FRAME_PRESETS = {
  'sticky-story': {
    shell: {
      maxWidth: 1240,
      padding: '34px 34px 22px',
      borderRadius: 36,
      border: '1px solid rgba(255,255,255,0.08)',
      background: 'linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))',
      boxShadow: '0 26px 80px rgba(15,23,42,0.26)',
    },
    accent: 'bar',
  },
  'parallax-panels': {
    shell: {
      maxWidth: 1260,
      padding: '28px',
      borderRadius: 40,
      border: '1px solid rgba(255,255,255,0.08)',
      background: 'linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))',
      boxShadow: '0 34px 90px rgba(2,6,23,0.28)',
    },
    inner: {
      transform: 'translate3d(0, -10px, 0)',
    },
    accent: 'glow',
  },
  'glass-panel': {
    shell: {
      maxWidth: 1180,
      padding: '28px',
      borderRadius: 34,
      border: '1px solid rgba(255,255,255,0.1)',
      background: 'rgba(255,255,255,0.05)',
      backdropFilter: 'blur(18px)',
      boxShadow: '0 30px 90px rgba(2,6,23,0.22)',
    },
    accent: 'glow',
  },
  'color-glow': {
    shell: {
      maxWidth: 1200,
      padding: '24px',
      borderRadius: 34,
      border: '1px solid rgba(255,255,255,0.08)',
      background: 'rgba(255,255,255,0.04)',
      boxShadow: '0 0 0 1px rgba(255,255,255,0.02), 0 0 60px rgba(96,165,250,0.14)',
    },
    accent: 'glow',
  },
  'headline-shift': {
    shell: {
      maxWidth: 1120,
      padding: '24px 18px 0',
    },
    inner: {
      transform: 'translate3d(16px, 0, 0)',
    },
    accent: 'rule',
  },
  'magnetic-cards': {
    shell: {
      maxWidth: 1260,
      padding: '22px',
      borderRadius: 38,
      border: '1px solid rgba(255,255,255,0.08)',
      background: 'radial-gradient(circle at 18% 16%, rgba(255,255,255,0.08), rgba(255,255,255,0.02) 44%)',
      boxShadow: '0 28px 90px rgba(2,6,23,0.24)',
    },
    accent: 'bar',
  },
  'editorial-rise': {
    shell: {
      maxWidth: 1120,
      padding: '18px 8px 0',
    },
    inner: {
      transform: 'translate3d(0, -12px, 0)',
    },
    accent: 'rule',
  },
  'magnetic-cta': {
    shell: {
      maxWidth: 1220,
      padding: '22px',
      borderRadius: 38,
      border: '1px solid rgba(255,255,255,0.08)',
      background: 'linear-gradient(135deg, rgba(255,255,255,0.07), rgba(255,255,255,0.02))',
      boxShadow: '0 34px 110px rgba(2,6,23,0.28)',
    },
    accent: 'ring',
  },
}

function resolvePreviewAccent(content, experience, deckTheme) {
  const paletteHex = content?.colors?.palette?.find((item) => item?.hex)?.hex
  const fontHex = getFirstHexColor(deckTheme?.accent)
  return (
    paletteHex ||
    fontHex ||
    getFirstHexColor(experience?.background?.gradientA) ||
    '#60A5FA'
  )
}

function PortalSectionFrame({sectionKey, effectName, accentColor, index = 0, children}) {
  const preset = SECTION_FRAME_PRESETS[effectName] || {}
  const reduceMotion = useReducedMotion()
  const frameMotion = getFrameMotion(effectName, index, reduceMotion)
  const shellStyle = {
    position: 'relative',
    width: 'min(100%, 1320px)',
    margin: '0 auto',
    ...preset.shell,
  }
  const innerStyle = {
    position: 'relative',
    zIndex: 1,
    ...preset.inner,
  }

  return (
    <div style={{padding: sectionKey === 'cta' ? '18px 24px 34px' : '18px 24px'}}>
      <motion.div layout initial={frameMotion.initial} animate={frameMotion.animate} transition={frameMotion.transition} style={shellStyle}>
        {preset.accent === 'bar' ? (
          <motion.div
            aria-hidden="true"
            initial={reduceMotion ? false : {scaleY: 0.3, opacity: 0}}
            animate={{scaleY: 1, opacity: 0.9}}
            transition={{duration: reduceMotion ? 0.01 : 0.5, delay: reduceMotion ? 0 : 0.12}}
            style={{
              position: 'absolute',
              left: 18,
              top: 18,
              bottom: 18,
              width: 4,
              borderRadius: 999,
              background: accentColor,
              transformOrigin: 'top center',
            }}
          />
        ) : null}
        {preset.accent === 'rule' ? (
          <motion.div
            aria-hidden="true"
            initial={reduceMotion ? false : {scaleX: 0.4, opacity: 0}}
            animate={{scaleX: 1, opacity: 0.8}}
            transition={{duration: reduceMotion ? 0.01 : 0.46, delay: reduceMotion ? 0 : 0.1}}
            style={{
              position: 'absolute',
              left: 20,
              right: 20,
              top: 0,
              height: 1,
              background: `linear-gradient(90deg, ${accentColor}, transparent 72%)`,
              transformOrigin: 'left center',
            }}
          />
        ) : null}
        {preset.accent === 'glow' ? (
          <motion.div
            aria-hidden="true"
            initial={reduceMotion ? false : {opacity: 0, scale: 0.96}}
            animate={{opacity: 0.9, scale: 1}}
            transition={{duration: reduceMotion ? 0.01 : 0.56, delay: reduceMotion ? 0 : 0.08}}
            style={{
              position: 'absolute',
              inset: -1,
              borderRadius: shellStyle.borderRadius || 32,
              background: `radial-gradient(circle at 16% 18%, ${accentColor}24 0%, transparent 36%)`,
              pointerEvents: 'none',
            }}
          />
        ) : null}
        {preset.accent === 'ring' ? (
          <motion.div
            aria-hidden="true"
            initial={reduceMotion ? false : {opacity: 0, scale: 0.98}}
            animate={{opacity: 1, scale: 1}}
            transition={{duration: reduceMotion ? 0.01 : 0.48, delay: reduceMotion ? 0 : 0.12}}
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: shellStyle.borderRadius || 32,
              boxShadow: `inset 0 0 0 1px ${accentColor}33, 0 0 0 1px rgba(255,255,255,0.02)`,
              pointerEvents: 'none',
            }}
          />
        ) : null}
        <motion.div layout style={innerStyle}>{children}</motion.div>
      </motion.div>
    </div>
  )
}

function getPresentationProfile(plan, deck, theme) {
  const {backgroundOverride, textOverride, animationOverride, componentOverride} = resolveAssetDrivenTheme(plan, 'cinematic')
  const backgroundAsset = getSelectedAsset(plan, 'backgrounds')
  const textAsset = getSelectedAsset(plan, 'text-animations')
  const componentAsset = getSelectedAsset(plan, 'components')
  const animationAsset = getSelectedAsset(plan, 'animations')

  return {
    accent: backgroundOverride.gradientA ? getFirstHexColor(backgroundOverride.gradientA) || theme.accent : theme.accent,
    ambientGlow: Boolean(backgroundAsset || animationAsset),
    headlineScale: textAsset ? 1.08 : 1,
    mediaBias: componentAsset?.id === 'scroll-stack' ? 'editorial' : componentOverride.template === 'full-identity' ? 'immersive' : 'balanced',
    titleCase: textOverride.deckTheme === 'serif' ? 'editorial' : 'default',
    overlay: backgroundOverride.gradientB || backgroundOverride.gradientA || 'rgba(37,99,235,0.18)',
    shadowColor: backgroundOverride.gradientA || 'rgba(37,99,235,0.2)',
    borderTone: backgroundOverride.gradientC || `${theme.accent}22`,
    transitionChip: deck.transition || 'slide',
  }
}

function getSlideSurface(index, slide, theme, profile) {
  const heroSlide = index === 0
  const hasMedia = Boolean(slide.media)
  const editorialLayout = profile.mediaBias === 'editorial' && (heroSlide || hasMedia)
  const immersiveLayout = profile.mediaBias === 'immersive' && !hasMedia

  return {
    gridTemplateColumns: hasMedia ? (editorialLayout ? '1.08fr 0.92fr' : '1fr 0.86fr') : '1fr',
    minHeight: heroSlide ? 520 : 420,
    padding: heroSlide ? 36 : 28,
    borderRadius: heroSlide ? 34 : 28,
    background: getSlideBackground(slide, theme),
    overlayBackground: heroSlide
      ? `radial-gradient(circle at 14% 20%, ${profile.overlay} 0%, transparent 34%)`
      : `linear-gradient(180deg, transparent 0%, ${profile.overlay} 100%)`,
    titleSize: heroSlide ? 'clamp(38px, 5vw, 66px)' : 'clamp(30px, 4vw, 54px)',
    eyebrowSpacing: profile.titleCase === 'editorial' ? '.18em' : '.14em',
    contentMaxWidth: immersiveLayout ? 860 : 680,
    bulletMarkerRadius: editorialLayout ? 2 : 999,
    bulletMarkerSize: editorialLayout ? 12 : 8,
    mediaShell: editorialLayout
      ? {
          background: 'linear-gradient(160deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))',
          boxShadow: '0 24px 70px rgba(2,6,23,0.22)',
        }
      : {
          background: 'rgba(255,255,255,0.04)',
        },
  }
}

function getRegionMotion(isSelected, reduceMotion) {
  if (reduceMotion) {
    return {
      animate: {scale: 1, y: 0},
      transition: {duration: 0.01},
      whileHover: {},
    }
  }

  return {
    animate: {
      scale: isSelected ? 1.006 : 1,
      y: isSelected ? -2 : 0,
    },
    transition: {
      duration: 0.26,
      ease: [0.22, 1, 0.36, 1],
    },
    whileHover: {
      y: isSelected ? -2 : -4,
    },
  }
}

function getFrameMotion(effectName, index, reduceMotion) {
  if (reduceMotion) {
    return {
      initial: false,
      animate: {opacity: 1, y: 0, scale: 1},
      transition: {duration: 0.01},
    }
  }

  const distanceMap = {
    'sticky-story': 30,
    'parallax-panels': 40,
    'glass-panel': 26,
    'color-glow': 22,
    'headline-shift': 18,
    'magnetic-cards': 34,
    'editorial-rise': 28,
    'magnetic-cta': 36,
  }

  const distance = distanceMap[effectName] || 24

  return {
    initial: {opacity: 0, y: distance, scale: 0.985},
    animate: {opacity: 1, y: 0, scale: 1},
    transition: {
      duration: 0.62,
      delay: 0.08 + index * 0.04,
      ease: [0.16, 1, 0.3, 1],
    },
  }
}

function getSlideMotion(index, reduceMotion) {
  if (reduceMotion) {
    return {
      initial: false,
      animate: {opacity: 1, y: 0, scale: 1},
      transition: {duration: 0.01},
    }
  }

  return {
    initial: {opacity: 0, y: 34, scale: 0.985},
    animate: {opacity: 1, y: 0, scale: 1},
    transition: {
      duration: 0.6,
      delay: 0.06 + index * 0.05,
      ease: [0.16, 1, 0.3, 1],
    },
  }
}

function AnimatedAssetStrip({items = [], tone = {}, compact = false}) {
  if (!items.length) return null

  return (
    <div style={{display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: compact ? 'flex-end' : 'flex-start'}}>
      <AnimatePresence initial={false}>
        {items.map((item, index) => (
          <motion.span
            key={item.id}
            layout
            initial={{opacity: 0, y: 10, scale: 0.96}}
            animate={{opacity: 1, y: 0, scale: 1}}
            exit={{opacity: 0, y: -8, scale: 0.96}}
            transition={{duration: 0.24, delay: index * 0.03, ease: [0.22, 1, 0.36, 1]}}
            style={{
              padding: compact ? '6px 10px' : '7px 10px',
              borderRadius: 999,
              background: tone.background || 'rgba(2,6,23,0.74)',
              border: tone.border || '1px solid rgba(255,255,255,0.08)',
              color: tone.color || '#E2E8F0',
              fontSize: compact ? 11 : 11,
              fontWeight: 700,
              backdropFilter: 'blur(8px)',
            }}
          >
            {item.title}
          </motion.span>
        ))}
      </AnimatePresence>
    </div>
  )
}

function SelectableRegion({id, label, selectedNodeId, onSelectNode, children}) {
  const isSelected = selectedNodeId === id
  const reduceMotion = useReducedMotion()
  const regionMotion = getRegionMotion(isSelected, reduceMotion)

  return (
    <motion.div
      layout
      onClick={() => onSelectNode?.(id)}
      animate={regionMotion.animate}
      transition={regionMotion.transition}
      whileHover={regionMotion.whileHover}
      style={{
        position: 'relative',
        outline: isSelected ? '2px solid rgba(96,165,250,0.95)' : '1px solid transparent',
        outlineOffset: isSelected ? -2 : 0,
        borderRadius: 28,
        cursor: onSelectNode ? 'pointer' : 'default',
        transition: 'outline-color .18s ease, transform .18s ease',
      }}
    >
      {onSelectNode ? (
        <motion.div
          layout
          style={{
            position: 'absolute',
            top: 16,
            left: 16,
            zIndex: 4,
            padding: '6px 9px',
            borderRadius: 999,
            background: isSelected ? 'rgba(37,99,235,0.92)' : 'rgba(2,6,23,0.72)',
            border: isSelected ? '1px solid rgba(147,197,253,0.65)' : '1px solid rgba(255,255,255,0.08)',
            color: '#F8FAFC',
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '.08em',
            textTransform: 'uppercase',
            backdropFilter: 'blur(8px)',
          }}
        >
          {label}
        </motion.div>
      ) : null}
      {children}
    </motion.div>
  )
}

function mapStyleModeToExperience(styleMode = 'cinematic') {
  return STYLE_TO_EXPERIENCE[styleMode] || STYLE_TO_EXPERIENCE.cinematic
}

function mapStyleModeToTemplate(styleMode = 'cinematic') {
  return STYLE_TO_TEMPLATE[styleMode] || STYLE_TO_TEMPLATE.cinematic
}

function buildPortalContent(preview, plan, client, styleMode) {
  const content = preview && typeof preview === 'object' ? preview : {}
  const subject = getPlanSubject(plan, client) || 'Brand'
  const title = cleanText(content.title || content.hero?.headline || content.hero?.title || subject)
  const summary = cleanText(content.summary || plan?.summary || plan?.visualThesis || 'A premium brand direction rendered as an immersive portal.')
  const brandBody = cleanText(content.brand?.positioning || plan?.visualDirection?.join(' ') || summary)
  const structure = Array.isArray(plan?.structure) ? plan.structure : []
  const {componentOverride, textOverride} = resolveAssetDrivenTheme(plan, styleMode)
  const referenceDirection = getReferenceDrivenDirection(plan, styleMode)
  const templateFromAssets = componentOverride.template

  return {
    ...content,
    portalTemplate: content.portalTemplate || templateFromAssets || referenceDirection.template || mapStyleModeToTemplate(styleMode),
    experience: {
      preset: referenceDirection.preset || mapStyleModeToExperience(styleMode),
      ...(content.experience || {}),
    },
    hero: {
      eyebrow: content.hero?.eyebrow || `Builder preview · ${plan?.outputMode || 'portal'}`,
      headline: content.hero?.headline || title,
      subheadline: content.hero?.subheadline || cleanText(
        textOverride.deckTheme
          ? `${plan?.visualThesis || summary} Tuned for ${textAssetLabel(plan)} pacing.`
          : plan?.visualThesis || summary
      ),
      intro: content.hero?.intro || cleanText([summary, referenceDirection.framing].filter(Boolean).join(' ')),
      ...content.hero,
    },
    brand: {
      eyebrow: content.brand?.eyebrow || '01 — Brand strategy',
      headline: content.brand?.headline || '',
      positioning: content.brand?.positioning || brandBody,
      pillars: Array.isArray(content.brand?.pillars) && content.brand.pillars.length
        ? content.brand.pillars
        : [],
      ...content.brand,
    },
    logo: {
      eyebrow: content.logo?.eyebrow || '02 — Logo system',
      headline: content.logo?.headline || '',
      rationale: content.logo?.rationale || '',
      variants: content.logo?.variants || [],
      clearance: content.logo?.clearance || '',
      animation: content.logo?.animation || '',
      ...content.logo,
    },
    colors: {
      eyebrow: content.colors?.eyebrow || '03 — Color palette',
      headline: content.colors?.headline || '',
      palette: Array.isArray(content.colors?.palette) && content.colors.palette.length
        ? content.colors.palette
        : [],
      ...content.colors,
    },
    typography: {
      eyebrow: content.typography?.eyebrow || '04 — Typography',
      headline: content.typography?.headline || '',
      fonts: Array.isArray(content.typography?.fonts) && content.typography.fonts.length
        ? content.typography.fonts
        : [],
      scaleRatio: content.typography?.scaleRatio || '',
      lineHeightGuidance: content.typography?.lineHeightGuidance || '',
      ...content.typography,
    },
    applications: Array.isArray(content.applications) ? content.applications : [],
    sectionSequence: Array.isArray(content.sectionSequence) && content.sectionSequence.length
      ? content.sectionSequence
      : ['hero', 'brand', 'logo', 'colors', 'typography', 'applications', 'cta'],
    cta: {
      eyebrow: content.cta?.eyebrow || 'Decision',
      headline: content.cta?.headline || '',
      body: content.cta?.body || '',
      secondaryButtonText: content.cta?.secondaryButtonText || '',
      microcopy: content.cta?.microcopy || '',
      ...content.cta,
    },
  }
}

function buildPortalExperience(content, styleMode) {
  const resolved = resolveExperience(content.experience || {preset: mapStyleModeToExperience(styleMode)})
  const {backgroundOverride, textOverride, animationOverride, componentOverride} = resolveAssetDrivenTheme({selectedAssets: content.__selectedAssets || []}, styleMode)
  const referenceDirection = getReferenceDrivenDirection(content.__plan || null, styleMode)

  return {
    ...resolved,
    background: {
      ...resolved.background,
      ...backgroundOverride,
    },
    heroEffects: mergeUnique(
      resolved.heroEffects,
      mergeUnique(
        mergeUnique(
          mergeUnique(textOverride.heroEffects || [], animationOverride.heroEffects || []),
          componentOverride.heroEffects || []
        ),
        referenceDirection.heroEffects || []
      )
    ),
    sectionEffects: mergeSectionEffects(
      mergeSectionEffects(
        mergeSectionEffects(resolved.sectionEffects, animationOverride.sectionEffects || {}),
        componentOverride.sectionEffects || {}
      ),
      referenceDirection.sectionEffects || {}
    ),
  }
}

function getPortalVariant(content, styleMode) {
  const {componentOverride} = resolveAssetDrivenTheme({selectedAssets: content.__selectedAssets || []}, styleMode)
  const referenceDirection = getReferenceDrivenDirection(content.__plan || null, styleMode)
  const assetTemplate = componentOverride.template
  const templateId = assetTemplate || content.portalTemplate || referenceDirection.template || mapStyleModeToTemplate(styleMode)
  if (templateId === 'brand-reveal-minimal') return 'minimal'
  if (templateId === 'full-identity') return 'identity'
  return 'default'
}

function textAssetLabel(plan) {
  return getSelectedAsset(plan, 'text-animations')?.title || 'editorial'
}

function getPortalPreviewDirection(styleMode, accentColor) {
  const base = {
    accent: accentColor,
    heroRadius: 34,
    cardRadius: 28,
    shellBorder: '1px solid rgba(255,255,255,0.08)',
    cardBorder: '1px solid rgba(255,255,255,0.08)',
    shellBackground: 'linear-gradient(180deg, rgba(8,15,32,0.96), rgba(4,10,22,0.98))',
    cardBackground: 'linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))',
    heroColumns: '1.14fr 0.86fr',
    moduleColumns: '1.06fr 0.94fr',
    heroMinHeight: 430,
    titleSize: 'clamp(52px, 6vw, 88px)',
    subSize: 'clamp(22px, 2.8vw, 40px)',
    descriptionMaxWidth: 540,
    floatingWordOpacity: 0.12,
    railTone: 'rgba(255,255,255,0.08)',
  }

  if (styleMode === 'editorial') {
    return {
      ...base,
      shellBackground: 'linear-gradient(140deg, rgba(27,23,20,0.98), rgba(12,13,18,0.98))',
      cardBackground: 'linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))',
      heroColumns: '0.98fr 1.02fr',
      moduleColumns: '0.82fr 1.18fr',
      heroMinHeight: 410,
      titleSize: 'clamp(46px, 5.4vw, 76px)',
      subSize: 'clamp(20px, 2.6vw, 34px)',
      heroRadius: 18,
      cardRadius: 18,
      shellBorder: '1px solid rgba(255,255,255,0.04)',
      cardBorder: '1px solid rgba(255,255,255,0.05)',
      floatingWordOpacity: 0.08,
      railTone: `${accentColor}44`,
    }
  }

  if (styleMode === 'luxury') {
    return {
      ...base,
      shellBackground: 'linear-gradient(145deg, rgba(48,35,18,0.96), rgba(20,16,14,0.98))',
      cardBackground: 'linear-gradient(180deg, rgba(245,225,180,0.07), rgba(255,255,255,0.02))',
      heroColumns: '1.08fr 0.92fr',
      moduleColumns: 'repeat(3, minmax(0, 1fr))',
      heroMinHeight: 450,
      heroRadius: 30,
      cardRadius: 24,
      railTone: 'rgba(245, 208, 110, 0.16)',
    }
  }

  if (styleMode === 'bold') {
    return {
      ...base,
      shellBackground: 'linear-gradient(145deg, rgba(25,19,56,0.96), rgba(11,20,56,0.98))',
      cardBackground: 'linear-gradient(145deg, rgba(236,72,153,0.12), rgba(59,130,246,0.07))',
      heroColumns: '1fr',
      moduleColumns: '1.18fr 0.82fr',
      heroMinHeight: 390,
      titleSize: 'clamp(56px, 7vw, 96px)',
      subSize: 'clamp(18px, 2.4vw, 30px)',
      heroRadius: 36,
      cardRadius: 26,
      floatingWordOpacity: 0.14,
      railTone: `${accentColor}55`,
    }
  }

  if (styleMode === 'minimal') {
    return {
      ...base,
      shellBackground: 'linear-gradient(180deg, rgba(18,26,42,0.96), rgba(9,16,28,0.98))',
      cardBackground: 'rgba(255,255,255,0.025)',
      heroColumns: '1fr',
      moduleColumns: '1fr 1fr',
      heroMinHeight: 350,
      titleSize: 'clamp(40px, 4.8vw, 62px)',
      subSize: 'clamp(18px, 2.2vw, 26px)',
      heroRadius: 22,
      cardRadius: 18,
      shellBorder: '1px solid rgba(255,255,255,0.05)',
      cardBorder: '1px solid rgba(255,255,255,0.06)',
      floatingWordOpacity: 0.06,
      railTone: 'rgba(255,255,255,0.06)',
    }
  }

  return base
}

function PreviewSectionLabel({eyebrow, accentColor}) {
  return (
    <div style={{fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.18em', color: accentColor, marginBottom: 14}}>
      {eyebrow}
    </div>
  )
}

function PreviewBulletList({items = [], accentColor, compact = false}) {
  if (!items.length) return null

  return (
    <div style={{display: 'grid', gap: compact ? 8 : 10}}>
      {items.slice(0, compact ? 3 : 4).map((item, index) => (
        <div key={`${item.title || item}-${index}`} style={{display: 'grid', gridTemplateColumns: compact ? '10px 1fr' : '12px 1fr', gap: 10, alignItems: 'start'}}>
          <div style={{width: compact ? 6 : 8, height: compact ? 6 : 8, borderRadius: 999, background: accentColor, marginTop: compact ? 6 : 8}} />
          <div>
            <div style={{fontSize: compact ? 13 : 14, fontWeight: 700, color: '#F8FAFC', lineHeight: 1.35}}>
              {item.title || item}
            </div>
            {item.desc ? (
              <div style={{fontSize: compact ? 12 : 13, color: '#94A3B8', lineHeight: 1.6, marginTop: 4}}>
                {item.desc}
              </div>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  )
}

function PortalPreviewCard({id, label, selectedNodeId, onSelectNode, direction, children, style = {}}) {
  return (
    <SelectableRegion id={id} label={label} selectedNodeId={selectedNodeId} onSelectNode={onSelectNode}>
      <div
        style={{
          borderRadius: direction.cardRadius,
          border: direction.cardBorder,
          background: direction.cardBackground,
          padding: 24,
          minHeight: 220,
          position: 'relative',
          overflow: 'hidden',
          ...style,
        }}
      >
        {children}
      </div>
    </SelectableRegion>
  )
}

function PreviewDecisionSection({content = {}}) {
  return (
    <section data-section="builder-decision" style={{padding: '120px 32px'}}>
      <div style={{maxWidth: 960, margin: '0 auto', padding: 28, borderRadius: 28, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)'}}>
        <div style={{fontSize: 11, fontWeight: 700, letterSpacing: '.2em', textTransform: 'uppercase', color: '#6B7280', marginBottom: 18}}>
          {content.eyebrow || 'Decision'}
        </div>
        <div style={{display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: 28, alignItems: 'end'}}>
          <div>
            <h2 style={{fontSize: 'clamp(28px, 5vw, 52px)', fontWeight: 800, color: '#F9FAFB', lineHeight: 1.05, margin: '0 0 16px'}}>
              {content.headline || 'Ready for the next pass?'}
            </h2>
            <p style={{fontSize: 16, color: '#9CA3AF', lineHeight: 1.8, margin: 0}}>
              {content.body || 'Use this rendered preview to refine structure, pacing, and tone before pushing content into the live portal.'}
            </p>
          </div>
          <div style={{display: 'grid', gap: 12}}>
            {['Approve build direction', 'Patch selected sections', 'Push structured output'].map((item) => (
              <div key={item} style={{padding: '16px 18px', borderRadius: 18, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)', color: '#E5E7EB', fontSize: 14, fontWeight: 600}}>
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function PortalRenderedPreview({preview, plan, styleMode, client, selectedNodeId, onSelectNode}) {
  const content = {
    ...buildPortalContent(preview, plan, client, styleMode),
    __selectedAssets: plan?.selectedAssets || [],
    __plan: plan || null,
  }
  const experience = buildPortalExperience(content, styleMode)
  const clientName = client?.name || 'Selected client'
  const company = client?.company || ''
  const structure = Array.isArray(plan?.structure) ? plan.structure : []
  const accentColor = resolvePreviewAccent(content, experience)
  const direction = getPortalPreviewDirection(styleMode, accentColor)
  const selectedAssets = (plan?.selectedAssets || []).slice(0, 4)
  const palette = (content.colors?.palette || []).slice(0, styleMode === 'luxury' ? 5 : 4)
  const pillars = Array.isArray(content.brand?.pillars) ? content.brand.pillars : []
  const fonts = Array.isArray(content.typography?.fonts) ? content.typography.fonts : []
  const previewKey = [
    content.hero?.headline,
    content.brand?.headline,
    ...(plan?.selectedAssets || []).map((item) => item.id),
  ].join('|')

  return (
    <motion.div
      key={previewKey}
      initial={{opacity: 0, y: 18}}
      animate={{opacity: 1, y: 0}}
      transition={{duration: 0.42, ease: [0.22, 1, 0.36, 1]}}
      style={{height: 780, overflow: 'auto', position: 'relative', borderRadius: 32, border: '1px solid rgba(255,255,255,0.08)', background: experience.background?.base || '#090911'}}
    >
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          background: `
            radial-gradient(circle at 14% 18%, ${experience.background?.gradientA || 'rgba(127,29,29,0.24)'} 0%, transparent 28%),
            radial-gradient(circle at 82% 22%, ${experience.background?.gradientB || 'rgba(30,58,138,0.22)'} 0%, transparent 30%),
            radial-gradient(circle at 48% 82%, ${experience.background?.gradientC || 'rgba(146,64,14,0.16)'} 0%, transparent 30%)
          `,
          opacity: 0.92,
          pointerEvents: 'none',
        }}
      />
      <div style={{position: 'relative', zIndex: 1, padding: 22, display: 'grid', gap: 18}}>
        <SelectableRegion id="hero" label="Hero" selectedNodeId={selectedNodeId} onSelectNode={onSelectNode}>
          <div
            style={{
              minHeight: direction.heroMinHeight,
              borderRadius: direction.heroRadius,
              border: direction.shellBorder,
              background: direction.shellBackground,
              padding: styleMode === 'minimal' ? '28px 32px 34px' : '34px',
              position: 'relative',
              overflow: 'hidden',
              display: 'grid',
              gridTemplateColumns: direction.heroColumns,
              gap: 24,
              alignItems: styleMode === 'bold' || styleMode === 'minimal' ? 'start' : 'end',
            }}
          >
            <div
              aria-hidden="true"
              style={{
                position: 'absolute',
                right: styleMode === 'editorial' ? 28 : 34,
                top: styleMode === 'minimal' ? 24 : 28,
                fontSize: styleMode === 'bold' ? 'clamp(88px, 14vw, 190px)' : 'clamp(72px, 12vw, 160px)',
                fontWeight: 800,
                letterSpacing: '-0.08em',
                color: `rgba(255,255,255,${direction.floatingWordOpacity})`,
                pointerEvents: 'none',
                lineHeight: 0.85,
                textTransform: 'lowercase',
              }}
            >
              {styleMode === 'luxury' ? 'atelier' : styleMode === 'bold' ? 'impact' : styleMode === 'minimal' ? 'calm' : 'vision'}
            </div>
            <div style={{position: 'relative', zIndex: 1, display: 'grid', gap: 14, alignContent: 'space-between'}}>
              <div>
                <PreviewSectionLabel eyebrow={content.hero?.eyebrow || `Builder preview · ${plan?.outputMode || 'portal'}`} accentColor={accentColor} />
                {company ? (
                  <div style={{fontSize: 13, color: '#94A3B8', marginBottom: 14}}>
                    {company}
                  </div>
                ) : null}
                <h1 style={{fontSize: direction.titleSize, lineHeight: 0.94, fontWeight: 800, color: '#F8FAFC', margin: '0 0 14px', letterSpacing: '-0.05em', maxWidth: styleMode === 'bold' ? 980 : 760}}>
                  {content.hero?.headline || clientName}
                </h1>
                <div style={{fontSize: direction.subSize, lineHeight: 1.04, fontWeight: styleMode === 'minimal' ? 600 : 700, color: styleMode === 'luxury' ? '#FDE68A' : '#CBD5E1', marginBottom: 18, maxWidth: 720}}>
                  {content.hero?.subheadline || plan?.visualThesis || 'A stronger, more directed portal composition.'}
                </div>
                <p style={{fontSize: 15, lineHeight: 1.8, color: '#94A3B8', maxWidth: direction.descriptionMaxWidth, margin: 0}}>
                  {content.hero?.intro || plan?.summary || 'The preview should feel like a real composition system, not the same template with a new background.'}
                </p>
              </div>
              <AnimatedAssetStrip
                items={selectedAssets}
                tone={{
                  background: 'rgba(2,6,23,0.64)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: '#E2E8F0',
                }}
              />
            </div>
            <div style={{position: 'relative', zIndex: 1, display: 'grid', gap: 14, alignContent: styleMode === 'bold' ? 'start' : 'end'}}>
              {styleMode === 'bold' ? (
                <div style={{display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10}}>
                  {(content.brand?.pillars || []).slice(0, 4).map((item, index) => (
                    <div key={`${item.title}-${index}`} style={{padding: '18px 16px', borderRadius: 20, background: index % 2 === 0 ? `${accentColor}20` : 'rgba(255,255,255,0.04)', border: direction.cardBorder}}>
                      <div style={{fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.14em', color: '#94A3B8', marginBottom: 8}}>
                        {String(index + 1).padStart(2, '0')}
                      </div>
                      <div style={{fontSize: 15, fontWeight: 700, color: '#F8FAFC', lineHeight: 1.35}}>
                        {item.title}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{display: 'grid', gap: 12}}>
                  {[
                    ['Portal type', plan?.understanding?.portalType || structure[0] || 'Brand reveal'],
                    ['Focus', cleanText(plan?.visualThesis || summary || 'Directed focus')],
                    ['Motion', plan?.understanding?.motionStyle || 'Scroll-led pacing'],
                  ].map(([label, value]) => (
                    <div key={label} style={{padding: '16px 18px', borderRadius: direction.cardRadius - 6, border: direction.cardBorder, background: 'rgba(255,255,255,0.03)'}}>
                      <div style={{fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.12em', color: '#64748B', marginBottom: 8}}>{label}</div>
                      <div style={{fontSize: styleMode === 'minimal' ? 16 : 18, fontWeight: 700, color: '#F8FAFC', lineHeight: 1.35}}>{value}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </SelectableRegion>

        {(content.sectionSequence || ['brand', 'logo', 'colors', 'typography', 'applications', 'cta']).filter(s => s !== 'hero').map((sectionKey) => {
          if (sectionKey === 'brand') return (
            <div key="brand" style={{display: 'grid', gridTemplateColumns: direction.moduleColumns, gap: 18, alignItems: 'stretch'}}>
              <PortalPreviewCard id="brand" label="Brand" selectedNodeId={selectedNodeId} onSelectNode={onSelectNode} direction={direction} style={{minHeight: styleMode === 'editorial' ? 360 : 300}}>
                <PreviewSectionLabel eyebrow={content.brand?.eyebrow || '01 — Brand strategy'} accentColor={accentColor} />
                {content.brand?.headline ? (
                  <div style={{fontSize: styleMode === 'minimal' ? 28 : 34, lineHeight: 1.08, fontWeight: 800, color: '#F8FAFC', letterSpacing: '-0.04em', marginBottom: 18}}>{content.brand.headline}</div>
                ) : null}
                <div style={{display: 'grid', gridTemplateColumns: styleMode === 'luxury' ? '1fr' : '1.02fr 0.98fr', gap: 22, alignItems: 'start'}}>
                  <p style={{fontSize: 14, color: '#94A3B8', lineHeight: 1.8, margin: 0}}>{content.brand?.positioning}</p>
                  {pillars.length ? <PreviewBulletList items={pillars} accentColor={accentColor} compact={styleMode === 'minimal'} /> : null}
                </div>
              </PortalPreviewCard>
            </div>
          );

          if (sectionKey === 'logo') return (
            <div key="logo" style={{display: 'grid', gridTemplateColumns: direction.moduleColumns, gap: 18}}>
              <PortalPreviewCard id="logo" label="Logo" selectedNodeId={selectedNodeId} onSelectNode={onSelectNode} direction={direction} style={{minHeight: 300}}>
                <PreviewSectionLabel eyebrow={content.logo?.eyebrow || '02 — Logo system'} accentColor={accentColor} />
                {content.logo?.headline ? (
                  <div style={{fontSize: 30, fontWeight: 800, color: '#F8FAFC', letterSpacing: '-0.04em', marginBottom: 18}}>{content.logo.headline}</div>
                ) : null}
                <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10, marginBottom: 18}}>
                  {(content.logo?.variants?.length ? content.logo.variants.map(v => v.type) : ['Wordmark', 'Symbol', 'Lockup']).map((item, index) => (
                    <div key={item} style={{minHeight: 104, borderRadius: 18, border: direction.cardBorder, background: index === 0 ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.03)', display: 'grid', placeItems: 'center', color: index === 0 ? '#F8FAFC' : '#CBD5E1', fontWeight: 700, fontSize: 13}}>{item}</div>
                  ))}
                </div>
                {content.logo?.rationale ? <p style={{fontSize: 14, color: '#94A3B8', lineHeight: 1.75, margin: 0}}>{content.logo.rationale}</p> : null}
              </PortalPreviewCard>
            </div>
          );

          if (sectionKey === 'colors') return (
            <div key="colors" style={{display: 'grid', gridTemplateColumns: direction.moduleColumns, gap: 18}}>
              <PortalPreviewCard id="colors" label="Colors" selectedNodeId={selectedNodeId} onSelectNode={onSelectNode} direction={direction} style={{minHeight: 250}}>
                <PreviewSectionLabel eyebrow={content.colors?.eyebrow || '03 — Palette'} accentColor={accentColor} />
                {content.colors?.headline ? (
                  <div style={{fontSize: 30, fontWeight: 800, color: '#F8FAFC', letterSpacing: '-0.04em', marginBottom: 20}}>{content.colors.headline}</div>
                ) : null}
                {palette.length ? (
                  <div style={{display: 'grid', gridTemplateColumns: `repeat(${Math.min(palette.length, 4)}, minmax(0, 1fr))`, gap: 12}}>
                    {palette.map((color) => (
                      <div key={color.hex}>
                        <div style={{height: 120, borderRadius: 18, background: color.hex, border: '1px solid rgba(255,255,255,0.08)', marginBottom: 10}} />
                        <div style={{fontSize: 12, fontWeight: 700, color: '#F8FAFC'}}>{color.name}</div>
                        <div style={{fontSize: 11, color: '#94A3B8'}}>{color.role}</div>
                      </div>
                    ))}
                  </div>
                ) : <p style={{fontSize: 13, color: '#64748B'}}>No color palette generated.</p>}
              </PortalPreviewCard>
            </div>
          );

          if (sectionKey === 'typography') return (
            <div key="typography" style={{display: 'grid', gridTemplateColumns: direction.moduleColumns, gap: 18}}>
              <PortalPreviewCard id="typography" label="Type" selectedNodeId={selectedNodeId} onSelectNode={onSelectNode} direction={direction} style={{minHeight: 200}}>
                <PreviewSectionLabel eyebrow={content.typography?.eyebrow || '04 — Typography'} accentColor={accentColor} />
                {fonts.length ? (
                  <div style={{display: 'grid', gap: 16}}>
                    {fonts.slice(0, 3).map((font, index) => (
                      <div key={`${font.name}-${index}`} style={{display: 'grid', gridTemplateColumns: '0.9fr 1.1fr', gap: 16, alignItems: 'baseline'}}>
                        <div style={{fontSize: index === 0 ? 32 : 24, lineHeight: 1.04, fontWeight: 800, color: '#F8FAFC', letterSpacing: '-0.04em'}}>{font.typeface}</div>
                        <div style={{fontSize: 13, color: '#94A3B8', lineHeight: 1.65}}>{font.usage}{font.scale ? ` · ${font.scale}` : ''}</div>
                      </div>
                    ))}
                  </div>
                ) : <p style={{fontSize: 13, color: '#64748B'}}>No typography generated.</p>}
                {content.typography?.scaleRatio ? <div style={{marginTop: 12, fontSize: 11, color: '#64748B'}}>Scale: {content.typography.scaleRatio}</div> : null}
              </PortalPreviewCard>
            </div>
          );

          if (sectionKey === 'applications' && content.applications?.length) return (
            <div key="applications" style={{display: 'grid', gridTemplateColumns: direction.moduleColumns, gap: 18}}>
              <PortalPreviewCard id="applications" label="Applications" selectedNodeId={selectedNodeId} onSelectNode={onSelectNode} direction={direction} style={{minHeight: 200}}>
                <PreviewSectionLabel eyebrow="05 — Applications" accentColor={accentColor} />
                <div style={{display: 'grid', gridTemplateColumns: `repeat(${Math.min(content.applications.length, 3)}, minmax(0, 1fr))`, gap: 14}}>
                  {content.applications.map((app, i) => (
                    <div key={i} style={{padding: 16, borderRadius: 18, border: direction.cardBorder, background: 'rgba(255,255,255,0.03)'}}>
                      <div style={{fontSize: 13, fontWeight: 700, color: '#F8FAFC', marginBottom: 8}}>{app.context}</div>
                      <div style={{fontSize: 12, color: '#94A3B8', lineHeight: 1.65}}>{app.description}</div>
                    </div>
                  ))}
                </div>
              </PortalPreviewCard>
            </div>
          );

          if (sectionKey === 'cta') return (
            <div key="cta" style={{display: 'grid', gridTemplateColumns: direction.moduleColumns, gap: 18}}>
              <PortalPreviewCard id="cta" label="Decision" selectedNodeId={selectedNodeId} onSelectNode={onSelectNode} direction={direction} style={{minHeight: 200, background: `linear-gradient(145deg, ${accentColor}18, rgba(255,255,255,0.02))`}}>
                <PreviewSectionLabel eyebrow={content.cta?.eyebrow || 'Decision'} accentColor={accentColor} />
                {content.cta?.headline ? (
                  <div style={{fontSize: 28, lineHeight: 1.08, fontWeight: 800, color: '#F8FAFC', letterSpacing: '-0.04em', marginBottom: 12}}>{content.cta.headline}</div>
                ) : null}
                {content.cta?.body ? <div style={{fontSize: 14, color: '#CBD5E1', lineHeight: 1.75}}>{content.cta.body}</div> : null}
                {content.cta?.microcopy ? <div style={{marginTop: 10, fontSize: 11, color: '#64748B'}}>{content.cta.microcopy}</div> : null}
              </PortalPreviewCard>
            </div>
          );

          return null;
        })}
      </div>
    </motion.div>
  )
}

function getPresentationTheme(themeName = 'black') {
  return PRESENTATION_THEMES[themeName] || PRESENTATION_THEMES.black
}

function shouldUseCinematicPreview(outputMode, plan, preview) {
  const signals = cleanText([
    outputMode,
    plan?.title,
    plan?.briefSubject,
    plan?.summary,
    plan?.visualThesis,
    ...(plan?.structure || []),
    preview?.hero?.headline,
    preview?.hero?.subheadline,
    preview?.logo?.headline,
    preview?.presentation?.title,
  ].filter(Boolean).join(' ')).toLowerCase()

  if (outputMode === 'presentation') return true

  return /(brand identity|logo|wordmark|rebrand|identity system|brand system|logo reveal|presentation|brand reveal|typography|color direction|identity challenge)/.test(signals)
}

function getCinematicTheme(styleMode, palette = []) {
  const defaults = {
    cinematic: {base: '#070B16', surface: '#12182A', text: '#F8FAFC', accent: '#8AB4FF', accentAlt: '#C084FC'},
    editorial: {base: '#120E14', surface: '#221B24', text: '#F7F2EE', accent: '#E6B17E', accentAlt: '#A78BFA'},
    luxury: {base: '#120F0D', surface: '#201915', text: '#F5EFE7', accent: '#D6C6A5', accentAlt: '#8E6B3E'},
    bold: {base: '#0B1020', surface: '#151C31', text: '#F8FAFC', accent: '#EC4899', accentAlt: '#3B82F6'},
    minimal: {base: '#09111F', surface: '#121B2D', text: '#E2E8F0', accent: '#60A5FA', accentAlt: '#94A3B8'},
  }

  const next = {...(defaults[styleMode] || defaults.cinematic)}
  const paletteHexes = (palette || [])
    .map((item) => getFirstHexColor(item?.hex || item?.value || item))
    .filter(Boolean)

  if (paletteHexes[0]) next.accent = paletteHexes[0]
  if (paletteHexes[1]) next.accentAlt = paletteHexes[1]
  if (paletteHexes[2]) next.surface = paletteHexes[2]

  return next
}

function findCinematicMedia(plan, preview, attachments = []) {
  const attachedMedia = (attachments || []).find((item) => (item?.type || '').startsWith('video/') && item?.previewUrl)
    || (attachments || []).find((item) => (item?.type || '').startsWith('image/') && item?.previewUrl)

  if (attachedMedia) {
    return {
      url: attachedMedia.previewUrl,
      kind: (attachedMedia?.type || '').startsWith('video/') ? 'video' : 'image',
      label: attachedMedia.name || 'Uploaded reference',
    }
  }

  const referenceUrl = (plan?.fetchedContext?.referenceItems || [])
    .map((item) => item?.value || '')
    .find((value) => /\.(mp4|mov|webm|m4v|png|jpe?g|gif|webp|svg)(\?|#|$)/i.test(String(value || '')))

  if (referenceUrl) {
    return {
      url: referenceUrl,
      kind: /\.(mp4|mov|webm|m4v)(\?|#|$)/i.test(referenceUrl) ? 'video' : 'image',
      label: 'Reference media',
    }
  }

  const slideMedia = (preview?.presentation?.slides || [])
    .map((slide) => slide?.media)
    .find((item) => item?.src)

  if (slideMedia?.src) {
    return {
      url: slideMedia.src,
      kind: slideMedia.type === 'image' ? 'image' : 'embed',
      label: slideMedia.alt || 'Presentation media',
    }
  }

  return null
}

function deriveBrandSignals(plan, content) {
  const contextBullets = []
  const structure = Array.isArray(plan?.structure) ? plan.structure : []
  const interaction = Array.isArray(plan?.interactionThesis) ? plan.interactionThesis : []
  const visual = Array.isArray(plan?.visualDirection) ? plan.visualDirection : []

  structure.slice(0, 3).forEach((item) => {
    const value = cleanText(item)
    if (value) contextBullets.push(value)
  })

  interaction.slice(0, 2).forEach((item) => {
    const value = cleanText(item)
    if (value && !contextBullets.includes(value)) contextBullets.push(value)
  })

  const principles = mergeUnique(
    (content?.brand?.pillars || []).map((item) => cleanText(item?.title || item)).filter(Boolean),
    visual.map((item) => cleanText(String(item).replace(/^Creative territory:\s*/i, ''))).filter(Boolean)
  ).slice(0, 3)

  return {
    bullets: contextBullets.slice(0, 4),
    principles: principles.length ? principles : ['Strategic clarity', 'Identity confidence', 'Directed motion'],
  }
}

function normalizeSceneTypeFromStructure(label = '') {
  const value = cleanText(label).toLowerCase()

  if (!value) return null
  if (/(opening|hero statement|hero|intro)/.test(value)) return 'opening-title'
  if (/(video|media|logo reveal media|full-bleed)/.test(value)) return 'full-bleed-media'
  if (/wordmark/.test(value)) return 'wordmark-reveal'
  if (/(brand philosophy|philosophy|principles)/.test(value)) return 'brand-philosophy'
  if (/(brand context|identity challenge|challenge|context)/.test(value)) return 'brand-context'
  if (/(logo evolution|logo direction|evolution|before|after)/.test(value)) return 'logo-evolution'
  if (/(icon deconstruction|icon breakdown|icon)/.test(value)) return 'icon-deconstruction'
  if (/(logo system|lockup|usage rules|logo usage)/.test(value)) return 'logo-system'
  if (/(typography system|type system|typography|fonts)/.test(value)) return 'typography-system'
  if (/(color direction|color system|palette|colors)/.test(value)) return 'color-direction'
  if (/(social|instagram|linkedin|facebook)/.test(value)) return 'social-media-showcase'
  if (/(business card|collateral)/.test(value)) return 'business-cards-showcase'
  if (/(applications|services|deliverables|proof|showcase)/.test(value)) return 'applications-showcase'
  if (/(closing|decision|recommendation|cta|next step)/.test(value)) return 'closing-statement'
  return null
}

function deriveIconParts(plan, subject) {
  const prompt = cleanText([plan?.prompt, plan?.summary, plan?.visualThesis].filter(Boolean).join(' ')).toLowerCase()
  if (/\b3\b/.test(prompt) && /\b8\b/.test(prompt) && /\be\b/.test(prompt)) {
    return [
      {label: 'e', desc: `The lowercase e anchors ${subject} with a more human, modern first impression.`},
      {label: '3', desc: 'The 3 is fused into the mark as a subtle nod to the existing Envision 38 equity.'},
      {label: '8', desc: 'The 8 completes the abstract geometry so the icon feels proprietary instead of decorative.'},
    ]
  }

  return [
    {label: 'Core form', desc: 'The primary shape gives the mark a clear, memorable silhouette.'},
    {label: 'Embedded signal', desc: 'Secondary geometry folds brand meaning into the icon without over-explaining it.'},
    {label: 'Motion edge', desc: 'The final composition is designed to reveal cleanly in motion and scale across touchpoints.'},
  ]
}

function buildCinematicScene(type, context) {
  const {
    plan,
    portalContent,
    subject,
    wordmark,
    descriptor,
    brandSignals,
    applications,
    beforeWordmark,
    afterWordmark,
    media,
    styleMode,
  } = context

  switch (type) {
    case 'opening-title':
      return {
        id: 'opening',
        type,
        eyebrow: context.outputMode === 'presentation' ? 'Builder preview · Presentation' : 'Builder preview · Identity portal',
        headline: cleanText(portalContent?.hero?.headline || subject),
        subheadline: cleanText(portalContent?.hero?.subheadline || plan?.visualThesis || plan?.summary || descriptor),
        backgroundWord: cleanText(wordmark),
      }
    case 'full-bleed-media':
      return media ? {
        id: 'media',
        type,
        headline: /logo reveal/i.test(cleanText(plan?.prompt || '')) ? 'Logo reveal' : 'Reference motion',
        caption: cleanText(plan?.visualThesis || 'Reference motion and atmosphere for the opening brand moment.'),
        media: {
          url: media.url,
          kind: media.kind,
          label: media.label,
        },
      } : null
    case 'wordmark-reveal':
      return {
        id: 'wordmark',
        type,
        eyebrow: 'Identity reveal',
        wordmark: afterWordmark,
        descriptor,
        tagline: cleanText(plan?.visualThesis || portalContent?.logo?.headline || 'Directed brand evolution'),
      }
    case 'brand-context':
      return {
        id: 'context',
        type,
        headline: cleanText(portalContent?.brand?.headline || 'Why this identity changes now'),
        body: cleanText(portalContent?.brand?.positioning || plan?.summary || plan?.visualThesis || 'The preview is centered on a clearer identity system and a stronger first impression.'),
        bullets: brandSignals.bullets,
      }
    case 'brand-philosophy':
      return {
        id: 'philosophy',
        type,
        headline: cleanText(plan?.structure?.find((item) => /philosophy|principles/i.test(item)) || 'Brand philosophy'),
        principles: brandSignals.principles,
        supportingText: cleanText(plan?.visualThesis || 'The identity should feel deliberate, ownable, and cinematic without turning into decoration.'),
      }
    case 'logo-evolution':
      return {
        id: 'evolution',
        type,
        headline: cleanText(portalContent?.logo?.headline || 'Logo evolution'),
        before: beforeWordmark,
        after: afterWordmark,
        rationale: cleanText(portalContent?.logo?.rationale || plan?.interactionThesis?.[0] || 'The logo reveal should feel more deliberate, premium, and ownable.'),
        highlights: brandSignals.principles,
      }
    case 'icon-deconstruction':
      return {
        id: 'icon',
        type,
        headline: cleanText(plan?.structure?.find((item) => /icon/i.test(item)) || 'Icon deconstruction'),
        parts: deriveIconParts(plan, subject),
      }
    case 'logo-system':
      return {
        id: 'system',
        type,
        headline: cleanText(plan?.structure?.find((item) => /logo system|lockup|usage/i.test(item)) || 'Logo system'),
        variants: [
          {title: 'Primary lockup', body: 'Hero wordmark for opening moments and anchor frames.'},
          {title: 'Icon lockup', body: 'Compact brand mark for favicons, social avatars, and supporting touchpoints.'},
          {title: 'Light / dark use', body: 'Prepared for cinematic dark surfaces and high-contrast editorial applications.'},
        ],
        rules: [
          'Protect clear space around the mark.',
          'Keep the icon legible at small sizes.',
          'Avoid distortion, glow abuse, or stretched lockups.',
        ],
      }
    case 'typography-system':
      return {
        id: 'type',
        type,
        headline: cleanText(portalContent?.typography?.headline || 'Typography system'),
        fonts: (portalContent?.typography?.fonts || []).slice(0, 3),
        samples: [
          {label: 'Display', value: cleanText(afterWordmark || wordmark)},
          {label: 'Support', value: cleanText(descriptor || subject)},
        ],
      }
    case 'color-direction':
      return {
        id: 'palette',
        type,
        headline: cleanText(portalContent?.colors?.headline || 'Color direction'),
        palette: (portalContent?.colors?.palette || []).slice(0, 5),
        summary: cleanText(plan?.understanding?.colorMood || plan?.summary || ''),
        moodWords: brandSignals.principles,
      }
    case 'social-media-showcase':
      return {
        id: 'social',
        type,
        headline: cleanText(plan?.structure?.find((item) => /social|instagram|linkedin|facebook/i.test(item)) || 'Social rollout'),
        items: [
          {title: 'Launch teaser', body: 'Short reveal frames for announcing the new identity across owned channels.'},
          {title: 'Grid system', body: 'Modular social cards translating type, color, and icon logic into campaign posts.'},
          {title: 'Motion crop', body: 'Short-form snippets derived from the logo reveal for reels and stories.'},
        ],
      }
    case 'business-cards-showcase':
      return {
        id: 'proof-cards',
        type,
        headline: cleanText(plan?.structure?.find((item) => /business card|collateral/i.test(item)) || 'Collateral applications'),
        supportingText: cleanText(plan?.summary || ''),
        items: [
          {title: 'Front card', body: 'Bold brand face with heavy lowercase wordmark and atmospheric depth.'},
          {title: 'Back card', body: 'Contact information framed with tighter spacing and stronger hierarchy.'},
          {title: 'Light variant', body: 'A clean inverse system for print situations needing more contrast.'},
        ],
      }
    case 'applications-showcase':
      return {
        id: 'proof',
        type,
        headline: cleanText(plan?.structure?.find((item) => /applications|services|deliverables|proof|showcase/i.test(item)) || 'Applications in context'),
        supportingText: cleanText(plan?.summary || ''),
        items: applications.length ? applications : [
          {title: 'Hero reveal', body: 'Large-format opening frame with slower cinematic pacing.'},
          {title: 'Identity system', body: 'Logo, typography, and color direction aligned as one story.'},
          {title: 'Application proof', body: 'Real-world brand moments that validate the direction.'},
        ],
      }
    case 'closing-statement':
      return {
        id: 'closing',
        type,
        headline: cleanText(portalContent?.cta?.headline || 'Approve the reveal'),
        body: cleanText(portalContent?.cta?.body || 'Once the opening identity direction feels right, the build can expand into the full portal sequence.'),
      }
    default:
      return null
  }
}

function buildCinematicFlow(preview, plan, client, styleMode, outputMode, attachments = []) {
  const portalContent = buildPortalContent(outputMode === 'portal' ? preview : (preview?.portal || {}), plan, client, styleMode)
  const deck = outputMode === 'presentation' ? buildPresentation(preview, plan, client) : null
  const subject = getPlanSubject(plan, client) || cleanText(deck?.title || portalContent?.hero?.headline || 'Brand')
  const wordmark = cleanText(subject.split(/\s+/).slice(0, 2).join(' ')) || subject
  const descriptor = cleanText(subject.replace(wordmark, '')) || cleanText(client?.company || plan?.title || 'Brand identity system')
  const theme = getCinematicTheme(styleMode, portalContent?.colors?.palette || [])
  const media = findCinematicMedia(plan, preview, attachments)
  const brandSignals = deriveBrandSignals(plan, portalContent)
  const applications = (plan?.selectedAssets || []).slice(0, 4).map((item, index) => ({
    title: item.title,
    body: cleanText(item.rationale || brandSignals.bullets[index % Math.max(brandSignals.bullets.length, 1)] || 'Directed brand application'),
  }))
  const beforeWordmark = wordmark.toUpperCase()
  const afterWordmark = styleMode === 'luxury' ? wordmark : wordmark.toLowerCase()
  const sceneContext = {
    plan,
    portalContent,
    subject,
    wordmark,
    descriptor,
    brandSignals,
    applications,
    beforeWordmark,
    afterWordmark,
    media,
    styleMode,
    outputMode,
  }

  const structureSceneTypes = (plan?.structure || [])
    .map((item) => normalizeSceneTypeFromStructure(item))
    .filter(Boolean)

  const preferredSceneTypes = structureSceneTypes.length
    ? structureSceneTypes
    : [
        'opening-title',
        media ? 'full-bleed-media' : null,
        'wordmark-reveal',
        'brand-context',
        'logo-evolution',
        'color-direction',
        cleanText(plan?.prompt || '').toLowerCase().includes('business card') ? 'business-cards-showcase' : 'applications-showcase',
        'closing-statement',
      ].filter(Boolean)

  const dedupedSceneTypes = []
  preferredSceneTypes.forEach((type) => {
    if (type && !dedupedSceneTypes.includes(type)) dedupedSceneTypes.push(type)
  })

  if (!dedupedSceneTypes.includes('opening-title')) dedupedSceneTypes.unshift('opening-title')
  if (media && !dedupedSceneTypes.includes('full-bleed-media')) dedupedSceneTypes.splice(1, 0, 'full-bleed-media')
  if (!dedupedSceneTypes.includes('wordmark-reveal') && /(logo|wordmark|rebrand|identity)/i.test(cleanText(plan?.prompt || ''))) {
    dedupedSceneTypes.splice(Math.min(2, dedupedSceneTypes.length), 0, 'wordmark-reveal')
  }
  if (!dedupedSceneTypes.includes('closing-statement')) dedupedSceneTypes.push('closing-statement')

  const scenes = dedupedSceneTypes
    .map((type) => buildCinematicScene(type, sceneContext))
    .filter(Boolean)

  return {
    theme,
    scenes,
  }
}

function buildPresentation(preview, plan, client) {
  const deck = preview?.presentation || preview || {}
  const {backgroundOverride, textOverride, animationOverride} = resolveAssetDrivenTheme(plan, 'cinematic')
  const slides = Array.isArray(deck.slides) && deck.slides.length
    ? deck.slides
    : (plan?.structure || []).map((item, index) => ({
        eyebrow: `Slide ${index + 1}`,
        title: item,
        subtitle: plan?.interactionThesis?.[index % (plan?.interactionThesis?.length || 1)] || '',
        body: plan?.summary || '',
        bullets: index === 0 ? (plan?.selectedAssets || []).map((asset) => asset.title).slice(0, 4) : [],
      }))

  return {
    title: cleanText(deck.title) || plan?.title || `${client?.name || 'Presentation'} preview`,
    theme: deck.theme || backgroundOverride.deckTheme || textOverride.deckTheme || animationOverride.deckTheme || 'black',
    transition: deck.transition || 'slide',
    slides,
  }
}

function getSlideBackground(slide = {}, theme) {
  const background = slide.background || {}

  if (background.type === 'color' && background.value) return background.value
  if (background.type === 'gradient' && background.value) return background.value

  return `linear-gradient(145deg, ${theme.background} 0%, rgba(37,99,235,0.22) 100%)`
}

function PresentationRenderedPreview({preview, plan, client, selectedNodeId, onSelectNode}) {
  const deck = buildPresentation(preview, plan, client)
  const theme = getPresentationTheme(deck.theme)
  const profile = getPresentationProfile(plan, deck, theme)
  const reduceMotion = useReducedMotion()
  const previewKey = [deck.title, deck.theme, deck.transition, ...(plan?.selectedAssets || []).map((item) => item.id)].join('|')

  return (
    <motion.div
      key={previewKey}
      initial={{opacity: 0, y: 18}}
      animate={{opacity: 1, y: 0}}
      transition={{duration: 0.42, ease: [0.22, 1, 0.36, 1]}}
      style={{height: 780, overflow: 'auto', borderRadius: 32, border: `1px solid ${theme.border}`, background: theme.background, padding: 24, display: 'grid', gap: 18}}
    >
      <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: '4px 4px 12px'}}>
        <div>
          <div style={{fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.14em', color: theme.accent}}>Deck preview</div>
          <div style={{fontSize: 28, fontWeight: 800, color: theme.text, letterSpacing: '-.03em', marginTop: 8}}>{deck.title}</div>
        </div>
        <div style={{display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end'}}>
          {[`${deck.slides.length} slides`, `Theme: ${deck.theme}`, `Transition: ${deck.transition}`].map((item) => (
            <span key={item} style={{padding: '7px 10px', borderRadius: 999, background: theme.surface, border: `1px solid ${theme.border}`, fontSize: 12, color: theme.text}}>
              {item}
            </span>
          ))}
        </div>
      </div>

      {deck.slides.map((slide, index) => (
        (() => {
          const surface = getSlideSurface(index, slide, theme, profile)
          const slideMotion = getSlideMotion(index, reduceMotion)

          return (
            <SelectableRegion
              key={`${slide.title || slide.eyebrow || 'slide'}-${index}`}
              id={`slide-${index}`}
              label={`Slide ${index + 1}`}
              selectedNodeId={selectedNodeId}
              onSelectNode={onSelectNode}
            >
              <motion.section
                layout
                initial={slideMotion.initial}
                animate={slideMotion.animate}
                transition={slideMotion.transition}
                style={{
                  minHeight: surface.minHeight,
                  borderRadius: surface.borderRadius,
                  border: `1px solid ${profile.borderTone || theme.border}`,
                  background: surface.background,
                  color: theme.text,
                  padding: surface.padding,
                  display: 'grid',
                  gridTemplateColumns: surface.gridTemplateColumns,
                  gap: 24,
                  alignItems: 'stretch',
                  overflow: 'hidden',
                  position: 'relative',
                  boxShadow: profile.ambientGlow ? `0 28px 90px ${profile.shadowColor}` : 'none',
                }}
              >
                <div
                  aria-hidden="true"
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: surface.overlayBackground,
                    pointerEvents: 'none',
                  }}
                />
                <div
                  aria-hidden="true"
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: 6,
                    background: profile.accent,
                    opacity: index === 0 ? 1 : 0.78,
                  }}
                />
            <div style={{position: 'absolute', top: 18, right: 20, fontSize: 11, fontWeight: 700, letterSpacing: '.12em', color: theme.accent}}>
              {String(index + 1).padStart(2, '0')}
            </div>
                <div style={{display: 'grid', alignContent: 'space-between', gap: 18, position: 'relative', zIndex: 1}}>
              <div>
                {slide.eyebrow ? (
                      <div style={{fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: surface.eyebrowSpacing, color: profile.accent, marginBottom: 14}}>
                    {slide.eyebrow}
                  </div>
                ) : null}
                {slide.title ? (
                      <h2 style={{fontSize: surface.titleSize, lineHeight: 1.04, fontWeight: 800, color: theme.text, margin: '0 0 14px', letterSpacing: '-.03em', maxWidth: surface.contentMaxWidth}}>
                    {slide.title}
                  </h2>
                ) : null}
                {slide.subtitle ? (
                      <div style={{fontSize: 18 * profile.headlineScale, lineHeight: 1.5, color: theme.text, opacity: 0.9, marginBottom: 12, maxWidth: surface.contentMaxWidth}}>
                    {slide.subtitle}
                  </div>
                ) : null}
                {slide.body ? (
                      <div style={{fontSize: 15, lineHeight: 1.75, color: theme.text, opacity: 0.78, maxWidth: surface.contentMaxWidth}}>
                    {slide.body}
                  </div>
                ) : null}
              </div>

              {Array.isArray(slide.bullets) && slide.bullets.length ? (
                <div style={{display: 'grid', gap: 10}}>
                  {slide.bullets.slice(0, 5).map((bullet, bulletIndex) => (
                    <div key={`${bullet}-${bulletIndex}`} style={{display: 'grid', gridTemplateColumns: '18px 1fr', gap: 10, alignItems: 'start'}}>
                            <div style={{width: surface.bulletMarkerSize, height: surface.bulletMarkerSize, borderRadius: surface.bulletMarkerRadius, background: profile.accent, marginTop: 8}} />
                      <div style={{fontSize: 14, lineHeight: 1.7, color: theme.text, opacity: 0.88}}>{bullet}</div>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>

            {slide.media ? (
                  <div style={{borderRadius: 22, border: `1px solid ${theme.border}`, minHeight: 260, display: 'grid', placeItems: 'center', padding: 18, position: 'relative', zIndex: 1, ...surface.mediaShell}}>
                {slide.media.type === 'image' && slide.media.src ? (
                  <img src={slide.media.src} alt={slide.media.alt || ''} style={{maxWidth: '100%', maxHeight: 320, borderRadius: 16, objectFit: 'cover'}} />
                ) : (
                  <div style={{textAlign: 'center'}}>
                    <div style={{fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.14em', color: theme.accent, marginBottom: 10}}>Media</div>
                    <div style={{fontSize: 14, color: theme.text, opacity: 0.76}}>
                      {slide.media.type || 'Visual placeholder'}
                    </div>
                  </div>
                )}
              </div>
                ) : null}
              </motion.section>
            </SelectableRegion>
          )
        })()
      ))}
    </motion.div>
  )
}

function CinematicFlowRenderedPreview({preview, plan, styleMode, client, attachments, outputMode, selectedNodeId, onSelectNode}) {
  const flow = buildCinematicFlow(preview, plan, client, styleMode, outputMode, attachments)
  const reduceMotion = useReducedMotion()
  const containerRef = React.useRef(null)
  const [currentIndex, setCurrentIndex] = React.useState(0)

  React.useEffect(() => {
    const container = containerRef.current
    if (!container) return undefined

    const handleScroll = () => {
      const sectionHeight = container.clientHeight || 1
      const nextIndex = Math.round(container.scrollTop / Math.max(sectionHeight * 0.84, 1))
      setCurrentIndex(Math.max(0, Math.min(nextIndex, flow.scenes.length - 1)))
    }

    container.addEventListener('scroll', handleScroll, {passive: true})
    return () => container.removeEventListener('scroll', handleScroll)
  }, [flow.scenes.length])

  const previewKey = [
    flow.theme.base,
    flow.theme.accent,
    ...(flow.scenes || []).map((scene) => `${scene.type}:${scene.headline || scene.wordmark || scene.media?.url || ''}`),
  ].join('|')

  const ambientSurface = `linear-gradient(180deg, ${flow.theme.base}, rgba(5, 10, 24, 0.98))`

  return (
    <motion.div
      key={previewKey}
      initial={{opacity: 0, y: 18}}
      animate={{opacity: 1, y: 0}}
      transition={{duration: 0.42, ease: [0.22, 1, 0.36, 1]}}
      style={{
        height: 780,
        overflow: 'hidden',
        position: 'relative',
        borderRadius: 36,
        border: `1px solid ${rgba(flow.theme.text, 0.08)}`,
        background: ambientSurface,
        transform: 'translateZ(0)',
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          background: `
            radial-gradient(circle at 18% 20%, ${rgba(flow.theme.accent, 0.24)} 0%, transparent 38%),
            radial-gradient(circle at 82% 18%, ${rgba(flow.theme.accentAlt, 0.18)} 0%, transparent 34%),
            radial-gradient(circle at 55% 88%, ${rgba(flow.theme.surface, 0.18)} 0%, transparent 40%)
          `,
          filter: 'blur(22px)',
          pointerEvents: 'none',
        }}
      />

      <div style={{position: 'absolute', left: 22, top: 22, bottom: 22, zIndex: 3, display: 'flex', alignItems: 'center'}}>
        <div style={{width: 4, height: 160, background: rgba(flow.theme.text, 0.08), borderRadius: 999, overflow: 'hidden'}}>
          <motion.div
            animate={{height: `${Math.max(((currentIndex + 1) / Math.max(flow.scenes.length, 1)) * 100, 10)}%`}}
            transition={{duration: 0.35, ease: 'easeOut'}}
            style={{width: '100%', background: `linear-gradient(180deg, ${flow.theme.accent}, ${flow.theme.accentAlt})`, borderRadius: 999}}
          />
        </div>
      </div>

      <div style={{position: 'absolute', right: 20, top: '50%', transform: 'translateY(-50%)', zIndex: 3, display: 'grid', gap: 10}}>
        {flow.scenes.map((scene, index) => (
          <button
            key={`${scene.id || scene.type}-${index}`}
            onClick={() => {
              const container = containerRef.current
              if (!container) return
              container.scrollTo({top: index * container.clientHeight * 0.84, behavior: 'smooth'})
            }}
            title={scene.headline || scene.wordmark || scene.type}
            style={{
              width: index === currentIndex ? 28 : 12,
              height: 12,
              borderRadius: 999,
              border: `1px solid ${index === currentIndex ? flow.theme.accentAlt : rgba(flow.theme.text, 0.22)}`,
              background: index === currentIndex ? flow.theme.accent : rgba(flow.theme.text, 0.08),
              cursor: 'pointer',
              transition: 'all 180ms ease',
            }}
          />
        ))}
      </div>

      <div
        ref={containerRef}
        style={{
          position: 'relative',
          zIndex: 2,
          height: '100%',
          overflowY: 'auto',
          padding: '24px 48px 24px 52px',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        <div style={{display: 'grid', gap: 20}}>
          {flow.scenes.map((scene, index) => {
            const baseMotion = reduceMotion
              ? {initial: {opacity: 1}, animate: {opacity: 1}, transition: {duration: 0}}
              : {initial: {opacity: 0, y: 22}, animate: {opacity: 1, y: 0}, transition: {duration: 0.45, delay: index * 0.04, ease: [0.22, 1, 0.36, 1]}}

            const renderMedia = (height = 280) => {
              if (!scene.media?.url) return null
              return (
                <div style={{marginTop: 18, borderRadius: 24, overflow: 'hidden', border: `1px solid ${rgba(flow.theme.text, 0.1)}`, background: rgba(flow.theme.text, 0.04), minHeight: height}}>
                  {scene.media.kind === 'video' ? (
                    <video
                      src={scene.media.url}
                      autoPlay
                      muted
                      loop
                      playsInline
                      style={{display: 'block', width: '100%', height, objectFit: 'cover'}}
                    />
                  ) : scene.media.kind === 'image' ? (
                    <img src={scene.media.url} alt={scene.media.label || ''} style={{display: 'block', width: '100%', height, objectFit: 'cover'}} />
                  ) : (
                    <div style={{height, display: 'grid', placeItems: 'center', color: rgba(flow.theme.text, 0.7)}}>{scene.media.label || 'Media reference'}</div>
                  )}
                </div>
              )
            }

            let body = null

            if (scene.type === 'opening-title') {
              body = (
                <div style={{minHeight: 560, display: 'grid', alignItems: 'end', position: 'relative'}}>
                  <div style={{maxWidth: 880}}>
                    <div style={{fontSize: 11, fontWeight: 700, letterSpacing: '.22em', textTransform: 'uppercase', color: rgba(flow.theme.text, 0.58), marginBottom: 22}}>
                      {scene.eyebrow}
                    </div>
                    <div style={{fontSize: 'clamp(72px, 7vw, 118px)', lineHeight: 0.92, fontWeight: 800, letterSpacing: '-0.06em', color: flow.theme.text, maxWidth: 860}}>
                      {scene.headline}
                    </div>
                    {scene.subheadline ? (
                      <div style={{marginTop: 24, maxWidth: 620, fontSize: 20, lineHeight: 1.65, color: rgba(flow.theme.text, 0.78)}}>
                        {scene.subheadline}
                      </div>
                    ) : null}
                  </div>
                  <div style={{position: 'absolute', right: 8, top: 12, fontSize: 'clamp(92px, 11vw, 180px)', lineHeight: 0.86, fontWeight: 800, letterSpacing: '-0.08em', color: rgba(flow.theme.text, 0.07), textTransform: 'lowercase'}}>
                    {scene.backgroundWord || scene.headline}
                  </div>
                </div>
              )
            } else if (scene.type === 'full-bleed-media') {
              body = (
                <div style={{minHeight: 560, display: 'grid', alignItems: 'end', gap: 20}}>
                  <div>
                    <div style={{fontSize: 11, fontWeight: 700, letterSpacing: '.22em', textTransform: 'uppercase', color: flow.theme.accent, marginBottom: 14}}>
                      {scene.headline || 'Media moment'}
                    </div>
                    {scene.caption ? (
                      <div style={{maxWidth: 600, fontSize: 18, lineHeight: 1.7, color: rgba(flow.theme.text, 0.78)}}>
                        {scene.caption}
                      </div>
                    ) : null}
                  </div>
                  {renderMedia(360)}
                </div>
              )
            } else if (scene.type === 'wordmark-reveal') {
              body = (
                <div style={{minHeight: 500, display: 'grid', gap: 20, alignContent: 'center'}}>
                  <div style={{fontSize: 11, fontWeight: 700, letterSpacing: '.22em', textTransform: 'uppercase', color: flow.theme.accent}}>
                    {scene.eyebrow || 'Identity reveal'}
                  </div>
                  <div style={{fontSize: 'clamp(76px, 8vw, 132px)', lineHeight: 0.88, fontWeight: 800, letterSpacing: '-0.08em', color: flow.theme.text, textTransform: 'lowercase'}}>
                    {scene.wordmark}
                  </div>
                  {scene.descriptor ? (
                    <div style={{fontSize: 'clamp(28px, 3vw, 44px)', lineHeight: 0.96, fontWeight: 700, letterSpacing: '-0.04em', color: rgba(flow.theme.text, 0.66)}}>
                      {scene.descriptor}
                    </div>
                  ) : null}
                  {scene.tagline ? (
                    <div style={{maxWidth: 560, fontSize: 16, lineHeight: 1.75, color: rgba(flow.theme.text, 0.76)}}>
                      {scene.tagline}
                    </div>
                  ) : null}
                </div>
              )
            } else if (scene.type === 'brand-context') {
              body = (
                <div style={{minHeight: 420, display: 'grid', gridTemplateColumns: '1.12fr 0.88fr', gap: 24, alignItems: 'start'}}>
                  <div>
                    <div style={{fontSize: 12, fontWeight: 700, letterSpacing: '.18em', textTransform: 'uppercase', color: flow.theme.accent, marginBottom: 16}}>
                      Brand context
                    </div>
                    <div style={{fontSize: 'clamp(42px, 4vw, 64px)', lineHeight: 0.98, fontWeight: 800, letterSpacing: '-0.05em', color: flow.theme.text, marginBottom: 16}}>
                      {scene.headline}
                    </div>
                    <div style={{fontSize: 17, lineHeight: 1.75, color: rgba(flow.theme.text, 0.78), maxWidth: 620}}>
                      {scene.body}
                    </div>
                  </div>
                  <div style={{display: 'grid', gap: 12}}>
                    {(scene.bullets || []).map((item, bulletIndex) => (
                      <div key={`${item}-${bulletIndex}`} style={{padding: 18, borderRadius: 22, border: `1px solid ${rgba(flow.theme.text, 0.08)}`, background: rgba(flow.theme.text, 0.03), fontSize: 14, lineHeight: 1.65, color: flow.theme.text}}>
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              )
            } else if (scene.type === 'brand-philosophy') {
              body = (
                <div style={{minHeight: 380, display: 'grid', gap: 22, alignContent: 'center'}}>
                  <div style={{fontSize: 12, fontWeight: 700, letterSpacing: '.18em', textTransform: 'uppercase', color: flow.theme.accent}}>
                    {scene.headline || 'Brand philosophy'}
                  </div>
                  <div style={{display: 'flex', flexWrap: 'wrap', gap: 12}}>
                    {(scene.principles || []).map((item, itemIndex) => (
                      <div key={`${item}-${itemIndex}`} style={{padding: '12px 18px', borderRadius: 999, background: rgba(flow.theme.text, 0.05), border: `1px solid ${rgba(flow.theme.text, 0.08)}`, color: flow.theme.text, fontSize: 20, fontWeight: 700, letterSpacing: '-0.03em'}}>
                        {item}
                      </div>
                    ))}
                  </div>
                  {scene.supportingText ? (
                    <div style={{maxWidth: 680, fontSize: 16, lineHeight: 1.78, color: rgba(flow.theme.text, 0.76)}}>
                      {scene.supportingText}
                    </div>
                  ) : null}
                </div>
              )
            } else if (scene.type === 'logo-evolution') {
              body = (
                <div style={{minHeight: 440, display: 'grid', gap: 22}}>
                  <div style={{fontSize: 12, fontWeight: 700, letterSpacing: '.18em', textTransform: 'uppercase', color: flow.theme.accent}}>
                    {scene.headline || 'Logo evolution'}
                  </div>
                  <div style={{display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 18, alignItems: 'center'}}>
                    <div style={{padding: '28px 26px', borderRadius: 24, border: `1px solid ${rgba(flow.theme.text, 0.08)}`, background: rgba(flow.theme.text, 0.03)}}>
                      <div style={{fontSize: 12, color: rgba(flow.theme.text, 0.54), textTransform: 'uppercase', letterSpacing: '.14em', marginBottom: 10}}>Before</div>
                      <div style={{fontSize: 'clamp(34px, 4vw, 60px)', fontWeight: 700, letterSpacing: '-0.05em', color: rgba(flow.theme.text, 0.52)}}>
                        {scene.before}
                      </div>
                    </div>
                    <div style={{fontSize: 40, color: flow.theme.accent}}>→</div>
                    <div style={{padding: '28px 26px', borderRadius: 24, border: `1px solid ${rgba(flow.theme.accent, 0.38)}`, background: rgba(flow.theme.accent, 0.08)}}>
                      <div style={{fontSize: 12, color: rgba(flow.theme.text, 0.54), textTransform: 'uppercase', letterSpacing: '.14em', marginBottom: 10}}>After</div>
                      <div style={{fontSize: 'clamp(34px, 4vw, 60px)', fontWeight: 800, letterSpacing: '-0.07em', color: flow.theme.text, textTransform: 'lowercase'}}>
                        {scene.after}
                      </div>
                    </div>
                  </div>
                  <div style={{display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 18}}>
                    <div style={{fontSize: 15, lineHeight: 1.72, color: rgba(flow.theme.text, 0.76)}}>{scene.rationale}</div>
                    <div style={{display: 'grid', gap: 10}}>
                      {(scene.highlights || []).map((item, itemIndex) => (
                        <div key={`${item}-${itemIndex}`} style={{padding: '12px 14px', borderRadius: 18, background: rgba(flow.theme.text, 0.04), border: `1px solid ${rgba(flow.theme.text, 0.07)}`, color: flow.theme.text, fontSize: 13, fontWeight: 600}}>
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )
            } else if (scene.type === 'icon-deconstruction') {
              body = (
                <div style={{minHeight: 400, display: 'grid', gap: 18}}>
                  <div style={{fontSize: 12, fontWeight: 700, letterSpacing: '.18em', textTransform: 'uppercase', color: flow.theme.accent}}>
                    {scene.headline || 'Icon deconstruction'}
                  </div>
                  <div style={{display: 'grid', gridTemplateColumns: '0.95fr 1.05fr', gap: 18, alignItems: 'stretch'}}>
                    <div style={{borderRadius: 28, border: `1px solid ${rgba(flow.theme.accent, 0.24)}`, background: `radial-gradient(circle at 50% 40%, ${rgba(flow.theme.accent, 0.14)}, transparent 55%), ${rgba(flow.theme.text, 0.03)}`, minHeight: 280, display: 'grid', placeItems: 'center'}}>
                      <div style={{fontSize: 'clamp(84px, 8vw, 138px)', lineHeight: 0.85, fontWeight: 800, letterSpacing: '-0.08em', color: flow.theme.text, textTransform: 'lowercase'}}>
                        {scene.parts?.map((item) => item.label).join('')}
                      </div>
                    </div>
                    <div style={{display: 'grid', gap: 12}}>
                      {(scene.parts || []).map((item, itemIndex) => (
                        <div key={`${item.label}-${itemIndex}`} style={{padding: 18, borderRadius: 22, border: `1px solid ${rgba(flow.theme.text, 0.08)}`, background: rgba(flow.theme.text, 0.03)}}>
                          <div style={{fontSize: 12, fontWeight: 800, letterSpacing: '.18em', textTransform: 'uppercase', color: flow.theme.accent, marginBottom: 8}}>
                            {item.label}
                          </div>
                          <div style={{fontSize: 14, lineHeight: 1.7, color: rgba(flow.theme.text, 0.76)}}>
                            {item.desc}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )
            } else if (scene.type === 'logo-system') {
              body = (
                <div style={{minHeight: 390, display: 'grid', gap: 18}}>
                  <div style={{fontSize: 12, fontWeight: 700, letterSpacing: '.18em', textTransform: 'uppercase', color: flow.theme.accent}}>
                    {scene.headline || 'Logo system'}
                  </div>
                  <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 16}}>
                    {(scene.variants || []).slice(0, 3).map((item, itemIndex) => (
                      <div key={`${item.title}-${itemIndex}`} style={{padding: 20, borderRadius: 24, border: `1px solid ${rgba(flow.theme.text, 0.08)}`, background: rgba(flow.theme.text, 0.03), minHeight: 210, display: 'grid', gap: 14, alignContent: 'space-between'}}>
                        <div style={{fontSize: 10, fontWeight: 700, letterSpacing: '.18em', textTransform: 'uppercase', color: rgba(flow.theme.text, 0.48)}}>
                          Variant
                        </div>
                        <div style={{fontSize: 22, lineHeight: 1.02, fontWeight: 800, letterSpacing: '-0.04em', color: flow.theme.text}}>
                          {item.title}
                        </div>
                        <div style={{fontSize: 13, lineHeight: 1.68, color: rgba(flow.theme.text, 0.72)}}>
                          {item.body}
                        </div>
                      </div>
                    ))}
                  </div>
                  {scene.rules?.length ? (
                    <div style={{display: 'flex', flexWrap: 'wrap', gap: 10}}>
                      {scene.rules.map((item, itemIndex) => (
                        <div key={`${item}-${itemIndex}`} style={{padding: '10px 14px', borderRadius: 999, border: `1px solid ${rgba(flow.theme.text, 0.08)}`, background: rgba(flow.theme.text, 0.04), color: rgba(flow.theme.text, 0.72), fontSize: 12, fontWeight: 600}}>
                          {item}
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              )
            } else if (scene.type === 'typography-system') {
              body = (
                <div style={{minHeight: 400, display: 'grid', gap: 20}}>
                  <div style={{fontSize: 12, fontWeight: 700, letterSpacing: '.18em', textTransform: 'uppercase', color: flow.theme.accent}}>
                    {scene.headline || 'Typography system'}
                  </div>
                  <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16}}>
                    {(scene.fonts || []).slice(0, 2).map((font, fontIndex) => (
                      <div key={`${font.name || font.typeface}-${fontIndex}`} style={{padding: 22, borderRadius: 24, border: `1px solid ${rgba(flow.theme.text, 0.08)}`, background: rgba(flow.theme.text, 0.03), minHeight: 220, display: 'grid', gap: 12}}>
                        <div style={{fontSize: 10, fontWeight: 700, letterSpacing: '.18em', textTransform: 'uppercase', color: rgba(flow.theme.text, 0.48)}}>
                          {font.name || 'Font system'}
                        </div>
                        <div style={{fontSize: fontIndex === 0 ? 46 : 28, lineHeight: fontIndex === 0 ? 0.95 : 1.08, fontWeight: fontIndex === 0 ? 800 : 600, letterSpacing: '-0.04em', color: flow.theme.text}}>
                          {scene.samples?.[fontIndex]?.value || font.typeface || font.usage}
                        </div>
                        <div style={{fontSize: 13, lineHeight: 1.68, color: rgba(flow.theme.text, 0.72)}}>
                          {font.typeface || font.usage}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            } else if (scene.type === 'color-direction') {
              body = (
                <div style={{minHeight: 360, display: 'grid', gap: 18}}>
                  <div style={{fontSize: 12, fontWeight: 700, letterSpacing: '.18em', textTransform: 'uppercase', color: flow.theme.accent}}>
                    {scene.headline || 'Color direction'}
                  </div>
                  <div style={{display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 14}}>
                    {(scene.palette || []).slice(0, 4).map((item, paletteIndex) => (
                      <div key={`${item.name || item.hex}-${paletteIndex}`} style={{borderRadius: 22, overflow: 'hidden', border: `1px solid ${rgba(flow.theme.text, 0.08)}`, background: rgba(flow.theme.text, 0.03)}}>
                        <div style={{height: 120, background: item.hex || item.value || '#111827'}} />
                        <div style={{padding: 16, display: 'grid', gap: 6}}>
                          <div style={{fontSize: 14, fontWeight: 700, color: flow.theme.text}}>{item.name || 'Palette tone'}</div>
                          <div style={{fontSize: 12, color: rgba(flow.theme.text, 0.56)}}>{item.role || item.hex || item.value}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {scene.summary ? (
                    <div style={{fontSize: 14, lineHeight: 1.72, color: rgba(flow.theme.text, 0.74), maxWidth: 680}}>
                      {scene.summary}
                    </div>
                  ) : null}
                  {scene.moodWords?.length ? (
                    <div style={{display: 'flex', flexWrap: 'wrap', gap: 10}}>
                      {scene.moodWords.map((item, itemIndex) => (
                        <div key={`${item}-${itemIndex}`} style={{padding: '10px 14px', borderRadius: 999, border: `1px solid ${rgba(flow.theme.text, 0.08)}`, background: rgba(flow.theme.text, 0.04), color: flow.theme.text, fontSize: 12, fontWeight: 700}}>
                          {item}
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              )
            } else if (scene.type === 'social-media-showcase') {
              body = (
                <div style={{minHeight: 410, display: 'grid', gap: 18}}>
                  <div>
                    <div style={{fontSize: 12, fontWeight: 700, letterSpacing: '.18em', textTransform: 'uppercase', color: flow.theme.accent, marginBottom: 12}}>
                      Social rollout
                    </div>
                    <div style={{fontSize: 'clamp(34px, 3vw, 52px)', lineHeight: 1, fontWeight: 800, letterSpacing: '-0.04em', color: flow.theme.text}}>
                      {scene.headline}
                    </div>
                  </div>
                  <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 16}}>
                    {(scene.items || []).slice(0, 3).map((item, itemIndex) => (
                      <div key={`${item.title}-${itemIndex}`} style={{padding: 18, borderRadius: 24, border: `1px solid ${rgba(flow.theme.text, 0.08)}`, background: rgba(flow.theme.text, 0.03), minHeight: 240, display: 'grid', gap: 10, alignContent: 'space-between'}}>
                        <div style={{borderRadius: 18, minHeight: 112, background: `linear-gradient(145deg, ${rgba(flow.theme.accent, 0.24)}, ${rgba(flow.theme.accentAlt, 0.14)})`}} />
                        <div style={{fontSize: 19, lineHeight: 1.08, fontWeight: 800, letterSpacing: '-0.04em', color: flow.theme.text}}>
                          {item.title}
                        </div>
                        <div style={{fontSize: 13, lineHeight: 1.68, color: rgba(flow.theme.text, 0.7)}}>
                          {item.body}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            } else if (scene.type === 'applications-showcase' || scene.type === 'business-cards-showcase') {
              body = (
                <div style={{minHeight: 420, display: 'grid', gap: 18}}>
                  <div>
                    <div style={{fontSize: 12, fontWeight: 700, letterSpacing: '.18em', textTransform: 'uppercase', color: flow.theme.accent, marginBottom: 12}}>
                      {scene.type === 'business-cards-showcase' ? 'Collateral moment' : 'Applications in context'}
                    </div>
                    <div style={{fontSize: 'clamp(34px, 3vw, 52px)', lineHeight: 1, fontWeight: 800, letterSpacing: '-0.04em', color: flow.theme.text}}>
                      {scene.headline}
                    </div>
                    {scene.supportingText ? (
                      <div style={{marginTop: 12, maxWidth: 680, fontSize: 15, lineHeight: 1.72, color: rgba(flow.theme.text, 0.74)}}>
                        {scene.supportingText}
                      </div>
                    ) : null}
                  </div>
                  <div style={{display: 'grid', gridTemplateColumns: scene.type === 'business-cards-showcase' ? 'repeat(3, minmax(0, 1fr))' : 'repeat(3, minmax(0, 1fr))', gap: 16}}>
                    {(scene.items || []).slice(0, 3).map((item, itemIndex) => (
                      <div key={`${item.title}-${itemIndex}`} style={{padding: 20, borderRadius: 24, border: `1px solid ${rgba(flow.theme.text, 0.08)}`, background: `linear-gradient(180deg, ${rgba(flow.theme.text, 0.05)}, ${rgba(flow.theme.text, 0.02)})`, minHeight: scene.type === 'business-cards-showcase' ? 220 : 180, display: 'grid', alignContent: 'space-between', gap: 14}}>
                        <div style={{fontSize: scene.type === 'business-cards-showcase' ? 11 : 10, fontWeight: 700, letterSpacing: '.18em', textTransform: 'uppercase', color: rgba(flow.theme.text, 0.5)}}>
                          {scene.type === 'business-cards-showcase' ? 'Card surface' : 'Application'}
                        </div>
                        <div style={{fontSize: 22, lineHeight: 1.05, fontWeight: 800, letterSpacing: '-0.04em', color: flow.theme.text}}>
                          {item.title}
                        </div>
                        <div style={{fontSize: 13, lineHeight: 1.68, color: rgba(flow.theme.text, 0.7)}}>
                          {item.body || item.desc}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            } else if (scene.type === 'closing-statement') {
              body = (
                <div style={{minHeight: 320, display: 'grid', alignContent: 'end', gap: 16}}>
                  <div style={{fontSize: 12, fontWeight: 700, letterSpacing: '.18em', textTransform: 'uppercase', color: flow.theme.accent}}>
                    Closing
                  </div>
                  <div style={{fontSize: 'clamp(42px, 4vw, 70px)', lineHeight: 0.95, fontWeight: 800, letterSpacing: '-0.05em', color: flow.theme.text, maxWidth: 720}}>
                    {scene.headline}
                  </div>
                  {scene.body ? (
                    <div style={{maxWidth: 620, fontSize: 16, lineHeight: 1.75, color: rgba(flow.theme.text, 0.76)}}>
                      {scene.body}
                    </div>
                  ) : null}
                </div>
              )
            } else {
              body = (
                <div style={{minHeight: 300, display: 'grid', gap: 14, alignContent: 'center'}}>
                  <div style={{fontSize: 12, fontWeight: 700, letterSpacing: '.18em', textTransform: 'uppercase', color: flow.theme.accent}}>
                    {scene.type.replace(/-/g, ' ')}
                  </div>
                  <div style={{fontSize: 34, lineHeight: 1.02, fontWeight: 800, letterSpacing: '-0.04em', color: flow.theme.text}}>
                    {scene.headline || scene.wordmark || 'Scene preview'}
                  </div>
                </div>
              )
            }

            return (
              <SelectableRegion
                key={`${scene.id || scene.type}-${index}`}
                id={scene.id || scene.type}
                label={scene.type.replace(/-/g, ' ')}
                selectedNodeId={selectedNodeId}
                onSelectNode={onSelectNode}
              >
                <motion.section
                  initial={baseMotion.initial}
                  animate={baseMotion.animate}
                  transition={baseMotion.transition}
                  style={{
                    position: 'relative',
                    minHeight: index === 0 ? 620 : 420,
                    padding: '42px 44px',
                    borderRadius: 32,
                    border: `1px solid ${rgba(flow.theme.text, 0.08)}`,
                    background: `linear-gradient(160deg, ${rgba(flow.theme.surface, index === 0 ? 0.56 : 0.34)}, ${rgba(flow.theme.base, 0.96)})`,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    aria-hidden="true"
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: `radial-gradient(circle at 80% 12%, ${rgba(flow.theme.accent, 0.12)} 0%, transparent 24%), radial-gradient(circle at 18% 82%, ${rgba(flow.theme.accentAlt, 0.08)} 0%, transparent 30%)`,
                      pointerEvents: 'none',
                    }}
                  />
                  <div style={{position: 'relative', zIndex: 1}}>
                    {body}
                  </div>
                </motion.section>
              </SelectableRegion>
            )
          })}
        </div>
      </div>
    </motion.div>
  )
}

export default function BuilderLivePreview({outputMode, preview, plan, styleMode, client, attachments, selectedNodeId, onSelectNode}) {
  if (shouldUseCinematicPreview(outputMode, plan, preview)) {
    return (
      <CinematicFlowRenderedPreview
        outputMode={outputMode}
        preview={preview}
        plan={plan}
        styleMode={styleMode}
        client={client}
        attachments={attachments}
        selectedNodeId={selectedNodeId}
        onSelectNode={onSelectNode}
      />
    )
  }

  if (outputMode === 'presentation') {
    return <PresentationRenderedPreview preview={preview} plan={plan} client={client} selectedNodeId={selectedNodeId} onSelectNode={onSelectNode} />
  }

  if (outputMode === 'cinematic-code') {
    const files = preview?.cinematicCode?.files || preview?.files || {}
    const fileNames = Object.keys(files)
    const [activeFile, setActiveFile] = React.useState(fileNames[0] || '')
    return (
      <motion.div
        initial={{opacity: 0, y: 18}} animate={{opacity: 1, y: 0}}
        transition={{duration: 0.42, ease: [0.22, 1, 0.36, 1]}}
        style={{borderRadius: 24, border: '1px solid rgba(255,255,255,0.08)', background: '#0a0a12', overflow: 'hidden'}}>
        <div style={{padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
          <div style={{display: 'flex', alignItems: 'center', gap: 10}}>
            <span style={{fontSize: 12, fontWeight: 700, color: '#A78BFA'}}>Cinematic Code</span>
            <span style={{fontSize: 11, color: '#64748B'}}>{fileNames.length} files generated</span>
          </div>
        </div>
        <div style={{display: 'flex', minHeight: 500}}>
          <div style={{width: 180, borderRight: '1px solid rgba(255,255,255,0.06)', padding: '8px 0', overflowY: 'auto'}}>
            {fileNames.map(name => (
              <button key={name} onClick={() => setActiveFile(name)}
                style={{display: 'block', width: '100%', textAlign: 'left', padding: '7px 14px', fontSize: 11,
                  color: activeFile === name ? '#E2E8F0' : '#64748B', fontWeight: activeFile === name ? 600 : 400,
                  background: activeFile === name ? 'rgba(255,255,255,0.04)' : 'transparent',
                  border: 'none', cursor: 'pointer', fontFamily: 'monospace'}}>
                {name}
              </button>
            ))}
          </div>
          <div style={{flex: 1, padding: 16, overflowY: 'auto', maxHeight: 600}}>
            <pre style={{fontSize: 11, lineHeight: 1.6, color: '#CBD5E1', fontFamily: 'monospace', whiteSpace: 'pre-wrap', margin: 0}}>
              {files[activeFile] || '// Select a file'}
            </pre>
          </div>
        </div>
      </motion.div>
    )
  }

  return <PortalRenderedPreview preview={preview} plan={plan} styleMode={styleMode} client={client} selectedNodeId={selectedNodeId} onSelectNode={onSelectNode} />
}
