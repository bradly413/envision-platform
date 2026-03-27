export const EXPERIENCE_PRESETS = {
  'cinematic-editorial': {
    label: 'Cinematic Editorial',
    motionLevel: 'immersive',
    depth: 'layered',
    background: {
      base: '#090911',
      gradientA: 'rgba(127, 29, 29, 0.28)',
      gradientB: 'rgba(30, 58, 138, 0.26)',
      gradientC: 'rgba(146, 64, 14, 0.18)',
    },
    heroEffects: ['shader-background', 'title-reveal', 'slow-zoom'],
    sectionEffects: {
      about: ['parallax-panels'],
      strategy: ['sticky-story'],
      deliverables: ['glass-panel'],
      palette: ['color-glow'],
      typography: ['headline-shift'],
      cta: ['magnetic-cta'],
    },
  },
  'luxury-minimal': {
    label: 'Luxury Minimal',
    motionLevel: 'elevated',
    depth: 'subtle',
    background: {
      base: '#0d0c0b',
      gradientA: 'rgba(120, 113, 108, 0.18)',
      gradientB: 'rgba(92, 52, 18, 0.22)',
      gradientC: 'rgba(255, 244, 214, 0.08)',
    },
    heroEffects: ['glass-panel', 'title-reveal'],
    sectionEffects: {
      about: ['editorial-rise'],
      strategy: ['glass-panel'],
      deliverables: ['magnetic-cards'],
      palette: ['color-glow'],
      typography: ['headline-shift'],
      cta: ['magnetic-cta'],
    },
  },
  'bold-campaign': {
    label: 'Bold Campaign',
    motionLevel: 'immersive',
    depth: 'layered',
    background: {
      base: '#09090f',
      gradientA: 'rgba(190, 24, 93, 0.26)',
      gradientB: 'rgba(59, 130, 246, 0.24)',
      gradientC: 'rgba(249, 115, 22, 0.24)',
    },
    heroEffects: ['shader-background', 'title-reveal', 'camera-zoom'],
    sectionEffects: {
      about: ['parallax-panels'],
      strategy: ['sticky-story'],
      deliverables: ['magnetic-cards'],
      palette: ['color-glow'],
      typography: ['headline-shift'],
      cta: ['magnetic-cta'],
    },
  },
  'immersive-culture': {
    label: 'Immersive Culture',
    motionLevel: 'immersive',
    depth: 'deep',
    background: {
      base: '#090b12',
      gradientA: 'rgba(91, 33, 182, 0.26)',
      gradientB: 'rgba(22, 163, 74, 0.18)',
      gradientC: 'rgba(220, 38, 38, 0.2)',
    },
    heroEffects: ['shader-background', 'title-reveal', 'slow-zoom'],
    sectionEffects: {
      about: ['parallax-panels'],
      strategy: ['sticky-story'],
      deliverables: ['glass-panel'],
      palette: ['color-glow'],
      typography: ['headline-shift'],
      cta: ['magnetic-cta'],
    },
  },
  'modern-tech': {
    label: 'Modern Tech',
    motionLevel: 'elevated',
    depth: 'layered',
    background: {
      base: '#050816',
      gradientA: 'rgba(14, 165, 233, 0.24)',
      gradientB: 'rgba(99, 102, 241, 0.24)',
      gradientC: 'rgba(16, 185, 129, 0.14)',
    },
    heroEffects: ['shader-background', 'title-reveal'],
    sectionEffects: {
      about: ['editorial-rise'],
      strategy: ['glass-panel'],
      deliverables: ['magnetic-cards'],
      palette: ['color-glow'],
      typography: ['headline-shift'],
      cta: ['magnetic-cta'],
    },
  },
  'institutional-academic': {
    label: 'Institutional Academic',
    motionLevel: 'refined',
    depth: 'subtle',
    background: {
      base: '#F3F0E8',
      gradientA: 'rgba(47, 58, 77, 0.06)',
      gradientB: 'rgba(140, 124, 91, 0.08)',
      gradientC: 'rgba(255, 255, 255, 0.28)',
    },
    heroEffects: ['title-reveal'],
    sectionEffects: {
      about: ['editorial-rise'],
      strategy: ['glass-panel'],
      deliverables: ['glass-panel'],
      palette: ['editorial-rise'],
      typography: ['headline-shift'],
      cta: ['magnetic-cta'],
    },
  },
};

export const EXPERIENCE_SECTIONS = ['about', 'strategy', 'deliverables', 'palette', 'typography', 'cta'];

const DEFAULT_EXPERIENCE = {
  preset: 'cinematic-editorial',
  motionLevel: 'elevated',
  depth: 'layered',
  heroEffects: ['title-reveal'],
  sectionEffects: {},
  fallbacks: {
    mobile: 'reduced',
    reducedMotion: true,
  },
};

export function resolveExperience(experience = {}) {
  const preset = EXPERIENCE_PRESETS[experience?.preset] || EXPERIENCE_PRESETS[DEFAULT_EXPERIENCE.preset];

  return {
    ...DEFAULT_EXPERIENCE,
    ...preset,
    ...experience,
    background: {
      ...preset.background,
      ...(experience.background || {}),
    },
    heroEffects: experience.heroEffects || preset.heroEffects || DEFAULT_EXPERIENCE.heroEffects,
    sectionEffects: {
      ...(preset.sectionEffects || {}),
      ...(experience.sectionEffects || {}),
    },
    presetLabel: preset.label,
  };
}
