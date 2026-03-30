import React, {useEffect, useMemo, useRef, useState} from 'react';
import {toPng} from 'html-to-image';
import {ai, clients as clientsApi, portals as portalsApi} from '../lib/api';
import {
  formatRegistryCategoryLabel,
  getRegistryOptionsForCategory,
  inferReferenceSite,
  pickRegistryRecommendations,
} from '../lib/experienceBuilderRegistry';
import {
  createLibraryEntries,
  getLibraryTypeLabel,
  getRecommendedLibraryItems,
  libraryItemsToRuntimeContext,
  loadReferenceLibrary,
  mergeLibraryEntries,
  removeLibraryEntry,
  saveReferenceLibrary,
} from '../lib/referenceLibrary';
import BuilderLivePreview from '../components/BuilderLivePreview';

const MODEL_OPTIONS = {
  anthropic: [
    {value: 'claude-sonnet-4-20250514', label: 'Claude Sonnet 4'},
  ],
  openai: [
    {value: 'gpt-4.1', label: 'GPT-4.1'},
    {value: 'gpt-4.1-mini', label: 'GPT-4.1 Mini'},
  ],
  google: [
    {value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash'},
    {value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro'},
  ],
};

const STYLE_MODES = [
  {value: 'cinematic', label: 'Cinematic'},
  {value: 'editorial', label: 'Editorial'},
  {value: 'luxury', label: 'Luxury'},
  {value: 'bold', label: 'Bold Campaign'},
  {value: 'minimal', label: 'Minimal Modern'},
];

const OUTPUT_MODES = [
  {value: 'portal', label: 'Portal'},
  {value: 'presentation', label: 'Presentation'},
];

const TEMPLATE_OPTIONS = [
  {value: 'brand-reveal-v1', label: 'Brand Reveal v1'},
  {value: 'brand-reveal-minimal', label: 'Brand Reveal Minimal'},
  {value: 'full-identity', label: 'Full Identity'},
];

const PORTAL_URL = import.meta.env.VITE_PORTAL_URL || 'https://envision-portal.netlify.app';
const BUILDER_DATA_CACHE_KEY = 'envision-builder-v2-workspace-cache';
const FALLBACK_CLIENT_ID = 'draft-client';
const FALLBACK_PORTAL_ID = 'draft-portal';
const FALLBACK_CLIENTS = [
  {
    id: FALLBACK_CLIENT_ID,
    name: 'Draft workspace',
    company: 'Local planning fallback',
    email: '',
  },
];
const FALLBACK_PORTALS = [
  {
    id: FALLBACK_PORTAL_ID,
    client_id: FALLBACK_CLIENT_ID,
    client_name: 'Draft workspace',
    slug: 'draft-workspace',
    template_id: 'brand-reveal-v1',
    status: 'draft',
  },
];

const MODE_INTRO = {
  portal: 'Build an immersive portal by describing the story, visual territory, and motion language you want. I will create a plan first, then generate the portal after approval.',
  presentation: 'Build an interactive presentation by describing the narrative, audience, and desired motion system. I will create a plan first, then generate the presentation after approval.',
};

const CONCEPT_PROFILES = {
  portal: [
    {
      id: 'noir-immersion',
      label: 'Noir immersion',
      titleSuffix: 'Noir immersion portal',
      summary: 'A darker, more atmospheric portal that leans on sculptural contrast, slower reveals, and cinematic depth instead of default template rhythm.',
      mood: 'dark editorial contrast, sculptural depth, and quiet tension',
      interaction: 'Use motion like a slow camera move, letting sections emerge with control rather than constant activity.',
      assetHints: ['noir', 'spotlight', 'depth', 'editorial', 'cinematic', 'atmospheric'],
      structure: ['Atmospheric opening', 'Narrative tension', 'Brand pivot', 'Signature reveal', 'Material system', 'Proof in context', 'Decision moment'],
    },
    {
      id: 'luminous-systems',
      label: 'Luminous systems',
      titleSuffix: 'Luminous systems portal',
      summary: 'A cleaner systems-led portal with signal lines, luminous planes, and sharper information pacing so the brand feels advanced instead of generic.',
      mood: 'cool luminous layers, precise grids, and intelligent systems motion',
      interaction: 'Let motion feel infrastructural, with signals, scans, and clean transitions shaping the path through the portal.',
      assetHints: ['luminous', 'grid', 'signal', 'glow', 'systems', 'futuristic'],
      structure: ['Signal hero', 'System story', 'Capability matrix', 'Interactive proof', 'Motion language', 'Applications', 'Conversion prompt'],
    },
    {
      id: 'tactile-luxury',
      label: 'Tactile luxury',
      titleSuffix: 'Tactile luxury portal',
      summary: 'A warmer, more material portal with restrained luxury cues, tactile contrast, and slower premium pacing rather than startup-style UI noise.',
      mood: 'warm material contrast, tactile surfaces, and restrained luxury pacing',
      interaction: 'Keep motion deliberate and elegant so each transition feels crafted, not automated.',
      assetHints: ['luxury', 'warm', 'bronze', 'texture', 'serif', 'tactile'],
      structure: ['Statement hero', 'Material cue', 'Craft narrative', 'Mark details', 'Palette and texture', 'Applications', 'Final recommendation'],
    },
    {
      id: 'kinetic-campaign',
      label: 'Kinetic campaign',
      titleSuffix: 'Kinetic campaign portal',
      summary: 'A punchier campaign-like portal built around momentum, sharper contrasts, and more aggressive sequencing to feel energetic and current.',
      mood: 'high-contrast impact, kinetic pacing, and launch-energy composition',
      interaction: 'Use motion to create acceleration and momentum, with stronger reveals and more deliberate pressure changes.',
      assetHints: ['campaign', 'kinetic', 'launch', 'bold', 'parallax', 'impact'],
      structure: ['Launch frame', 'Audience tension', 'Big promise', 'Momentum section', 'Activation system', 'Proof collage', 'Next move'],
    },
    {
      id: 'minimal-editorial',
      label: 'Minimal editorial',
      titleSuffix: 'Minimal editorial portal',
      summary: 'A quieter editorial portal with fewer moving parts, stronger typography, and more negative space so the brand feels distinct and composed.',
      mood: 'poster-like typography, disciplined whitespace, and minimal editorial rhythm',
      interaction: 'Let movement stay sparse and meaningful so composition and copy carry more of the weight.',
      assetHints: ['minimal', 'editorial', 'typography', 'poster', 'grid', 'monolith'],
      structure: ['Poster hero', 'Context statement', 'Core idea', 'Identity system', 'Type and grid', 'Applications', 'Final frame'],
    },
  ],
  presentation: [
    {
      id: 'editorial-story',
      label: 'Editorial story deck',
      titleSuffix: 'Editorial story presentation',
      summary: 'A more narrative deck with slower pacing, cleaner editorial hierarchy, and stronger scene-setting between key brand moments.',
      mood: 'editorial pacing, atmospheric framing, and measured reveal timing',
      interaction: 'Use transitions to separate chapters clearly, with each slide behaving more like a poster than a dashboard.',
      assetHints: ['editorial', 'story', 'headline', 'poster', 'atmospheric'],
      structure: ['Opening title sequence', 'Context frame', 'Core tension', 'Strategic turn', 'Identity reveal', 'Applications', 'Closing recommendation'],
    },
    {
      id: 'systems-pitch',
      label: 'Systems pitch deck',
      titleSuffix: 'Systems pitch presentation',
      summary: 'A cleaner strategic deck that emphasizes logic, systems thinking, and stronger proof over decorative motion repetition.',
      mood: 'precise systems language, luminous structure, and sharper strategic pacing',
      interaction: 'Keep motion crisp and intentional so the deck feels designed by a strategist, not auto-generated by a template.',
      assetHints: ['systems', 'signal', 'grid', 'clean', 'strategic'],
      structure: ['Opening frame', 'Current state', 'Opportunity', 'System logic', 'Identity architecture', 'Applications', 'Decision'],
    },
    {
      id: 'luxury-brandbook',
      label: 'Luxury brandbook',
      titleSuffix: 'Luxury brandbook presentation',
      summary: 'A more premium brandbook-style deck with material cues, typography focus, and slower reveal pacing to avoid the same AI deck pattern.',
      mood: 'material warmth, elegant typography, and crafted luxury pacing',
      interaction: 'Let transitions feel polished and sparse, with more emphasis on texture, scale, and restraint.',
      assetHints: ['luxury', 'material', 'serif', 'warm', 'brandbook'],
      structure: ['Opening title sequence', 'Brand aura', 'Challenge', 'Logo refinement', 'Typography system', 'Color and material', 'Applications', 'Closing recommendation'],
    },
  ],
};

const DESIGN_GUARDRAILS = [
  'Make the first screen feel like a poster, not a dashboard or template.',
  'Use one dominant visual idea per section and avoid generic card-grid layouts.',
  'Favor bold typography, strong contrast, cinematic spacing, and restrained chrome.',
  'Use backgrounds, motion, and composition to create atmosphere, not filler.',
  'Avoid bland AI aesthetics, startup boilerplate, weak gradients, and repetitive blocks.',
  'Give each client a distinct concept territory, section rhythm, and asset mix instead of reusing the same pattern.',
];

function cleanText(value = '') {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function inferPromptSubject(prompt = '', outputMode = 'portal') {
  const text = cleanText(prompt);
  if (!text) return outputMode === 'presentation' ? 'Presentation' : 'Brand';

  const patterns = [
    /\bfor\s+([^,.:\n]+?)(?:\.|,|:|$)/i,
    /\babout\s+([^,.:\n]+?)(?:\.|,|:|$)/i,
    /\bfor the\s+([^,.:\n]+?)(?:\.|,|:|$)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    const value = cleanText(match?.[1] || '');
    if (value && value.length > 2 && value.length < 80) return value;
  }

  const leading = cleanText(text.split(/[.!?\n]/)[0] || '');
  return leading.length > 80
    ? leading.slice(0, 80).trim()
    : leading || (outputMode === 'presentation' ? 'Presentation' : 'Brand');
}

function slugifyValue(value = '') {
  return cleanText(value)
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(reader.error || new Error(`Failed to read ${file?.name || 'file'}`));
    reader.readAsDataURL(file);
  });
}

function hashValue(value = '') {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = ((hash << 5) - hash) + value.charCodeAt(index);
    hash |= 0;
  }

  return Math.abs(hash);
}

function tryParseJSONCandidate(candidate) {
  if (!candidate) return null;
  try {
    return JSON.parse(candidate);
  } catch {
    return null;
  }
}

function readBuilderWorkspaceCache() {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.localStorage.getItem(BUILDER_DATA_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed?.clients) || !Array.isArray(parsed?.portals)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeBuilderWorkspaceCache(clients = [], portals = []) {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(BUILDER_DATA_CACHE_KEY, JSON.stringify({
      clients,
      portals,
      cachedAt: new Date().toISOString(),
    }));
  } catch {
    // Ignore local storage write issues so the builder can continue.
  }
}

function collectBalancedJsonCandidates(text = '') {
  const candidates = [];

  for (let start = 0; start < text.length; start += 1) {
    const opener = text[start];
    if (opener !== '{' && opener !== '[') continue;

    const stack = [opener];
    let inString = false;
    let escaped = false;

    for (let index = start + 1; index < text.length; index += 1) {
      const char = text[index];

      if (inString) {
        if (escaped) {
          escaped = false;
        } else if (char === '\\') {
          escaped = true;
        } else if (char === '"') {
          inString = false;
        }
        continue;
      }

      if (char === '"') {
        inString = true;
        continue;
      }

      if (char === '{' || char === '[') {
        stack.push(char);
        continue;
      }

      if (char === '}' || char === ']') {
        const last = stack[stack.length - 1];
        if ((char === '}' && last === '{') || (char === ']' && last === '[')) {
          stack.pop();
          if (!stack.length) {
            candidates.push(text.slice(start, index + 1));
            break;
          }
        } else {
          break;
        }
      }
    }
  }

  return candidates.sort((a, b) => b.length - a.length);
}

function extractJSON(text) {
  const source = String(text || '').trim();
  if (!source) return null;

  const fencedBlocks = Array.from(source.matchAll(/```(?:json)?\s*([\s\S]*?)```/g))
    .map((match) => match[1]?.trim())
    .filter(Boolean);

  const directCandidates = [
    ...fencedBlocks,
    source,
  ];

  for (const candidate of directCandidates) {
    const parsed = tryParseJSONCandidate(candidate);
    if (parsed && typeof parsed === 'object') return parsed;
  }

  const balancedCandidates = collectBalancedJsonCandidates(source);
  for (const candidate of balancedCandidates) {
    const parsed = tryParseJSONCandidate(candidate);
    if (parsed && typeof parsed === 'object') return parsed;
  }

  return null;
}

const GENERIC_PORTAL_COPY = new Set([
  'evolving your brand vision',
  'the story behind the brand.',
  'your mark.',
  'the palette.',
  'the voice, set in type.',
  'what do you think?',
  'premium marketing consultancy specializing in brand evolution and strategic design',
  'everything you see here was crafted specifically for you. scroll to experience your full brand identity.',
  'gallery of architectural narratives',
  'contemporary creative portfolio where space, light, and story converge',
]);

function shouldReplacePortalCopy(value = '') {
  const text = cleanText(value).toLowerCase();
  return !text || GENERIC_PORTAL_COPY.has(text);
}

function getPortalFallbackPalette(styleMode = 'cinematic') {
  const palettes = {
    cinematic: [
      {name: 'Night', hex: '#090911', role: 'Atmosphere'},
      {name: 'Signal Blue', hex: '#60A5FA', role: 'Motion accent'},
      {name: 'Smoke', hex: '#CBD5E1', role: 'Typography contrast'},
      {name: 'Ember', hex: '#F97316', role: 'Editorial warmth'},
    ],
    editorial: [
      {name: 'Carbon', hex: '#111111', role: 'Base field'},
      {name: 'Clay', hex: '#7C2D12', role: 'Editorial heat'},
      {name: 'Canvas', hex: '#E7E5E4', role: 'Whitespace'},
      {name: 'Rust', hex: '#FB923C', role: 'Accent note'},
    ],
    luxury: [
      {name: 'Graphite', hex: '#141414', role: 'Primary field'},
      {name: 'Champagne', hex: '#D6C6A5', role: 'Luxury accent'},
      {name: 'Porcelain', hex: '#F5F1E8', role: 'Soft contrast'},
      {name: 'Bronze', hex: '#8E6B3E', role: 'Material cue'},
    ],
    bold: [
      {name: 'Obsidian', hex: '#120F1D', role: 'Base field'},
      {name: 'Magenta', hex: '#EC4899', role: 'Campaign energy'},
      {name: 'Electric', hex: '#3B82F6', role: 'Contrast signal'},
      {name: 'Cloud', hex: '#F8FAFC', role: 'Typography'},
    ],
    minimal: [
      {name: 'Night Ink', hex: '#0B1120', role: 'Base contrast'},
      {name: 'Fog', hex: '#CBD5E1', role: 'Typography support'},
      {name: 'Slate', hex: '#334155', role: 'Structure'},
      {name: 'Signal Blue', hex: '#60A5FA', role: 'Quiet accent'},
    ],
  };

  return palettes[styleMode] || palettes.cinematic;
}

function hydratePortalContent(content = {}, {plan, client, styleMode}) {
  const next = {...(content || {})};
  const company = cleanText(client?.company || client?.name || plan?.briefSubject || next.brand?.name || 'Brand');
  const structure = Array.isArray(plan?.structure) ? plan.structure : [];
  const logoSignals = plan?.referenceIntelligence?.logoSignals || [];
  const visualSignals = plan?.referenceIntelligence?.visualSignals || [];
  const selectedAssets = Array.isArray(plan?.selectedAssets) ? plan.selectedAssets : [];
  const textAsset = selectedAssets.find((item) => item.category === 'text-animations');
  const componentAsset = selectedAssets.find((item) => item.category === 'components');
  const animationAsset = selectedAssets.find((item) => item.category === 'animations');
  const conceptSummary = cleanText(plan?.summary || plan?.visualThesis || '');

  next.hero = {...(next.hero || {})};
  next.brand = {...(next.brand || {})};
  next.logo = {...(next.logo || {})};
  next.colors = {...(next.colors || {})};
  next.typography = {...(next.typography || {})};
  next.cta = {...(next.cta || {})};

  if (shouldReplacePortalCopy(next.hero.headline)) {
    next.hero.headline = company;
  }
  if (shouldReplacePortalCopy(next.hero.subheadline)) {
    next.hero.subheadline = cleanText(plan?.visualThesis || plan?.summary || 'Brand evolution, redefined.');
  }
  if (shouldReplacePortalCopy(next.hero.intro)) {
    next.hero.intro = cleanText([conceptSummary, visualSignals[0]].filter(Boolean).join(' '));
  }
  if (shouldReplacePortalCopy(next.brand.headline)) {
    next.brand.headline = structure[1] || 'Why this identity now';
  }
  if (shouldReplacePortalCopy(next.brand.positioning)) {
    next.brand.positioning = cleanText(
      visualSignals.slice(0, 2).join(' ') || conceptSummary || `${company} needs a more distinct point of view and a more memorable system.`
    );
  }
  if (!Array.isArray(next.brand.pillars) || !next.brand.pillars.length || next.brand.pillars.every((item) => /pillar/i.test(item?.title || ''))) {
    next.brand.pillars = [
      {
        title: 'Strategic clarity',
        desc: cleanText(plan?.visualDirection?.[0] || 'Sharper positioning and stronger story architecture.'),
      },
      {
        title: 'Identity evolution',
        desc: cleanText(logoSignals[0] || 'A mark system that feels more current, distinct, and scalable.'),
      },
      {
        title: 'Motion language',
        desc: cleanText(plan?.interactionThesis?.[0] || 'Movement used to create hierarchy and atmosphere, not filler.'),
      },
    ];
  }
  if (shouldReplacePortalCopy(next.logo.headline)) {
    next.logo.headline = structure[3] || 'Identity system';
  }
  if (shouldReplacePortalCopy(next.logo.rationale)) {
    next.logo.rationale = cleanText(
      logoSignals.join(' ') || plan?.interactionThesis?.[0] || 'A mark designed to scale across every touchpoint with more confidence and presence.'
    );
  }
  if (!Array.isArray(next.colors.palette) || !next.colors.palette.length) {
    next.colors.palette = getPortalFallbackPalette(styleMode);
  }
  if (shouldReplacePortalCopy(next.colors.headline)) {
    next.colors.headline = structure[5] || 'Color system';
  }
  if (!Array.isArray(next.typography.fonts) || !next.typography.fonts.length) {
    next.typography.fonts = [
      {
        name: 'Display',
        typeface: styleMode === 'luxury' ? 'Canela / Editorial Serif' : 'Inter Tight',
        usage: cleanText(textAsset?.rationale || 'Headlines and dominant brand statements'),
      },
      {
        name: 'Body',
        typeface: styleMode === 'editorial' ? 'Inter / System Sans' : 'Inter',
        usage: cleanText(componentAsset?.rationale || 'Narrative copy and supporting interface language'),
      },
    ];
  }
  if (shouldReplacePortalCopy(next.typography.headline)) {
    next.typography.headline = structure[5] || 'Typography system';
  }
  if (shouldReplacePortalCopy(next.cta.headline)) {
    next.cta.headline = structure[structure.length - 1] || 'Ready for rollout';
  }
  if (shouldReplacePortalCopy(next.cta.body)) {
    next.cta.body = cleanText(
      animationAsset?.rationale || plan?.summary || 'Approve this direction to move into refinement, production, and rollout.'
    );
  }

  return next;
}

function createFallbackStructuredOutput({outputMode, plan, client, styleMode}) {
  if (!plan) return null;

  if (outputMode === 'presentation') {
    const slides = (plan.structure || []).map((section, index) => ({
      eyebrow: index === 0 ? 'Opening' : `0${index + 1}`.slice(-2),
      title: section,
      subtitle: index === 0
        ? cleanText(plan.visualThesis || plan.summary || '')
        : cleanText(plan.visualDirection?.[index - 1] || plan.summary || ''),
      body: cleanText(
        index === 0
          ? plan.summary || ''
          : plan.interactionThesis?.[index - 1] || plan.visualDirection?.[index - 1] || plan.summary || '',
      ),
      bullets: index === 0
        ? (plan.selectedAssets || []).map((asset) => asset.title).slice(0, 4)
        : [],
    }));

    return {
      mode: 'presentation',
      presentation: {
        title: cleanText(plan.title || `${plan?.briefSubject || client?.name || 'Presentation'} concept`),
        theme: styleMode === 'luxury' ? 'serif' : styleMode === 'minimal' ? 'moon' : 'black',
        transition: styleMode === 'bold' ? 'zoom' : 'slide',
        slides,
      },
    };
  }

  const company = cleanText(client?.company || client?.name || plan?.briefSubject || 'Brand');
  const structure = Array.isArray(plan.structure) ? plan.structure : [];
  const draft = hydratePortalContent({
    hero: {
      headline: company,
      subheadline: cleanText(plan.title || plan.visualThesis || 'Directed brand evolution'),
      intro: cleanText(plan.summary || plan.visualDirection?.[0] || ''),
    },
    brand: {
      headline: structure[1] || 'Strategic direction',
      positioning: cleanText(plan.visualDirection?.slice(0, 2).join(' ') || plan.summary || ''),
    },
    logo: {
      headline: structure[3] || 'Identity system',
      rationale: cleanText(plan.referenceIntelligence?.logoSignals?.join(' ') || plan.summary || ''),
    },
    colors: {
      headline: structure[5] || 'Color system',
    },
    typography: {
      headline: structure[5] || 'Typography system',
    },
    cta: {
      headline: structure[structure.length - 1] || 'Next step',
      body: cleanText(plan.interactionThesis?.[0] || plan.summary || ''),
    },
  }, {plan, client, styleMode});

  return {
    mode: 'portal',
    portal: withPortalMetadata(draft, {
      templateId: styleMode === 'minimal' ? 'brand-reveal-minimal' : styleMode === 'bold' ? 'full-identity' : 'brand-reveal-v1',
      styleMode,
    }),
  };
}

function normalizeBuilderPayload(outputMode, json, options = {}) {
  if (!json) return null;

  if (outputMode === 'presentation') {
    if (json.mode === 'presentation' && json.presentation) return json;
    if (json.presentation) return {mode: 'presentation', presentation: json.presentation};
    return {mode: 'presentation', presentation: json};
  }

  const base = json.mode === 'portal' && json.portal ? json.portal : json;
  return hydratePortalContent(base, options);
}

function withPortalMetadata(content, {templateId, styleMode}) {
  if (!content || typeof content !== 'object') return content;

  return {
    ...content,
    portalTemplate: content.portalTemplate || templateId || 'brand-reveal-v1',
    artDirection: content.artDirection || styleMode || 'cinematic',
  };
}

function pickConceptProfile({prompt, outputMode, styleMode, client, referenceSite = ''}) {
  const profiles = CONCEPT_PROFILES[outputMode] || [];
  const promptText = cleanText(`${prompt} ${client?.name || ''} ${client?.company || ''} ${referenceSite}`).toLowerCase();
  const styleLabel = STYLE_MODES.find((option) => option.value === styleMode)?.label.toLowerCase() || styleMode;

  const ranked = profiles
    .map((profile) => {
      let score = 0;

      if (promptText.includes(profile.id.replace(/-/g, ' '))) score += 8;
      if (promptText.includes(profile.label.toLowerCase())) score += 8;
      if (profile.assetHints.some((hint) => promptText.includes(hint))) score += 4;
      if (promptText.includes(styleLabel)) score += 2;
      if (styleMode === 'luxury' && profile.id.includes('luxury')) score += 5;
      if (styleMode === 'minimal' && profile.id.includes('minimal')) score += 5;
      if (styleMode === 'bold' && profile.id.includes('campaign')) score += 5;
      if (styleMode === 'editorial' && (profile.id.includes('editorial') || profile.id.includes('story'))) score += 5;
      if (styleMode === 'cinematic' && (profile.id.includes('noir') || profile.id.includes('luminous'))) score += 4;

      return {profile, score};
    })
    .sort((a, b) => b.score - a.score);

  const bestScore = ranked[0]?.score ?? 0;
  const pool = ranked
    .filter((item) => item.score >= bestScore - 2)
    .map((item) => item.profile);

  const seed = `${client?.name || ''}|${client?.company || ''}|${prompt}|${styleMode}|${outputMode}|${referenceSite}`;
  return pool[hashValue(seed) % pool.length] || profiles[0];
}

function isLogoRevealIdentityPrompt(text = '', attachments = []) {
  const lower = cleanText(text).toLowerCase();
  const attachmentText = attachments.map((item) => `${item?.name || ''} ${item?.type || ''}`).join(' ').toLowerCase();
  return /(logo reveal|wordmark reveal|brand identity presentation|logo evolution|icon deconstruction|heavy lowercase|all lowercase|wordmark|rebrand)/.test(lower)
    || /(logo-reveal|wordmark|brand-identity)/.test(attachmentText);
}

function createStructure(prompt, outputMode, concept, referenceIntelligence) {
  const text = cleanText(prompt).toLowerCase();
  const isInstitutional = referenceIntelligence?.isInstitutional;
  const isCampaign = /campaign|launch|rollout|activation|awareness/.test(text);
  const isIdentity = /brand|identity|logo|rebrand|wordmark|mark/.test(text);
  const isProposal = /proposal|sales|pitch|business development/.test(text);
  const isLogoReveal = isLogoRevealIdentityPrompt(text);

  if (outputMode === 'presentation') {
    if (isLogoReveal) {
      return [
        'Opening title',
        'Wordmark reveal',
        'Brand context',
        'Brand philosophy',
        'Logo evolution',
        'Icon deconstruction',
        'Logo system',
        'Typography system',
        'Color direction',
        'Applications',
        'Closing',
      ];
    }

    if (isCampaign) {
      return [
        'Opening statement',
        'Audience context',
        'Campaign idea',
        'Channel rollout',
        'Key creative moments',
        'Proof points',
        'Next step',
      ];
    }

    if (isInstitutional) {
      return [
        'Opening statement',
        'Institutional context',
        'Trust and credibility problem',
        'Identity direction',
        'Seal or logo system',
        'Typography and color',
        'Applications',
        'Recommendation',
      ];
    }

    if (isIdentity) {
      return [
        'Opening statement',
        'Current brand problem',
        'Strategic direction',
        'Logo evolution',
        'Icon system',
        'Typography and color',
        'Applications',
        'Recommendation',
      ];
    }

    if (isProposal) {
      return [
        'Opening statement',
        'Opportunity overview',
        'Offer structure',
        'Differentiators',
        'Proof points',
        'Timeline',
        'Decision point',
      ];
    }

    return concept?.structure || [
      'Opening statement',
      'Context',
      'Core idea',
      'System',
      'Applications',
      'Recommendation',
    ];
  }

  if (isLogoReveal) {
    return [
      'Hero statement',
      'Wordmark reveal',
      'Brand context',
      'Logo evolution',
      'Icon deconstruction',
      'Logo system',
      'Typography system',
      'Color direction',
      'Applications',
      'Closing recommendation',
    ];
  }

  if (isInstitutional) {
    return [
      'Hero statement',
      'Institutional context',
      'Identity challenge',
      'Logo system',
      'Typography and color',
      'Applications',
      'Decision and next step',
    ];
  }

  if (isCampaign) {
    return [
      'Hero statement',
      'Campaign context',
      'Big idea',
      'Channel moments',
      'Proof and deliverables',
      'Call to action',
    ];
  }

  if (isIdentity) {
    return [
      'Hero statement',
      'Brand context',
      'Identity challenge',
      'Logo direction',
      'Typography and color',
      'Applications',
      'Decision and next step',
    ];
  }

  if (isProposal) {
    return [
      'Hero statement',
      'Opportunity overview',
      'Offer structure',
      'Proof points',
      'Timeline and decision',
    ];
  }

  return concept?.structure || [
    'Hero statement',
    'Context',
    'Core idea',
    'Applications',
    'Decision and next step',
  ];
}

function pickAsset(plan, category) {
  return plan?.selectedAssets?.find((item) => item.category === category) || null;
}

function inferBriefFocus({prompt, client, referenceIntelligence, outputMode}) {
  const text = cleanText(prompt).toLowerCase();
  const clientLabel = client?.name || client?.company || 'the client';

  if (referenceIntelligence?.isInstitutional) {
    return `a more credible and distinctive institutional identity for ${clientLabel}`;
  }

  if (/brand|identity|logo|rebrand|wordmark|mark/.test(text)) {
    return `a clearer identity system and stronger first impression for ${clientLabel}`;
  }

  if (/campaign|launch|rollout|activation|awareness/.test(text)) {
    return `a campaign story with sharper momentum and clearer activation moments for ${clientLabel}`;
  }

  if (/proposal|sales|pitch/.test(text)) {
    return `a more convincing pitch narrative and clearer proof structure for ${clientLabel}`;
  }

  if (outputMode === 'presentation') {
    return `a presentation with stronger pacing, clearer hierarchy, and a more specific client point of view`;
  }

  return `a portal with stronger hierarchy, clearer messaging, and a more specific client point of view`;
}

function createPlanSummary({outputMode, styleMode, client, prompt, referenceIntelligence, concept}) {
  const styleLabel = STYLE_MODES.find((option) => option.value === styleMode)?.label || styleMode;
  const clientLabel = client?.name || client?.company || inferPromptSubject(prompt, outputMode) || 'the client';
  const focus = inferBriefFocus({prompt, client, referenceIntelligence, outputMode});
  const mood = cleanText(concept?.mood || '');
  const medium = outputMode === 'presentation' ? 'presentation' : 'portal';

  return `${styleLabel} ${medium} for ${clientLabel}, centered on ${focus}${mood ? `, with ${mood}.` : '.'}`;
}

function createVisualThesis({styleMode, outputMode, concept, client, prompt, referenceIntelligence}) {
  const styleLabel = STYLE_MODES.find((option) => option.value === styleMode)?.label || styleMode;
  const clientLabel = client?.name || client?.company || 'the client';
  const focus = inferBriefFocus({prompt, client, referenceIntelligence, outputMode});
  const mood = cleanText(concept?.mood || 'clear hierarchy, stronger typography, and more deliberate pacing');
  const medium = outputMode === 'presentation' ? 'presentation' : 'portal';

  return `${styleLabel} ${medium} for ${clientLabel}, built around ${focus} with ${mood}.`;
}

function createInteractionThesis({outputMode, styleMode, prompt, referenceIntelligence, concept}) {
  const text = cleanText(prompt).toLowerCase();
  const isCampaign = /campaign|launch|rollout|activation|awareness/.test(text);
  const lines = [];

  if (concept?.interaction) {
    lines.push(concept.interaction);
  }

  if (outputMode === 'presentation') {
    lines.push('Use measured title sequencing and clean slide transitions so the story feels directed rather than template driven.');
    lines.push(referenceIntelligence?.isInstitutional
      ? 'Keep motion restrained and credible, with emphasis on clarity, trust, and composure over spectacle.'
      : isCampaign
        ? 'Let the pacing build momentum between sections so campaign moments feel sharper and more active.'
        : 'Use motion to reinforce hierarchy and keep each section change feeling intentional.');
  } else {
    lines.push(styleMode === 'minimal'
      ? 'Rely on restrained scroll depth, slower reveals, and stronger typography instead of constant animation.'
      : 'Use scroll depth and a small number of stronger reveal moments so the portal feels spatial instead of static.');
    lines.push(referenceIntelligence?.isInstitutional
      ? 'Favor steadier pacing, cleaner transitions, and fewer ornamental effects so the brand reads as credible.'
      : isCampaign
        ? 'Use sharper rhythm changes and more obvious section handoffs so the campaign story feels active.'
        : 'Use background motion only as support; the headline and content hierarchy should stay in control.');
  }

  return lines;
}

function createContentPlan(outputMode, structure) {
  const list = structure || [];

  if (outputMode === 'presentation') {
    return [
      {label: 'Opening', section: list[0] || 'Opening title sequence'},
      {label: 'Support', section: list[2] || list[1] || 'Strategic direction'},
      {label: 'Detail', section: list[5] || list[4] || 'Icon system'},
      {label: 'Close', section: list[list.length - 1] || 'Closing recommendation'},
    ];
  }

  return [
    {label: 'Hero', section: list[0] || 'Hero introduction'},
    {label: 'Story', section: list[1] || 'Brand story'},
    {label: 'Detail', section: list[4] || list[3] || 'Icon system'},
    {label: 'Decision', section: list[list.length - 1] || 'Decision / next step'},
  ];
}

function listReferenceContext(references = [], attachments = []) {
  const refLines = references.map((item) => `- ${item.label}${item.value ? `: ${item.value}` : ''}`);
  const fileLines = attachments.map((item) => {
    const cueText = (item.cues || []).length ? ` — cues: ${(item.cues || []).join(', ')}` : '';
    return `- ${item.name}${item.type ? ` (${item.type})` : ''}${cueText}`;
  });

  return {
    refLines,
    fileLines,
  };
}

function extractKeywords(value = '') {
  return cleanText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

function uniq(values = []) {
  return [...new Set(values.filter(Boolean))];
}

function mergeReferenceItems(primary = [], secondary = []) {
  const seen = new Set();
  return [...primary, ...secondary].filter((item) => {
    const key = cleanText(item?.value || item?.label || item?.id || '').toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function mergeAttachmentItems(primary = [], secondary = []) {
  const seen = new Set();
  return [...primary, ...secondary].filter((item) => {
    const key = cleanText(`${item?.name || ''}|${item?.type || ''}|${item?.id || ''}`).toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function formatLibraryItemMeta(item) {
  const parts = [getLibraryTypeLabel(item?.libraryType)];
  if (item?.clientName) parts.push(item.clientName);
  if (Array.isArray(item?.tags) && item.tags.length) parts.push(item.tags.slice(0, 2).join(' · '));
  return parts.join(' • ');
}

function buildAttachmentRecord(file, dataUrl = '') {
  const name = file?.name || 'attachment';
  const type = file?.type || 'file';
  const keywords = extractKeywords(name);
  const cues = [];

  if (type.startsWith('image/')) cues.push('image reference');
  if (keywords.some((token) => ['logo', 'brand', 'identity', 'mark'].includes(token))) cues.push('identity reference');
  if (keywords.some((token) => ['crest', 'seal', 'shield', 'emblem', 'badge'].includes(token))) cues.push('crest or seal direction');
  if (keywords.some((token) => ['wordmark', 'lockup', 'typography', 'type'].includes(token))) cues.push('wordmark hierarchy');
  if (keywords.some((token) => ['monogram', 'initial', 'letters'].includes(token))) cues.push('monogram exploration');
  if (keywords.some((token) => ['school', 'academy', 'charter', 'college', 'university', 'campus'].includes(token))) cues.push('institutional or academic brand');
  if (keywords.some((token) => ['premium', 'luxury', 'editorial', 'campaign'].includes(token))) cues.push('art direction cue');

  return {
    id: `file-${name}-${file.lastModified}`,
    name,
    type,
    size: file.size,
    cues: uniq(cues),
    keywords: uniq(keywords),
    dataUrl: type.startsWith('image/') || type.startsWith('video/') ? dataUrl : '',
    previewUrl: type.startsWith('image/') || type.startsWith('video/') ? dataUrl : '',
  };
}

function buildReferenceIntelligence({prompt, client, references = [], attachments = []}) {
  const combined = cleanText([
    prompt,
    client?.name || '',
    client?.company || '',
    ...references.map((item) => item.label || item.value || ''),
    ...attachments.flatMap((item) => [item.name || '', ...(item.keywords || []), ...(item.cues || []), ...(item.tags || []), item.libraryType || '']),
  ].join(' ')).toLowerCase();

  const cues = uniq(attachments.flatMap((item) => item.cues || []));
  const keywords = uniq(attachments.flatMap((item) => item.keywords || []));
  const tags = uniq(attachments.flatMap((item) => item.tags || []));
  const libraryTypes = uniq(attachments.map((item) => item.libraryType).filter(Boolean));
  const isInstitutional = /(school|academy|charter|college|university|campus|institutional|district)/.test(combined);
  const logoSignals = [];
  const visualSignals = [];

  if (attachments.length) {
    visualSignals.push(`${attachments.length} uploaded reference file${attachments.length === 1 ? '' : 's'} should influence the concept directly.`);
  }

  if (libraryTypes.length) {
    visualSignals.push(`Saved library matches in play: ${libraryTypes.map((type) => getLibraryTypeLabel(type)).join(', ')}.`);
  }

  if (cues.includes('identity reference')) {
    logoSignals.push('Treat uploaded identity files as direct structural references for the mark system, not just general mood boards.');
  }

  if (cues.includes('crest or seal direction')) {
    logoSignals.push('Preserve credible crest, seal, or shield logic instead of collapsing the identity into a basic monogram.');
  }

  if (cues.includes('wordmark hierarchy')) {
    logoSignals.push('Carry through a real wordmark lockup with hierarchy, not just standalone initials.');
  }

  if (cues.includes('monogram exploration') && cues.includes('crest or seal direction')) {
    logoSignals.push('Use the monogram as a secondary support mark inside a broader emblem system rather than the entire identity.');
  }

  if (isInstitutional) {
    logoSignals.push('Institutional projects should feel credible, heritage-aware, and formally composed, with emblem logic and academic character.');
    visualSignals.push('Use more institutional typography, seal logic, and presentation framing rather than startup-brand simplification.');
  }

  if (keywords.some((token) => ['navy', 'blue', 'cream', 'ivory', 'gold', 'bronze'].includes(token))) {
    visualSignals.push('Respect any attached palette cues if they appear in the references.');
  }

  if (tags.includes('luxury')) {
    visualSignals.push('Lean into quieter premium pacing, material contrast, and fewer but stronger frames.');
  }

  if (tags.includes('editorial')) {
    visualSignals.push('Use more editorial hierarchy, stronger typography, and more negative space.');
  }

  if (tags.includes('gsap') || tags.includes('motion')) {
    visualSignals.push('Bring in a few stronger motion beats like title sequencing, parallax depth, or pinned proof reveals, but keep them restrained.');
  }

  if (tags.includes('systems') || tags.includes('product-storytelling')) {
    visualSignals.push('Structure the story more like a product or system walkthrough with clearer modules and proof states.');
  }

  if (references.some((item) => /^https?:\/\//.test(item.value || ''))) {
    visualSignals.push('Cross-check uploaded references against the live brand site so the output feels grounded in the existing brand reality.');
  }

  const summaryParts = [];
  if (cues.length) summaryParts.push(`Reference cues: ${cues.join(', ')}`);
  if (isInstitutional) summaryParts.push('Institutional brand signals detected');

  return {
    summary: summaryParts.join(' · '),
    logoSignals: uniq(logoSignals),
    visualSignals: uniq(visualSignals),
    isInstitutional,
    tags,
    libraryTypes,
  };
}

function buildVisualReferenceMessage({client, portal, plan, references = [], attachments = []}) {
  const activeReferences = references?.length ? references : (plan?.fetchedContext?.referenceItems || []);
  const activeAttachments = attachments?.length ? attachments : (plan?.fetchedContext?.attachmentItems || []);
  const imageAttachments = activeAttachments.filter((item) => item?.dataUrl && item?.type?.startsWith('image/')).slice(0, 3);

  const lines = [];

  if (client) {
    lines.push(`Selected client: ${client.name}${client.company ? ` — ${client.company}` : ''}`);
  }

  if (portal?.slug) {
    lines.push(`Target portal: ${portal.slug}`);
  }

  if (activeReferences.length) {
    lines.push(`References: ${activeReferences.map((item) => item.value || item.label).join(' | ')}`);
  }

  if (activeAttachments.length) {
    lines.push('Uploaded references:');
    activeAttachments.forEach((item) => {
      lines.push(`- ${item.name}${item.cues?.length ? ` — ${item.cues.join(', ')}` : ''}`);
    });
  }

  if (plan?.referenceIntelligence?.logoSignals?.length) {
    lines.push(`Logo cues: ${plan.referenceIntelligence.logoSignals.join(' | ')}`);
  }

  if (plan?.referenceIntelligence?.visualSignals?.length) {
    lines.push(`Visual cues: ${plan.referenceIntelligence.visualSignals.join(' | ')}`);
  }

  if (!imageAttachments.length) {
    return lines.length
      ? {role: 'user', content: `Visual reference context:\n${lines.join('\n')}`}
      : null;
  }

  return {
    role: 'user',
    content: [
      {
        type: 'text',
        text: `Visual reference context:\n${lines.join('\n')}\nUse the attached images as direct visual references for identity structure, logo hierarchy, and art direction.`,
      },
      ...imageAttachments.map((item) => ({
        type: 'image_url',
        image_url: {url: item.dataUrl},
      })),
    ],
  };
}

function getReferenceSite(prompt, references = []) {
  const promptSite = inferReferenceSite(prompt);
  if (promptSite) return promptSite;
  return references.find((item) => /^https?:\/\//.test(item.value || ''))?.value || '';
}

function buildDesignGuardrails({outputMode, styleMode}) {
  const styleLabel = STYLE_MODES.find((option) => option.value === styleMode)?.label || styleMode;
  return [
    `Design direction: ${styleLabel}`,
    outputMode === 'presentation'
      ? 'Use editorial slide composition with clear pacing, immersive backgrounds, and premium typography.'
      : 'Use a full-canvas portal composition with spatial depth, restrained UI chrome, and strong narrative hierarchy.',
    ...DESIGN_GUARDRAILS,
  ];
}

function buildLogoGuidance({prompt, client, references = [], attachments = []}) {
  const contextText = cleanText([
    prompt,
    client?.name || '',
    client?.company || '',
    ...references.map((item) => item.label || item.value || ''),
    ...attachments.map((item) => item.name || ''),
  ].join(' ')).toLowerCase();

  const isInstitutional = /(school|academy|charter|college|university|education|institutional|campus|district)/.test(contextText);

  const lines = [
    'Avoid simplistic initials inside a plain circle or generic geometric badge unless the user explicitly asks for that direction.',
    'If references or uploaded files imply a logo direction, use them as structural inspiration rather than flattening them into a basic monogram.',
    'Treat the logo system as a family: emblem or symbol, wordmark lockup, and monogram or secondary mark.',
  ];

  if (isInstitutional) {
    lines.push('For institutional or academic brands, prefer credible crest, shield, or seal logic with real internal iconography, hierarchy, and heritage cues over startup-style simplification.');
  }

  lines.push('When returning structured content, make the logo section feel specific and art directed, with enough rationale to explain why the mark system is distinctive.');

  return lines;
}

function inferPortalType({prompt, outputMode, referenceIntelligence}) {
  const text = cleanText(prompt).toLowerCase();

  if (outputMode === 'presentation') {
    if (/(brand|identity|logo|rebrand)/.test(text)) return 'Brand identity presentation';
    if (/(campaign|launch|rollout)/.test(text)) return 'Campaign presentation';
    if (/(proposal|sales|pitch)/.test(text)) return 'Proposal presentation';
    return 'Interactive presentation';
  }

  if (referenceIntelligence?.isInstitutional) return 'Institutional portal';
  if (/(brand|identity|logo|rebrand)/.test(text)) return 'Brand reveal portal';
  if (/(campaign|launch|rollout)/.test(text)) return 'Campaign portal';
  if (/(proposal|sales|pitch)/.test(text)) return 'Proposal portal';
  if (/(editorial|story|narrative)/.test(text)) return 'Editorial portal';
  return 'Immersive portal';
}

function inferMotionStyle({outputMode, styleMode, prompt, referenceIntelligence}) {
  const text = cleanText(prompt).toLowerCase();
  const isCampaign = /campaign|launch|rollout|activation|awareness/.test(text);
  const isIdentity = /brand|identity|logo|rebrand|wordmark|mark/.test(text);
  const isLogoReveal = isLogoRevealIdentityPrompt(text);

  const parts = [
    outputMode === 'presentation' ? 'measured slide pacing' : 'restrained scroll depth',
  ];

  if (styleMode === 'minimal') parts.push('slower reveals');
  else if (styleMode === 'bold') parts.push('higher-contrast transitions');
  else if (styleMode === 'editorial') parts.push('typography-led motion');
  else if (styleMode === 'luxury') parts.push('quieter premium pacing');
  else parts.push('clear section handoffs');

  if (referenceIntelligence?.isInstitutional) parts.push('credible, low-noise emphasis');
  else if (isCampaign) parts.push('stronger momentum between sections');
  else if (isLogoReveal) parts.push('logo-reveal pacing with title transitions');
  else if (isIdentity) parts.push('headline-first sequencing');

  return parts.join(' • ');
}

function inferColorMood({styleMode, concept, referenceIntelligence}) {
  const lowerSummary = cleanText(referenceIntelligence?.summary || '').toLowerCase();
  if (/(gold|bronze|amber|warm)/.test(lowerSummary)) return 'dark base with warm metallic accents';
  if (/(blue|azure|cool|luminous)/.test(lowerSummary)) return 'cool dark tones with luminous accents';
  if (styleMode === 'luxury') return 'dark neutrals with warm metallic accents';
  if (styleMode === 'editorial') return 'editorial contrast with muted accent fields';
  if (styleMode === 'bold') return 'high contrast with campaign-color accents';
  if (styleMode === 'minimal') return 'restrained neutrals with one controlled accent';
  return concept?.mood || 'cinematic dark tones with focused accent color';
}

function createUnderstanding({prompt, outputMode, styleMode, client, structure, selectedAssets, attachments = [], referenceIntelligence, concept}) {
  const components = selectedAssets
    .filter((item) => ['components', 'animations', 'text-animations'].includes(item.category))
    .map((item) => item.title)
    .slice(0, 4);

  const assets = attachments.map((item) => item.name).slice(0, 6);

  return {
    portalType: inferPortalType({prompt, outputMode, referenceIntelligence}),
    client: client?.name || 'No client selected',
    artDirection: STYLE_MODES.find((option) => option.value === styleMode)?.label || styleMode,
    sections: structure,
    motionStyle: inferMotionStyle({outputMode, styleMode, prompt, referenceIntelligence}),
    colorMood: inferColorMood({styleMode, concept, referenceIntelligence}),
    components,
    assets,
    summary: referenceIntelligence?.summary || concept?.summary || 'Builder parsed the core visual direction and structure.',
  };
}

function createBuildProgress(structure = []) {
  return (structure || []).map((label, index) => ({
    id: `${label}-${index}`,
    label,
    status: index === 0 ? 'active' : 'queued',
  }));
}

function createPlanArchitecture({outputMode, structure, styleMode, understanding}) {
  const styleLabel = STYLE_MODES.find((option) => option.value === styleMode)?.label || styleMode;
  const flowLabel = outputMode === 'presentation' ? 'scene-based presentation flow' : 'scroll-led portal flow';
  const sectionLabel = `${structure.length || 0} ${outputMode === 'presentation' ? 'core scenes' : 'core sections'} arranged in a clear narrative sequence`;

  return [
    sectionLabel,
    `${flowLabel} with ${understanding?.motionStyle || 'clear transitions and restrained motion'}`,
    `${styleLabel} art direction anchored in ${understanding?.colorMood || 'a specific visual system'}`,
  ].filter(Boolean);
}

function describeSectionFeature(section = '', index = 0, outputMode = 'portal') {
  const lower = cleanText(section).toLowerCase();

  if (/opening|hero/.test(lower)) return `${section} with a stronger first impression and cleaner entry pacing`;
  if (/logo|wordmark|icon|identity/.test(lower)) return `${section} to explain the mark system and make the identity shift feel intentional`;
  if (/color|palette/.test(lower)) return `${section} with a more explicit visual system and stronger contrast cues`;
  if (/typography|type/.test(lower)) return `${section} to establish hierarchy, tone, and the core brand voice`;
  if (/application|proof|service|deliverable/.test(lower)) return `${section} showing how the system performs in real touchpoints`;
  if (/closing|decision|recommendation|next step/.test(lower)) return `${section} that closes the story and points to the rollout move`;

  return outputMode === 'presentation'
    ? `${section} to move the presentation story forward without breaking pacing`
    : `${section} to deepen the portal story and keep the experience specific`;
}

function createSectionFeatures({outputMode, structure = []}) {
  return structure.slice(0, 8).map((section, index) => describeSectionFeature(section, index, outputMode));
}

function createGlobalEffects({outputMode, styleMode, interactionThesis = [], selectedAssets = []}) {
  const effects = [];

  if (outputMode === 'presentation') {
    effects.push('scene-to-scene title sequencing');
    effects.push('immersive background transitions');
  } else {
    effects.push('scroll-led reveals');
    effects.push('section-to-section handoffs');
  }

  if (styleMode === 'cinematic') effects.push('parallax depth');
  if (styleMode === 'bold') effects.push('higher-contrast transitions');
  if (styleMode === 'editorial') effects.push('headline-first motion');
  if (styleMode === 'luxury') effects.push('slower premium pacing');
  if (styleMode === 'minimal') effects.push('restrained movement');

  if (selectedAssets.some((item) => item.category === 'animations')) effects.push('motion presets from the registry');
  if (selectedAssets.some((item) => item.category === 'text-animations')) effects.push('title transitions');
  if (selectedAssets.some((item) => item.category === 'components')) effects.push('signature layout components');

  return uniq([
    ...effects,
    ...interactionThesis.map((item) => cleanText(item).toLowerCase()),
  ]).slice(0, 6);
}

function createAssetsNeeded({referenceSite, attachments = [], selectedAssets = []}) {
  const assets = [];

  if (referenceSite) assets.push(`Reference site: ${referenceSite}`);

  attachments.forEach((item) => {
    const typeLabel = item?.type?.startsWith('video/')
      ? 'Video'
      : item?.type?.startsWith('image/')
        ? 'Image'
        : 'File';
    assets.push(`${typeLabel}: ${item.name}`);
  });

  selectedAssets.forEach((item) => {
    assets.push(`${item.categoryLabel}: ${item.title}`);
  });

  return uniq(assets).slice(0, 6);
}

function createVersionRecord({description, outputMode, plan, extractedJSON}) {
  return {
    id: `version-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    description,
    outputMode,
    title: plan?.title || (outputMode === 'presentation' ? 'Presentation build' : 'Portal build'),
    createdAt: new Date().toISOString(),
    plan,
    extractedJSON,
  };
}

function formatVersionTime(value) {
  try {
    return new Date(value).toLocaleTimeString([], {hour: 'numeric', minute: '2-digit'});
  } catch {
    return '';
  }
}

function createPlan({prompt, outputMode, styleMode, client, references = [], attachments = [], libraryMatches = []}) {
  const referenceContext = [
    ...references.map((item) => item.label),
    ...attachments.map((item) => item.name),
    ...libraryMatches.map((item) => item.title),
  ].join(' ');
  const referenceSite = getReferenceSite(prompt, references);
  const referenceIntelligence = buildReferenceIntelligence({
    prompt,
    client,
    references,
    attachments,
  });
  const concept = pickConceptProfile({
    prompt,
    outputMode,
    styleMode,
    client,
    referenceSite,
  });
  const briefSubject = cleanText(client?.name || client?.company || inferPromptSubject(prompt, outputMode));
  const selectedAssets = pickRegistryRecommendations({
    prompt: `${prompt} ${referenceContext} ${styleMode} ${outputMode} ${(concept?.assetHints || []).join(' ')}`,
    outputMode,
    limit: 4,
    variationSeed: `${client?.name || ''}|${client?.company || ''}|${prompt}|${styleMode}|${outputMode}|${concept?.id || ''}`,
  });
  const structure = createStructure(prompt, outputMode, concept, referenceIntelligence);
  const titleSeed = briefSubject || (outputMode === 'presentation' ? 'Presentation' : 'Portal');
  const designGuardrails = buildDesignGuardrails({outputMode, styleMode});
  const logoGuidance = buildLogoGuidance({prompt, client, references, attachments});
  const understanding = createUnderstanding({
    prompt,
    outputMode,
    styleMode,
    client,
    structure,
    selectedAssets,
    attachments,
    referenceIntelligence,
    concept,
  });
  const interactionThesis = createInteractionThesis({outputMode, styleMode, prompt, referenceIntelligence, concept});
  const architecture = createPlanArchitecture({outputMode, structure, styleMode, understanding});
  const sectionFeatures = createSectionFeatures({outputMode, structure});
  const globalEffects = createGlobalEffects({outputMode, styleMode, interactionThesis, selectedAssets});
  const assetsNeeded = createAssetsNeeded({referenceSite, attachments, selectedAssets});

  return {
    title: outputMode === 'presentation'
      ? `${titleSeed} presentation`
      : `${titleSeed} portal`,
    briefSubject,
    outputMode,
    conceptLabel: concept?.label || '',
    summary: createPlanSummary({outputMode, styleMode, client, prompt, referenceIntelligence, concept}),
    visualThesis: createVisualThesis({styleMode, outputMode, concept, client, prompt, referenceIntelligence}),
    interactionThesis,
    contentPlan: createContentPlan(outputMode, structure),
    architecture,
    sectionFeatures,
    globalEffects,
    assetsNeeded,
    visualDirection: [
      concept?.mood ? `Creative territory: ${concept.mood}` : null,
      `Art direction: ${STYLE_MODES.find((option) => option.value === styleMode)?.label || styleMode}`,
      outputMode === 'presentation'
        ? 'Presentation-safe motion with slide sequencing, title transitions, and immersive backgrounds'
        : 'Portal-first motion with scroll-led reveals, spatial layering, and ambient backgrounds',
      `Asset mix: ${selectedAssets.map((item) => `${item.title} (${item.categoryLabel})`).join(', ')}`,
      concept?.mood ? `Mood: ${concept.mood}` : null,
      'Refine typography, contrast, and pacing to feel premium instead of template-like',
      ...designGuardrails.slice(0, 2),
    ].filter(Boolean),
    structure,
    understanding,
    selectedAssets,
    concept,
    designGuardrails,
    logoGuidance,
    referenceIntelligence,
    fetchedContext: {
      client: client ? `${client.name}${client.company ? ` — ${client.company}` : ''}` : 'No client selected',
      referenceSite: referenceSite || '',
      references: references.length,
      attachments: attachments.length,
      libraryMatches,
      referenceItems: references,
      attachmentItems: attachments.map((item) => ({name: item.name, type: item.type})),
      output: outputMode,
    },
    checks: [
      'Validate structure before generation',
      'Confirm selected assets fit the output mode and narrative structure',
      'Generate structured JSON for preview',
      'Save only after reviewing preview output',
    ],
  };
}

function buildContextMessage({client, portal, plan}) {
  const lines = [];

  if (client) {
    lines.push(`Selected client: ${client.name}${client.company ? ` — ${client.company}` : ''}`);
    if (client.stage) lines.push(`Pipeline stage: ${client.stage}`);
  }

  if (portal) {
    lines.push(`Target portal slug: ${portal.slug}`);
    if (portal.template_id) lines.push(`Template: ${portal.template_id}`);
  }

  if (plan?.fetchedContext?.referenceSite) {
    lines.push(`Reference site: ${plan.fetchedContext.referenceSite}`);
  }

  if (plan?.fetchedContext?.referenceItems?.length) {
    lines.push(`Manual references: ${plan.fetchedContext.referenceItems.map((item) => item.value || item.label).join(' | ')}`);
  }

  if (plan?.fetchedContext?.attachmentItems?.length) {
    lines.push(`Attached files: ${plan.fetchedContext.attachmentItems.map((item) => `${item.name}${item.type ? ` (${item.type})` : ''}`).join(', ')}`);
  }

  if (plan?.referenceIntelligence?.summary) {
    lines.push(`Reference intelligence: ${plan.referenceIntelligence.summary}`);
  }

  if (plan) {
    lines.push(`Approved output mode: ${plan.outputMode}`);
    lines.push(`Approved summary: ${plan.summary}`);
    lines.push(`Approved structure: ${plan.structure.join(' | ')}`);
    if (plan.fetchedContext?.references) lines.push(`Manual references attached: ${plan.fetchedContext.references}`);
    if (plan.fetchedContext?.attachments) lines.push(`Files attached: ${plan.fetchedContext.attachments}`);
    lines.push(
      `Approved selected assets: ${plan.selectedAssets
        .map((item) => `${item.title} (${formatRegistryCategoryLabel(item.category)})`)
        .join(', ')}`
    );
    if (plan.referenceIntelligence?.logoSignals?.length) {
      lines.push(`Logo cues: ${plan.referenceIntelligence.logoSignals.join(' | ')}`);
    }
    if (plan.referenceIntelligence?.visualSignals?.length) {
      lines.push(`Visual cues: ${plan.referenceIntelligence.visualSignals.join(' | ')}`);
    }
  }

  return lines.join('\n');
}

function buildPlanMessage(plan) {
  return [
    `Approved plan: ${plan.title}`,
    plan.summary,
    '',
    `Visual thesis: ${plan.visualThesis}`,
    '',
    'Interaction thesis:',
    ...plan.interactionThesis.map((item) => `- ${item}`),
    '',
    'Visual direction:',
    ...plan.visualDirection.map((item) => `- ${item}`),
    '',
    'Structure:',
    ...plan.structure.map((item, index) => `${index + 1}. ${item}`),
    '',
    'Selected assets:',
    ...plan.selectedAssets.map((item) => `- ${item.title} (${item.categoryLabel}, ${item.supportLabel}): ${item.rationale}`),
    ...(plan.referenceIntelligence?.logoSignals?.length ? ['', 'Reference-led logo cues:', ...plan.referenceIntelligence.logoSignals.map((item) => `- ${item}`)] : []),
    ...(plan.referenceIntelligence?.visualSignals?.length ? ['', 'Reference-led visual cues:', ...plan.referenceIntelligence.visualSignals.map((item) => `- ${item}`)] : []),
    '',
    'Logo guidance:',
    ...(plan.logoGuidance || []).map((item) => `- ${item}`),
    '',
    'Design guardrails:',
    ...(plan.designGuardrails || DESIGN_GUARDRAILS).map((item) => `- ${item}`),
  ].join('\n');
}

function normalizeTextReply(reply = '') {
  return String(reply || '')
    .replace(/```(?:markdown|md|text)?/g, '')
    .replace(/```/g, '')
    .trim();
}

function parseMaybeJSON(value = '') {
  const text = String(value || '').trim();
  if (!text) return null;

  const candidates = [text];
  const objectStart = text.indexOf('{');
  const objectEnd = text.lastIndexOf('}');
  if (objectStart >= 0 && objectEnd > objectStart) {
    candidates.push(text.slice(objectStart, objectEnd + 1));
  }

  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate);
    } catch {
      // try next candidate
    }
  }

  return null;
}

function summarizeBriefForRail(value = '') {
  const text = normalizeTextReply(value);
  if (!text) {
    return {
      eyebrow: 'Prompt',
      body: 'Start with a prompt and I’ll turn it into a directed plan and preview.',
      details: [],
      raw: '',
      isStructured: false,
    };
  }

  const parsed = parseMaybeJSON(text);
  if (!parsed || typeof parsed !== 'object') {
    const compact = cleanText(text);
    return {
      eyebrow: 'Prompt',
      body: compact.length > 240 ? `${compact.slice(0, 237)}…` : compact,
      details: [],
      raw: text,
      isStructured: false,
    };
  }

  const hero = parsed.hero || {};
  const brand = parsed.brand || {};
  const colors = parsed.colors || {};
  const typography = parsed.typography || {};
  const motion = parsed.motion || {};
  const body = cleanText(
    hero.subheadline
    || hero.intro
    || brand.positioning
    || brand.approach
    || parsed.summary
    || 'Structured direction captured for the build.'
  );
  const details = [
    hero.headline ? `Headline: ${hero.headline}` : '',
    brand.positioning ? `Positioning: ${brand.positioning}` : '',
    motion.style || motion.language ? `Motion: ${motion.style || motion.language}` : '',
    typography.display || typography.headline ? `Type: ${typography.display || typography.headline}` : '',
    Array.isArray(colors.palette) && colors.palette.length ? `Palette: ${colors.palette.slice(0, 3).map((item) => item.name || item.hex || item).join(', ')}` : '',
  ].filter(Boolean).slice(0, 3);

  return {
    eyebrow: 'Structured brief',
    body: body || 'Structured direction captured for the build.',
    details,
    raw: text,
    isStructured: true,
  };
}

function looksLikeStructuredPayload(value = '') {
  const text = String(value || '').trim();
  if (!text) return false;
  return text.startsWith('{') || text.startsWith('[') || text.startsWith('```json');
}

function createBuildStatusMessage({outputMode, json, plan, client}) {
  if (outputMode === 'presentation') {
    const deck = json?.presentation || json || {};
    const slides = Array.isArray(deck.slides) ? deck.slides.length : 0;
    return `Structured presentation ready.${slides ? ` ${slides} slides generated.` : ''} Review the preview, refine what matters, then publish when it feels right.`;
  }

  const headline = cleanText(json?.hero?.headline || json?.title || plan?.title || client?.name || 'Portal');
  return `Structured portal ready for ${headline}. Review the preview, refine any sections you want, then publish when it feels right.`;
}

function formatConversationMessage(message) {
  if (message?.role !== 'assistant') return message?.content || '';
  if (!looksLikeStructuredPayload(message?.content)) return message?.content || '';
  return 'Structured output generated. Use the preview and inspector to review it, or open the JSON panel if you need the raw payload.';
}

function buildPromptPolishMessage({input, outputMode, styleMode, client, references = [], attachments = []}) {
  const {refLines, fileLines} = listReferenceContext(references, attachments);
  const styleLabel = STYLE_MODES.find((option) => option.value === styleMode)?.label || styleMode;
  const referenceIntelligence = buildReferenceIntelligence({prompt: input, outputMode, styleMode, client, references, attachments});

  return [
    `Rewrite this builder prompt for a ${outputMode} project.`,
    'Return plain text only. Do not use code fences.',
    'Make it more specific, more premium, and less generic.',
    'Preserve the user intent, but sharpen the visual direction, structure, motion language, and concept territory.',
    'Avoid defaulting to the same immersive portal or same AI presentation pattern.',
    'Use concise sections when helpful: Goal, Visual direction, Motion, Content, Constraints.',
    ...(referenceIntelligence.logoSignals.length ? ['', 'Reference-led logo cues:', ...referenceIntelligence.logoSignals.map((item) => `- ${item}`)] : []),
    ...(referenceIntelligence.visualSignals.length ? ['', 'Reference-led visual cues:', ...referenceIntelligence.visualSignals.map((item) => `- ${item}`)] : []),
    '',
    `Client: ${client?.name || 'None selected'}`,
    `Style direction: ${styleLabel}`,
    ...(refLines.length ? ['', 'References:', ...refLines] : []),
    ...(fileLines.length ? ['', 'Attached files:', ...fileLines] : []),
    '',
    'Prompt to polish:',
    input,
  ].join('\n');
}

function buildPromptGeneratorMessage({outputMode, styleMode, client, references = [], attachments = []}) {
  const {refLines, fileLines} = listReferenceContext(references, attachments);
  const styleLabel = STYLE_MODES.find((option) => option.value === styleMode)?.label || styleMode;
  const referenceIntelligence = buildReferenceIntelligence({prompt: '', outputMode, styleMode, client, references, attachments});

  return [
    `Generate a strong starter prompt for an AI ${outputMode} builder.`,
    'Return plain text only. Do not use code fences.',
    'The prompt should feel premium, specific, and art directed.',
    'Avoid generic AI website language and bland startup tropes.',
    'The prompt should clearly describe the desired design quality, motion language, section hierarchy, and a distinct concept territory.',
    ...(referenceIntelligence.logoSignals.length ? ['', 'Reference-led logo cues:', ...referenceIntelligence.logoSignals.map((item) => `- ${item}`)] : []),
    ...(referenceIntelligence.visualSignals.length ? ['', 'Reference-led visual cues:', ...referenceIntelligence.visualSignals.map((item) => `- ${item}`)] : []),
    '',
    `Client: ${client?.name || 'None selected'}`,
    `Style direction: ${styleLabel}`,
    ...(refLines.length ? ['', 'References:', ...refLines] : []),
    ...(fileLines.length ? ['', 'Attached files:', ...fileLines] : []),
  ].join('\n');
}

function formatSelectionLabel(outputMode, selectedNodeId) {
  if (outputMode === 'presentation') {
    const requestedIndex = Number(String(selectedNodeId || '').replace('slide-', ''));
    const index = Number.isFinite(requestedIndex) ? requestedIndex : 0;
    return `Slide ${index + 1}`;
  }

  const labels = {
    hero: 'Hero',
    brand: 'Brand',
    logo: 'Logo',
    colors: 'Colors',
    typography: 'Typography',
    cta: 'Decision',
  };

  return labels[selectedNodeId] || 'Selected section';
}

function extractSelectedContent(outputMode, preview, selectedNodeId) {
  if (!preview) return null;

  if (outputMode === 'presentation') {
    const deck = preview.presentation || preview || {};
    const slides = Array.isArray(deck.slides) ? deck.slides : [];
    const requestedIndex = Number(String(selectedNodeId || '').replace('slide-', ''));
    const index = Number.isFinite(requestedIndex) ? requestedIndex : 0;
    return slides[index] || null;
  }

  return preview?.[selectedNodeId] || null;
}

function buildPatchMessage({outputMode, plan, selectedNodeId, preview, instruction}) {
  const selectionLabel = formatSelectionLabel(outputMode, selectedNodeId);
  const selectedContent = extractSelectedContent(outputMode, preview, selectedNodeId);

  return [
    'Apply this follow-up revision to the existing structured output.',
    `Target output mode: ${outputMode}`,
    `Primary focus: ${selectionLabel}`,
    'Keep the overall structure, approved plan, and all unaffected sections intact.',
    'Return the full updated JSON payload inside a single fenced ```json block.',
    '',
    'Revision request:',
    instruction,
    '',
    'Current focused content:',
    selectedContent ? JSON.stringify(selectedContent, null, 2) : 'No focused content available.',
    '',
    'Current full output:',
    JSON.stringify(preview, null, 2),
    '',
    'Approved assets in play:',
    (plan?.selectedAssets || []).map((item) => `- ${item.title} (${item.categoryLabel})`).join('\n') || '- None',
    ...(plan?.referenceIntelligence?.logoSignals?.length ? ['', 'Reference-led logo cues:', ...plan.referenceIntelligence.logoSignals.map((item) => `- ${item}`)] : []),
    ...(plan?.referenceIntelligence?.visualSignals?.length ? ['', 'Reference-led visual cues:', ...plan.referenceIntelligence.visualSignals.map((item) => `- ${item}`)] : []),
    '',
    'Design guardrails:',
    ...(plan?.designGuardrails || DESIGN_GUARDRAILS).map((item) => `- ${item}`),
  ].join('\n');
}

function summarizePreview(outputMode, preview) {
  if (!preview) return null;

  if (outputMode === 'presentation') {
    const deck = preview.presentation || preview;
    const slides = Array.isArray(deck.slides) ? deck.slides : [];
    return {
      title: cleanText(deck.title) || 'Generated presentation',
      eyebrow: 'Presentation preview',
      bullets: [
        `${slides.length} slides`,
        cleanText(deck.theme) ? `Theme: ${deck.theme}` : '',
        cleanText(deck.transition) ? `Transition: ${deck.transition}` : '',
      ].filter(Boolean),
      sections: slides.slice(0, 8).map((slide, index) => ({
        title: cleanText(slide?.title || slide?.eyebrow || `Slide ${index + 1}`),
        description: cleanText(slide?.subtitle || slide?.body || slide?.layout || ''),
      })),
    };
  }

  const keys = Object.keys(preview || {}).filter((key) => !['portalTemplate', 'artDirection'].includes(key));
  return {
    title: cleanText(preview?.title || preview?.hero?.title) || 'Generated portal',
    eyebrow: 'Portal preview',
    bullets: [
      keys.length ? `${keys.length} content areas` : '',
      cleanText(preview?.artDirection) ? `Art direction: ${preview.artDirection}` : '',
      cleanText(preview?.portalTemplate) ? `Template: ${preview.portalTemplate}` : '',
    ].filter(Boolean),
    sections: keys.slice(0, 8).map((key) => ({
      title: key,
      description: cleanText(
        preview?.[key]?.title ||
          preview?.[key]?.heading ||
          preview?.[key]?.subtitle ||
          preview?.[key]?.description ||
          ''
      ),
    })),
  };
}

function getDefaultPreviewNode(outputMode) {
  return outputMode === 'presentation' ? 'slide-0' : 'hero';
}

function getAssetsForNode(plan, nodeId, outputMode) {
  const items = plan?.selectedAssets || [];

  if (outputMode === 'presentation') {
    return items.slice(0, 3);
  }

  const rules = {
    hero: ['backgrounds', 'text-animations'],
    brand: ['components', 'animations'],
    logo: ['components', 'animations'],
    colors: ['backgrounds'],
    typography: ['text-animations'],
    cta: ['components', 'text-animations'],
  };

  const categories = rules[nodeId] || [];
  const matched = items.filter((item) => categories.includes(item.category));
  return matched.length ? matched : items.slice(0, 2);
}

function withSwapOptions(assets = [], outputMode) {
  return assets.map((item) => ({
    ...item,
    swapOptions: getRegistryOptionsForCategory({
      category: item.category,
      outputMode,
      limit: 8,
    }),
  }));
}

function syncAssetMixLine(plan, selectedAssets) {
  const assetMixLine = `Asset mix: ${selectedAssets.map((item) => `${item.title} (${item.categoryLabel})`).join(', ')}`;
  const visualDirection = [...(plan?.visualDirection || [])];
  const existingIndex = visualDirection.findIndex((item) => item.startsWith('Asset mix:'));

  if (existingIndex >= 0) {
    visualDirection[existingIndex] = assetMixLine;
  } else {
    visualDirection.splice(2, 0, assetMixLine);
  }

  return visualDirection;
}

function createTextField(key, label, value, options = {}) {
  return {
    key,
    label,
    type: options.type || 'text',
    value: value ?? '',
    placeholder: options.placeholder || '',
    help: options.help || '',
    options: options.options || [],
  };
}

function formatList(items = []) {
  return (items || []).filter(Boolean).join('\n');
}

function parseLineList(value = '') {
  return String(value || '')
    .split('\n')
    .map((item) => cleanText(item))
    .filter(Boolean);
}

function formatPalette(palette = []) {
  return (palette || [])
    .map((item) => [item?.name, item?.hex, item?.role].filter(Boolean).join(' | '))
    .join('\n');
}

function parsePalette(value = '') {
  return String(value || '')
    .split('\n')
    .map((line) => line.split('|').map((part) => cleanText(part)))
    .filter((parts) => parts.some(Boolean))
    .map(([name, hex, role]) => ({
      name: name || 'Color',
      hex: hex || '#FFFFFF',
      role: role || '',
    }));
}

function formatFonts(fonts = []) {
  return (fonts || [])
    .map((item) => [item?.name, item?.typeface, item?.usage].filter(Boolean).join(' | '))
    .join('\n');
}

function parseFonts(value = '') {
  return String(value || '')
    .split('\n')
    .map((line) => line.split('|').map((part) => cleanText(part)))
    .filter((parts) => parts.some(Boolean))
    .map(([name, typeface, usage]) => ({
      name: name || 'Font',
      typeface: typeface || '',
      usage: usage || '',
    }));
}

function updateWrappedOutput(raw, outputMode, updater) {
  if (!raw) return raw;

  if (outputMode === 'presentation') {
    if (raw.mode === 'presentation' && raw.presentation) {
      return {...raw, presentation: updater(raw.presentation || {})};
    }

    if (raw.presentation) {
      return {...raw, presentation: updater(raw.presentation || {})};
    }

    return updater(raw || {});
  }

  if (raw.mode === 'portal' && raw.portal) {
    return {...raw, portal: updater(raw.portal || {})};
  }

  return updater(raw || {});
}

function patchPresentationPreview(deck = {}, selectedNodeId, fieldKey, value) {
  const slides = Array.isArray(deck.slides) ? [...deck.slides] : [];
  const requestedIndex = Number(String(selectedNodeId || '').replace('slide-', ''));
  const index = Number.isFinite(requestedIndex) ? requestedIndex : 0;
  const slide = {...(slides[index] || {})};

  if (fieldKey === 'deckTheme') {
    return {...deck, theme: value || 'black'};
  }

  if (fieldKey === 'deckTransition') {
    return {...deck, transition: value || 'slide'};
  }

  if (fieldKey === 'slideBullets') {
    slide.bullets = parseLineList(value);
  } else {
    slide[fieldKey] = value;
  }

  slides[index] = slide;
  return {...deck, slides};
}

function patchPortalPreview(content = {}, selectedNodeId, fieldKey, value) {
  const next = {...(content || {})};

  if (fieldKey === 'portalTemplate' || fieldKey === 'artDirection') {
    next[fieldKey] = value;
    return next;
  }

  if (selectedNodeId === 'colors') {
    next.colors = {...(next.colors || {})};

    if (fieldKey === 'colorsPalette') {
      next.colors.palette = parsePalette(value);
    } else {
      next.colors[fieldKey] = value;
    }

    return next;
  }

  if (selectedNodeId === 'typography') {
    next.typography = {...(next.typography || {})};

    if (fieldKey === 'typographyFonts') {
      next.typography.fonts = parseFonts(value);
    } else {
      next.typography[fieldKey] = value;
    }

    return next;
  }

  next[selectedNodeId] = {...(next[selectedNodeId] || {}), [fieldKey]: value};
  return next;
}

function createInspectorData({outputMode, preview, plan, client, selectedNodeId}) {
  if (outputMode === 'presentation') {
    const deck = preview?.presentation || preview || {};
    const slides = Array.isArray(deck.slides) ? deck.slides : [];
    const requestedIndex = Number(String(selectedNodeId || '').replace('slide-', ''));
    const index = Number.isFinite(requestedIndex) ? requestedIndex : 0;
    const slide = slides[index] || slides[0];

    if (!slide) {
      return {
        title: 'Presentation preview',
        label: 'No slide selected',
        summary: 'Generate a presentation to inspect individual slides.',
        notes: [],
        fields: [],
        editorFields: [],
        assets: withSwapOptions(plan?.selectedAssets || [], outputMode),
      };
    }

    return {
      title: slide.title || slide.eyebrow || `Slide ${index + 1}`,
      label: `Slide ${index + 1}`,
      summary: cleanText(slide.subtitle || slide.body || 'This slide is ready for refinement in the next build pass.'),
      notes: Array.isArray(slide.bullets) ? slide.bullets.slice(0, 4) : [],
      fields: [
        {label: 'Layout', value: slide.layout || 'statement'},
        {label: 'Theme', value: deck.theme || 'black'},
        {label: 'Transition', value: slide.transition || deck.transition || 'slide'},
        {label: 'Media', value: slide.media?.type || slide.background?.type || 'none'},
      ],
      editorFields: [
        createTextField('deckTheme', 'Deck theme', deck.theme || 'black', {
          type: 'select',
          options: ['black', 'moon', 'serif', 'simple'],
        }),
        createTextField('deckTransition', 'Deck transition', deck.transition || 'slide', {
          type: 'select',
          options: ['slide', 'fade', 'zoom', 'convex', 'concave', 'none'],
        }),
        createTextField('eyebrow', 'Eyebrow', slide.eyebrow || ''),
        createTextField('title', 'Title', slide.title || ''),
        createTextField('subtitle', 'Subtitle', slide.subtitle || '', {type: 'textarea'}),
        createTextField('body', 'Body', slide.body || '', {type: 'textarea'}),
        createTextField('slideBullets', 'Bullets', formatList(slide.bullets || []), {
          type: 'textarea',
          help: 'One bullet per line.',
        }),
      ],
      assets: withSwapOptions(getAssetsForNode(plan, selectedNodeId, outputMode), outputMode),
      clientName: client?.name || '',
    };
  }

  const content = preview || {};
  const map = {
    hero: {
      title: content.hero?.headline || content.title || plan?.title || 'Hero',
      label: 'Hero',
      summary: cleanText(content.hero?.intro || content.summary || plan?.visualThesis || 'The opening narrative and tone-setter for the portal.'),
      notes: [
        cleanText(content.hero?.subheadline || ''),
        cleanText(plan?.interactionThesis?.[0] || ''),
      ].filter(Boolean),
      fields: [
        {label: 'Template', value: content.portalTemplate || 'brand-reveal-v1'},
        {label: 'Art direction', value: content.artDirection || 'cinematic'},
      ],
      editorFields: [
        createTextField('portalTemplate', 'Template', content.portalTemplate || 'brand-reveal-v1', {
          type: 'select',
          options: ['brand-reveal-v1', 'brand-reveal-minimal', 'full-identity'],
        }),
        createTextField('artDirection', 'Art direction', content.artDirection || 'cinematic', {
          type: 'select',
          options: STYLE_MODES.map((mode) => mode.value),
        }),
        createTextField('eyebrow', 'Eyebrow', content.hero?.eyebrow || ''),
        createTextField('headline', 'Headline', content.hero?.headline || ''),
        createTextField('subheadline', 'Subheadline', content.hero?.subheadline || '', {type: 'textarea'}),
        createTextField('intro', 'Intro', content.hero?.intro || '', {type: 'textarea'}),
      ],
    },
    brand: {
      title: content.brand?.headline || plan?.structure?.[1] || 'Brand story',
      label: 'Brand',
      summary: cleanText(content.brand?.positioning || plan?.summary || 'Core narrative positioning and brand territory.'),
      notes: (content.brand?.pillars || []).slice(0, 3).map((item) => `${item.title}: ${item.desc}`).filter(Boolean),
      fields: [
        {label: 'Section', value: plan?.structure?.[1] || 'Brand story'},
        {label: 'Pillars', value: String((content.brand?.pillars || []).length || 0)},
      ],
      editorFields: [
        createTextField('eyebrow', 'Eyebrow', content.brand?.eyebrow || ''),
        createTextField('headline', 'Headline', content.brand?.headline || ''),
        createTextField('positioning', 'Positioning', content.brand?.positioning || '', {type: 'textarea'}),
      ],
    },
    logo: {
      title: content.logo?.headline || plan?.structure?.[3] || 'Logo evolution',
      label: 'Logo',
      summary: cleanText(content.logo?.rationale || 'Logo rationale and system behavior across contexts.'),
      notes: [],
      fields: [
        {label: 'Section', value: plan?.structure?.[3] || 'Logo evolution'},
        {label: 'Logo asset', value: content.logo?.logoUrl ? 'provided' : 'placeholder'},
      ],
      editorFields: [
        createTextField('eyebrow', 'Eyebrow', content.logo?.eyebrow || ''),
        createTextField('headline', 'Headline', content.logo?.headline || ''),
        createTextField('rationale', 'Rationale', content.logo?.rationale || '', {type: 'textarea'}),
      ],
    },
    colors: {
      title: content.colors?.headline || plan?.structure?.[5] || 'Color system',
      label: 'Colors',
      summary: cleanText('Palette architecture and visual contrast system for the identity.'),
      notes: (content.colors?.palette || []).slice(0, 4).map((item) => `${item.name} · ${item.hex}`),
      fields: [
        {label: 'Swatches', value: String((content.colors?.palette || []).length || 0)},
      ],
      editorFields: [
        createTextField('headline', 'Headline', content.colors?.headline || ''),
        createTextField('colorsPalette', 'Palette', formatPalette(content.colors?.palette || []), {
          type: 'textarea',
          help: 'Format: Name | #HEX | Role',
        }),
      ],
    },
    typography: {
      title: content.typography?.headline || 'Typography system',
      label: 'Typography',
      summary: cleanText('Type hierarchy, voice, and usage across editorial and interface moments.'),
      notes: (content.typography?.fonts || []).slice(0, 3).map((item) => `${item.name}: ${item.typeface}`),
      fields: [
        {label: 'Fonts', value: String((content.typography?.fonts || []).length || 0)},
      ],
      editorFields: [
        createTextField('headline', 'Headline', content.typography?.headline || ''),
        createTextField('typographyFonts', 'Fonts', formatFonts(content.typography?.fonts || []), {
          type: 'textarea',
          help: 'Format: Name | Typeface | Usage',
        }),
      ],
    },
    cta: {
      title: content.cta?.headline || plan?.structure?.[plan?.structure?.length - 1] || 'Decision / next step',
      label: 'Decision',
      summary: cleanText(content.cta?.body || 'Final decision moment, approval framing, and next-step guidance.'),
      notes: ['Use this section to collect approval, revision requests, or direction for the next build pass.'],
      fields: [
        {label: 'Section', value: plan?.structure?.[plan?.structure?.length - 1] || 'Decision / next step'},
      ],
      editorFields: [
        createTextField('eyebrow', 'Eyebrow', content.cta?.eyebrow || ''),
        createTextField('headline', 'Headline', content.cta?.headline || ''),
        createTextField('body', 'Body', content.cta?.body || '', {type: 'textarea'}),
      ],
    },
  };

  const section = map[selectedNodeId] || map.hero;
  return {
    ...section,
    assets: withSwapOptions(getAssetsForNode(plan, selectedNodeId, outputMode), outputMode),
    clientName: client?.name || '',
  };
}

function InspectorDrawer({activeView, inspector, outputMode, phase, onEditField, onSwapAsset, compact = false}) {
  const emptyMessage = activeView === 'plan'
    ? 'Review the plan, structure, and asset mix here. The live inspector becomes active after you generate structured output.'
    : 'Click a portal section or presentation slide in the preview to inspect it here.';

  return (
    <aside style={{width: compact ? '100%' : 360, minWidth: compact ? 0 : 300, borderLeft: compact ? 'none' : '1px solid rgba(255,255,255,.06)', borderTop: compact ? '1px solid rgba(255,255,255,.06)' : 'none', background: 'rgba(2,6,23,.72)', padding: 18, overflowY: 'auto'}}>
      <div style={{display: 'grid', gap: 16}}>
        <div>
          <div style={{fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.14em', color: '#64748B'}}>Inspector</div>
          <div style={{fontSize: 20, fontWeight: 800, color: '#F8FAFC', marginTop: 6}}>
            {inspector ? inspector.title : activeView === 'plan' ? 'Plan review' : 'Nothing selected'}
          </div>
          <div style={{fontSize: 12, color: '#94A3B8', lineHeight: 1.7, marginTop: 10}}>
            {inspector ? inspector.summary : emptyMessage}
          </div>
        </div>

        <div style={{padding: 14, borderRadius: 18, border: '1px solid rgba(255,255,255,.08)', background: 'rgba(255,255,255,.03)', display: 'grid', gap: 10}}>
          <div style={{fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: '#60A5FA'}}>
            {activeView === 'plan' ? 'Workflow' : 'Selection'}
          </div>
          <div style={{fontSize: 13, color: '#F8FAFC', fontWeight: 700}}>
            {inspector?.label || (activeView === 'plan' ? 'Plan pending approval' : 'Select a region')}
          </div>
          <div style={{fontSize: 11, color: '#94A3B8'}}>
            Mode: {outputMode} • Phase: {phase.replace('_', ' ')}
          </div>
          {inspector?.clientName ? (
            <div style={{fontSize: 11, color: '#94A3B8'}}>Client: {inspector.clientName}</div>
          ) : null}
        </div>

        {inspector?.fields?.length ? (
          <div style={{padding: 14, borderRadius: 18, border: '1px solid rgba(255,255,255,.08)', background: 'rgba(255,255,255,.03)', display: 'grid', gap: 12}}>
            <div style={{fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: '#60A5FA'}}>Properties</div>
            {inspector.fields.map((field) => (
              <div key={`${field.label}-${field.value}`} style={{display: 'grid', gap: 4}}>
                <div style={{fontSize: 10, textTransform: 'uppercase', letterSpacing: '.08em', color: '#64748B'}}>{field.label}</div>
                <div style={{fontSize: 13, color: '#E2E8F0', lineHeight: 1.55}}>{field.value}</div>
              </div>
            ))}
          </div>
        ) : null}

        {inspector?.editorFields?.length ? (
          <div style={{padding: 14, borderRadius: 18, border: '1px solid rgba(255,255,255,.08)', background: 'rgba(255,255,255,.03)', display: 'grid', gap: 12}}>
            <div style={{fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: '#60A5FA'}}>Live edits</div>
            {inspector.editorFields.map((field) => (
              <label key={field.key} style={{display: 'grid', gap: 6}}>
                <span style={{fontSize: 10, textTransform: 'uppercase', letterSpacing: '.08em', color: '#64748B'}}>{field.label}</span>
                {field.type === 'textarea' ? (
                  <textarea
                    value={field.value}
                    onChange={(e) => onEditField?.(field.key, e.target.value)}
                    rows={field.key === 'colorsPalette' || field.key === 'typographyFonts' || field.key === 'slideBullets' ? 4 : 3}
                    placeholder={field.placeholder}
                    style={{width: '100%', resize: 'vertical', padding: '11px 12px', borderRadius: 12, border: '1px solid rgba(255,255,255,.10)', background: 'rgba(255,255,255,.04)', color: '#F8FAFC', fontSize: 12, lineHeight: 1.6, outline: 'none'}}
                  />
                ) : field.type === 'select' ? (
                  <select
                    value={field.value}
                    onChange={(e) => onEditField?.(field.key, e.target.value)}
                    style={{width: '100%', padding: '10px 12px', borderRadius: 12, border: '1px solid rgba(255,255,255,.10)', background: 'rgba(255,255,255,.04)', color: '#F8FAFC', fontSize: 12}}
                  >
                    {field.options.map((option) => (
                      <option key={option} value={option} style={{color: '#111827'}}>
                        {option}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    value={field.value}
                    onChange={(e) => onEditField?.(field.key, e.target.value)}
                    placeholder={field.placeholder}
                    style={{width: '100%', padding: '10px 12px', borderRadius: 12, border: '1px solid rgba(255,255,255,.10)', background: 'rgba(255,255,255,.04)', color: '#F8FAFC', fontSize: 12, outline: 'none'}}
                  />
                )}
                {field.help ? <span style={{fontSize: 10, color: '#64748B', lineHeight: 1.5}}>{field.help}</span> : null}
              </label>
            ))}
          </div>
        ) : null}

        {inspector?.assets?.length ? (
          <div style={{padding: 14, borderRadius: 18, border: '1px solid rgba(255,255,255,.08)', background: 'rgba(255,255,255,.03)', display: 'grid', gap: 12}}>
            <div style={{fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: '#60A5FA'}}>Mapped assets</div>
            {inspector.assets.map((item) => (
              <div key={item.id} style={{paddingTop: 10, borderTop: '1px solid rgba(255,255,255,.06)'}}>
                <div style={{fontSize: 13, fontWeight: 700, color: '#F8FAFC'}}>{item.title}</div>
                <div style={{fontSize: 11, color: '#BFDBFE', marginTop: 4}}>{item.categoryLabel} • {item.supportLabel}</div>
                <div style={{fontSize: 11, color: '#94A3B8', lineHeight: 1.55, marginTop: 6}}>{item.rationale}</div>
                <label style={{display: 'grid', gap: 6, marginTop: 10}}>
                  <span style={{fontSize: 10, textTransform: 'uppercase', letterSpacing: '.08em', color: '#64748B'}}>Swap {item.categoryLabel}</span>
                  <select
                    value={item.id}
                    onChange={(e) => onSwapAsset?.(item, e.target.value)}
                    style={{width: '100%', padding: '10px 12px', borderRadius: 12, border: '1px solid rgba(255,255,255,.10)', background: 'rgba(255,255,255,.04)', color: '#F8FAFC', fontSize: 12}}
                  >
                    {item.swapOptions.map((option) => (
                      <option key={option.id} value={option.id} style={{color: '#111827'}}>
                        {option.title}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            ))}
          </div>
        ) : null}

        {inspector?.notes?.length ? (
          <div style={{padding: 14, borderRadius: 18, border: '1px solid rgba(255,255,255,.08)', background: 'rgba(255,255,255,.03)', display: 'grid', gap: 10}}>
            <div style={{fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: '#60A5FA'}}>Content notes</div>
            {inspector.notes.map((note) => (
              <div key={note} style={{fontSize: 12, color: '#E2E8F0', lineHeight: 1.65}}>
                {note}
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </aside>
  );
}

function Field({label, children, hint}) {
  return (
    <label style={{display: 'grid', gap: 6}}>
      <span style={{fontSize: 11, fontWeight: 700, color: '#A3A3A3', textTransform: 'uppercase', letterSpacing: '.08em'}}>
        {label}
      </span>
      {children}
      {hint ? <span style={{fontSize: 11, color: '#71717A', lineHeight: 1.4}}>{hint}</span> : null}
    </label>
  );
}

function RailCard({title, children, tone = 'default', footer}) {
  const borderColor = tone === 'active' ? 'rgba(96, 165, 250, .35)' : 'rgba(255,255,255,.08)';
  const background = tone === 'active' ? 'rgba(30, 41, 59, .92)' : 'rgba(15, 23, 42, .7)';

  return (
    <div style={{background, border: `1px solid ${borderColor}`, borderRadius: 18, padding: 16, display: 'grid', gap: 12}}>
      <div style={{fontSize: 13, fontWeight: 700, color: '#F8FAFC'}}>{title}</div>
      {children}
      {footer}
    </div>
  );
}

function AssetBadge({item}) {
  return (
    <div style={{padding: '8px 10px', borderRadius: 12, border: '1px solid rgba(255,255,255,.08)', background: 'rgba(255,255,255,.03)'}}>
      <div style={{fontSize: 12, fontWeight: 700, color: '#F8FAFC'}}>{item.title}</div>
      <div style={{fontSize: 10, textTransform: 'uppercase', letterSpacing: '.08em', color: '#60A5FA', marginTop: 3}}>
        {item.categoryLabel}
      </div>
      <div style={{fontSize: 10, color: '#BFDBFE', marginTop: 6}}>
        {item.supportLabel} {item.placementLabel ? `• ${item.placementLabel}` : ''} {item.interactionLabel ? `• ${item.interactionLabel}` : ''}
      </div>
      <div style={{fontSize: 11, color: '#94A3B8', lineHeight: 1.45, marginTop: 6}}>
        {item.rationale}
      </div>
    </div>
  );
}

function getPreviewTheme(styleMode, outputMode) {
  const themes = {
    cinematic: {
      background: outputMode === 'presentation'
        ? 'linear-gradient(140deg, #050816 0%, #0f172a 42%, #1d4ed8 100%)'
        : 'linear-gradient(145deg, #050816 0%, #111827 38%, #0f766e 100%)',
      glowA: 'rgba(96, 165, 250, 0.32)',
      glowB: 'rgba(244, 114, 182, 0.24)',
      accent: '#93C5FD',
      accentSoft: 'rgba(147, 197, 253, 0.18)',
    },
    editorial: {
      background: 'linear-gradient(145deg, #111111 0%, #1f1f1f 40%, #7c2d12 100%)',
      glowA: 'rgba(251, 146, 60, 0.2)',
      glowB: 'rgba(245, 245, 244, 0.12)',
      accent: '#FDBA74',
      accentSoft: 'rgba(253, 186, 116, 0.15)',
    },
    luxury: {
      background: 'linear-gradient(145deg, #09090b 0%, #1f1a17 38%, #6b4f1d 100%)',
      glowA: 'rgba(251, 191, 36, 0.22)',
      glowB: 'rgba(245, 158, 11, 0.14)',
      accent: '#FCD34D',
      accentSoft: 'rgba(252, 211, 77, 0.14)',
    },
    bold: {
      background: 'linear-gradient(145deg, #13111c 0%, #1d1b4b 35%, #be185d 100%)',
      glowA: 'rgba(244, 114, 182, 0.24)',
      glowB: 'rgba(59, 130, 246, 0.22)',
      accent: '#F9A8D4',
      accentSoft: 'rgba(249, 168, 212, 0.16)',
    },
    minimal: {
      background: 'linear-gradient(145deg, #0b1120 0%, #1e293b 55%, #334155 100%)',
      glowA: 'rgba(148, 163, 184, 0.18)',
      glowB: 'rgba(255, 255, 255, 0.08)',
      accent: '#E2E8F0',
      accentSoft: 'rgba(226, 232, 240, 0.12)',
    },
  };

  return themes[styleMode] || themes.cinematic;
}

function PreviewCanvas({plan, previewSummary, outputMode, styleMode, client, phase, onApprove, onEditPlan}) {
  const theme = getPreviewTheme(styleMode, outputMode);
  const isEmpty = !plan;
  const waitingForApproval = Boolean(plan && phase === 'awaiting_approval');
  const focusLabel = cleanText(plan?.briefSubject || client?.name || client?.company || inferPromptSubject(plan?.prompt || '', outputMode) || 'This build');
  const stageTitle = waitingForApproval
    ? cleanText(plan?.title || `${focusLabel} ${outputMode === 'presentation' ? 'presentation' : 'portal'}`)
    : previewSummary?.title || plan?.title || 'Start with a prompt.';
  const stageEyebrow = outputMode === 'presentation' ? 'Interactive presentation' : 'Immersive portal';
  const stageSummary = waitingForApproval
    ? cleanText(plan?.summary || `Plan ready for ${focusLabel}. Review it, tweak it if needed, then build the first preview.`)
    : phase === 'building'
      ? 'Generating the approved preview now. This area will update once the real build is ready.'
      : plan?.visualThesis || plan?.summary || 'A cleaner concept preview will appear after the first plan.';
  const previewChips = (previewSummary?.bullets?.length
    ? previewSummary.bullets
    : [
        outputMode === 'presentation' ? 'Interactive pacing' : 'Scroll-led storytelling',
        STYLE_MODES.find((mode) => mode.value === styleMode)?.label || 'Art-directed motion',
        client?.name || 'Client-ready build',
      ])
    .filter(Boolean)
    .slice(0, 3);

  if (waitingForApproval) {
    return (
      <div style={{maxWidth: 980, margin: '0 auto', minHeight: '100%', display: 'grid', placeItems: 'center'}}>
        <div style={{width: '100%', maxWidth: 760, position: 'relative', overflow: 'hidden', borderRadius: 28, border: '1px solid rgba(255,255,255,.08)', background: 'linear-gradient(180deg, rgba(10,15,28,.92), rgba(7,11,22,.96))', padding: '28px 28px 24px'}}>
          <div style={{position: 'absolute', inset: 0, background: `radial-gradient(circle at 18% 18%, ${theme.glowA}, transparent 28%), radial-gradient(circle at 82% 22%, ${theme.glowB}, transparent 30%)`, opacity: 0.7}} />
          <div style={{position: 'relative', zIndex: 1, display: 'grid', gap: 18}}>
            <div style={{display: 'grid', gap: 8}}>
              <div style={{fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.16em', color: theme.accent}}>
                Plan ready
              </div>
              <div style={{fontSize: 24, lineHeight: 1.05, fontWeight: 800, letterSpacing: '-.04em', color: '#F8FAFC'}}>
                {stageTitle}
              </div>
              <div style={{fontSize: 14, color: 'rgba(226,232,240,.78)', lineHeight: 1.75}}>
                Review the brief in the left column, then either refine it or approve the build. The main canvas will stay clean until there’s a real preview to show.
              </div>
            </div>

            <div style={{display: 'flex', gap: 8, flexWrap: 'wrap'}}>
              <span style={{padding: '7px 11px', borderRadius: 999, border: '1px solid rgba(255,255,255,.10)', background: 'rgba(255,255,255,.04)', fontSize: 12, color: '#E2E8F0'}}>
                {OUTPUT_MODES.find((mode) => mode.value === outputMode)?.label}
              </span>
              <span style={{padding: '7px 11px', borderRadius: 999, border: '1px solid rgba(255,255,255,.10)', background: 'rgba(255,255,255,.04)', fontSize: 12, color: '#E2E8F0'}}>
                {STYLE_MODES.find((mode) => mode.value === styleMode)?.label || styleMode}
              </span>
              <span style={{padding: '7px 11px', borderRadius: 999, border: '1px solid rgba(255,255,255,.10)', background: 'rgba(255,255,255,.04)', fontSize: 12, color: '#E2E8F0'}}>
                {focusLabel}
              </span>
            </div>

            <div style={{display: 'grid', gap: 10}}>
              <div style={{fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.12em', color: '#64748B'}}>
                Next
              </div>
              <div style={{display: 'grid', gap: 8}}>
                {[
                  'Edit the prompt if the direction is close but needs adjustment.',
                  'Approve & Build when the brief feels right.',
                  'Use the built preview for visual review, not the plan itself.',
                ].map((item) => (
                  <div key={item} style={{fontSize: 13, color: '#CBD5E1', lineHeight: 1.65}}>
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{position: 'relative', minHeight: 560, overflow: 'hidden', borderRadius: 32, border: '1px solid rgba(255,255,255,.08)', background: theme.background, padding: isEmpty ? 42 : 32, display: 'grid', alignItems: isEmpty ? 'center' : 'end'}}>
      <div style={{position: 'absolute', inset: 0, background: `radial-gradient(circle at 18% 18%, ${theme.glowA}, transparent 28%), radial-gradient(circle at 82% 22%, ${theme.glowB}, transparent 30%)`}} />
      <div style={{position: 'relative', zIndex: 1, maxWidth: isEmpty ? 760 : 920, display: 'grid', gap: isEmpty ? 14 : 18}}>
        <div style={{fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.16em', color: theme.accent}}>
          {stageEyebrow}
        </div>
        <div style={{fontSize: isEmpty ? 44 : 56, lineHeight: 0.94, fontWeight: 800, letterSpacing: '-.05em', color: '#F8FAFC', maxWidth: isEmpty ? 680 : 820}}>
          {stageTitle}
        </div>
        <div style={{fontSize: isEmpty ? 15 : 17, color: 'rgba(226,232,240,.86)', lineHeight: 1.8, maxWidth: isEmpty ? 560 : 760}}>
          {stageSummary}
        </div>
        {!isEmpty ? (
          <div style={{display: 'flex', gap: 8, flexWrap: 'wrap'}}>
            {previewChips.map((bullet) => (
              <span key={bullet} style={{padding: '7px 11px', borderRadius: 999, border: '1px solid rgba(255,255,255,.12)', background: 'rgba(255,255,255,.05)', fontSize: 12, color: '#E2E8F0'}}>
                {bullet}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function buildPlanHighlights(plan) {
  if (!plan) return [];

  return [
    {
      label: 'Focus',
      value: cleanText(plan.visualThesis || plan.summary || 'Directed build focus'),
    },
    {
      label: 'Structure',
      value: Array.isArray(plan.structure) && plan.structure.length
        ? plan.structure.slice(0, 3).join(' • ')
        : 'Narrative sequence being prepared',
    },
    {
      label: 'Motion',
      value: cleanText(plan.understanding?.motionStyle || plan.interactionThesis?.[0] || 'Measured motion with one dominant visual idea'),
    },
  ].filter((item) => item.value);
}

function buildPlanTransitionWords(plan) {
  if (!plan) return ['Concept', 'Direction', 'Reveal'];

  const words = [
    plan.understanding?.portalType,
    plan.understanding?.artDirection,
    ...(plan.structure || []).slice(0, 4),
  ]
    .flatMap((value) => String(value || '').split(/[·|,-]/g))
    .map((value) => cleanText(value))
    .filter((value) => value && value.length < 28);

  return [...new Set(words)].slice(0, 6).length
    ? [...new Set(words)].slice(0, 6)
    : ['Concept', 'Direction', 'Reveal'];
}

function PlanConceptStage({plan, styleMode, outputMode, client, planNeedsApproval, onApprove, onShowPrompt}) {
  const words = useMemo(() => buildPlanTransitionWords(plan), [plan]);
  const highlights = useMemo(() => buildPlanHighlights(plan), [plan]);
  const [wordIndex, setWordIndex] = useState(0);

  useEffect(() => {
    if (words.length <= 1) return undefined;
    const timer = window.setInterval(() => {
      setWordIndex((current) => (current + 1) % words.length);
    }, 1900);
    return () => window.clearInterval(timer);
  }, [words]);

  const activeWord = words[wordIndex] || words[0] || 'Concept';
  const styleLabel = STYLE_MODES.find((mode) => mode.value === styleMode)?.label || styleMode;
  const clientLabel = client?.name || 'Selected client';
  const summary = cleanText(plan?.summary || plan?.visualThesis || 'A concise plan is ready for approval.');
  const title = cleanText(plan?.title || `${clientLabel} concept`);
  const shortTitle = title
    .replace(/^Portal concept\s+—\s+/i, '')
    .replace(/^Presentation concept\s+—\s+/i, '')
    .replace(/^Portal\s+—\s+/i, '')
    .replace(/^Presentation\s+—\s+/i, '');

  return (
    <div style={{maxWidth: 1180, margin: '0 auto', minHeight: 'calc(100vh - 210px)', display: 'grid', placeItems: 'center'}}>
      <div style={{position: 'relative', width: '100%', overflow: 'hidden', borderRadius: 36, border: '1px solid rgba(255,255,255,.07)', background: 'linear-gradient(180deg, rgba(10,15,28,.96), rgba(7,11,22,.98))', padding: '56px 44px 44px', boxShadow: '0 32px 120px rgba(2,6,23,.32)'}}>
        <style>{`
          @keyframes planGradientFloat {
            0% { transform: translate3d(-2%, -2%, 0) scale(1); opacity: .58; }
            50% { transform: translate3d(3%, 2%, 0) scale(1.06); opacity: .88; }
            100% { transform: translate3d(-2%, -2%, 0) scale(1); opacity: .58; }
          }
          @keyframes planWordIn {
            0% { opacity: 0; transform: translateY(16px) scale(.98); }
            100% { opacity: 1; transform: translateY(0) scale(1); }
          }
        `}</style>

        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: -120,
            background: styleMode === 'luxury'
              ? 'radial-gradient(circle at 18% 20%, rgba(251,191,36,.18), transparent 28%), radial-gradient(circle at 84% 78%, rgba(245,158,11,.14), transparent 30%), radial-gradient(circle at 50% 48%, rgba(255,255,255,.06), transparent 42%)'
              : styleMode === 'editorial'
                ? 'radial-gradient(circle at 16% 24%, rgba(249,115,22,.16), transparent 28%), radial-gradient(circle at 80% 26%, rgba(255,255,255,.08), transparent 24%), radial-gradient(circle at 64% 74%, rgba(120,53,15,.22), transparent 30%)'
                : styleMode === 'bold'
                  ? 'radial-gradient(circle at 18% 18%, rgba(236,72,153,.22), transparent 30%), radial-gradient(circle at 84% 24%, rgba(59,130,246,.18), transparent 28%), radial-gradient(circle at 62% 82%, rgba(168,85,247,.22), transparent 32%)'
                  : styleMode === 'minimal'
                    ? 'radial-gradient(circle at 22% 22%, rgba(148,163,184,.12), transparent 28%), radial-gradient(circle at 82% 74%, rgba(255,255,255,.06), transparent 26%), radial-gradient(circle at 56% 48%, rgba(59,130,246,.12), transparent 32%)'
                    : 'radial-gradient(circle at 18% 20%, rgba(59,130,246,.20), transparent 28%), radial-gradient(circle at 82% 22%, rgba(217,70,239,.16), transparent 24%), radial-gradient(circle at 54% 78%, rgba(20,184,166,.14), transparent 30%)',
            filter: 'blur(18px)',
            animation: 'planGradientFloat 12s ease-in-out infinite',
            pointerEvents: 'none',
          }}
        />

        <div style={{position: 'relative', zIndex: 1, display: 'grid', gap: 26}}>
          <div style={{display: 'grid', gap: 10}}>
            <div style={{fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.16em', color: '#93C5FD'}}>
              {planNeedsApproval ? 'Plan pending approval' : 'Plan direction'}
            </div>
            <div style={{display: 'grid', gap: 8, maxWidth: 900}}>
              <div style={{fontSize: 'clamp(46px, 6vw, 88px)', lineHeight: .92, fontWeight: 800, letterSpacing: '-.05em', color: '#F8FAFC'}}>
                {shortTitle}
              </div>
              <div style={{minHeight: 56, display: 'flex', alignItems: 'center'}}>
                <div
                  key={activeWord}
                  style={{
                    fontSize: 'clamp(26px, 3vw, 42px)',
                    lineHeight: 1,
                    fontWeight: 700,
                    letterSpacing: '-.04em',
                    color: 'rgba(226,232,240,.74)',
                    animation: 'planWordIn .46s cubic-bezier(.16,1,.3,1)',
                  }}
                >
                  {activeWord}
                </div>
              </div>
            </div>
            <div style={{maxWidth: 720, fontSize: 16, color: 'rgba(226,232,240,.82)', lineHeight: 1.8}}>
              {summary}
            </div>
          </div>

          <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14}}>
            {highlights.map((item) => (
              <div key={item.label} style={{padding: '16px 18px', borderRadius: 22, border: '1px solid rgba(255,255,255,.07)', background: 'rgba(255,255,255,.03)'}}>
                <div style={{fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.12em', color: '#64748B', marginBottom: 10}}>
                  {item.label}
                </div>
                <div style={{fontSize: 14, lineHeight: 1.7, color: '#E2E8F0'}}>
                  {item.value}
                </div>
              </div>
            ))}
          </div>

          <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', paddingTop: 6}}>
            <div style={{display: 'flex', gap: 8, flexWrap: 'wrap'}}>
              <span style={{padding: '7px 11px', borderRadius: 999, border: '1px solid rgba(255,255,255,.08)', background: 'rgba(255,255,255,.04)', fontSize: 12, color: '#E2E8F0'}}>
                {OUTPUT_MODES.find((mode) => mode.value === outputMode)?.label}
              </span>
              <span style={{padding: '7px 11px', borderRadius: 999, border: '1px solid rgba(255,255,255,.08)', background: 'rgba(255,255,255,.04)', fontSize: 12, color: '#E2E8F0'}}>
                {styleLabel}
              </span>
              <span style={{padding: '7px 11px', borderRadius: 999, border: '1px solid rgba(255,255,255,.08)', background: 'rgba(255,255,255,.04)', fontSize: 12, color: '#E2E8F0'}}>
                {clientLabel}
              </span>
            </div>

            <div style={{display: 'flex', gap: 10, flexWrap: 'wrap'}}>
              <button
                onClick={onShowPrompt}
                style={{padding: '11px 14px', borderRadius: 12, border: '1px solid rgba(255,255,255,.10)', background: 'rgba(255,255,255,.04)', color: '#F8FAFC', fontSize: 12, fontWeight: 700, cursor: 'pointer'}}
              >
                {planNeedsApproval ? 'Edit plan' : 'Back to preview'}
              </button>
              {planNeedsApproval ? (
                <button
                  onClick={onApprove}
                  style={{padding: '11px 16px', borderRadius: 12, border: 'none', background: '#2563EB', color: '#F8FAFC', fontSize: 12, fontWeight: 800, cursor: 'pointer'}}
                >
                  Approve & Build
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PhasePill({phase}) {
  const map = {
    idle: {label: 'Idle', color: '#A1A1AA'},
    awaiting_approval: {label: 'Awaiting approval', color: '#FBBF24'},
    building: {label: 'Building', color: '#60A5FA'},
    patching: {label: 'Patching', color: '#C084FC'},
    preview_ready: {label: 'Preview ready', color: '#34D399'},
    error: {label: 'Needs attention', color: '#F87171'},
  };
  const current = map[phase] || map.idle;
  return (
    <span style={{display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 10px', borderRadius: 999, background: 'rgba(255,255,255,.06)', fontSize: 11, fontWeight: 700, color: current.color}}>
      <span style={{width: 6, height: 6, borderRadius: '50%', background: current.color}} />
      {current.label}
    </span>
  );
}

function safelyBuildPreviewMeta({outputMode, normalizedPreview, plan, client, selectedPreviewNode}) {
  try {
    const previewSummary = summarizePreview(outputMode, normalizedPreview);
    const inspector = normalizedPreview
      ? createInspectorData({
          outputMode,
          preview: normalizedPreview,
          plan,
          client,
          selectedNodeId: selectedPreviewNode,
        })
      : null;

    return {
      previewSummary,
      inspector,
      previewMetaError: '',
    };
  } catch (error) {
    console.error('Builder v2 preview metadata failed', error);
    return {
      previewSummary: {
        title: plan?.title || 'Preview unavailable',
        bullets: [],
      },
      inspector: null,
      previewMetaError: `Preview metadata failed: ${String(error?.message || error || 'Unknown error')}`,
    };
  }
}

function WorkflowSectionTitle({children, action}) {
  return (
    <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10}}>
      <div style={{fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.12em', color: '#64748B'}}>
        {children}
      </div>
      {action || null}
    </div>
  );
}

function WorkflowPromptCard({prompt, onToggleRaw, showRaw, isStructured}) {
  if (!prompt?.body && !prompt?.raw) return null;

  return (
    <div style={{display: 'grid', gap: 8}}>
      <WorkflowSectionTitle
        action={prompt.raw ? (
          <button
            type="button"
            onClick={onToggleRaw}
            style={{
              padding: '7px 10px',
              borderRadius: 999,
              border: '1px solid rgba(255,255,255,.08)',
              background: 'rgba(255,255,255,.03)',
              color: '#CBD5E1',
              fontSize: 11,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            {showRaw ? 'Hide raw prompt' : isStructured ? 'View raw prompt' : 'View full prompt'}
          </button>
        ) : null}
      >
        Prompt
      </WorkflowSectionTitle>
      <div style={{padding: '14px 15px', borderRadius: 16, border: '1px solid rgba(255,255,255,.06)', background: 'rgba(255,255,255,.03)', display: 'grid', gap: 10}}>
        <div style={{fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.12em', color: isStructured ? '#93C5FD' : '#64748B'}}>
          {prompt.eyebrow}
        </div>
        <div style={{fontSize: 13, color: '#E2E8F0', lineHeight: 1.75}}>
          {prompt.body}
        </div>
        {prompt.details?.length ? (
          <div style={{display: 'grid', gap: 7}}>
            {prompt.details.map((detail) => (
              <div key={detail} style={{fontSize: 12, color: '#94A3B8', lineHeight: 1.55}}>
                {detail}
              </div>
            ))}
          </div>
        ) : null}
        {showRaw && prompt.raw ? (
          <pre style={{margin: 0, padding: '12px 14px', borderRadius: 14, border: '1px solid rgba(255,255,255,.06)', background: 'rgba(2,6,23,.45)', fontSize: 11, color: '#94A3B8', lineHeight: 1.6, whiteSpace: 'pre-wrap', overflowX: 'auto'}}>
            {prompt.raw}
          </pre>
        ) : null}
      </div>
    </div>
  );
}

function WorkflowPlanCard({plan, outputMode, styleMode, client, loading, phase, onEditPlan, onApprove}) {
  if (!plan) return null;

  const styleLabel = STYLE_MODES.find((mode) => mode.value === styleMode)?.label || styleMode;
  const clientLabel = cleanText(plan?.briefSubject || client?.name || client?.company || 'Selected client');
  const architecture = Array.isArray(plan?.architecture) ? plan.architecture : [];
  const features = Array.isArray(plan?.sectionFeatures) ? plan.sectionFeatures : [];
  const effects = Array.isArray(plan?.globalEffects) ? plan.globalEffects : [];
  const assetLines = Array.isArray(plan?.assetsNeeded) ? plan.assetsNeeded : [];
  const awaitingApproval = phase === 'awaiting_approval';
  const previewReady = phase === 'preview_ready';
  const building = phase === 'building';

  return (
    <div style={{display: 'grid', gap: 8}}>
      <WorkflowSectionTitle>Plan</WorkflowSectionTitle>
      <div style={{padding: 16, borderRadius: 18, border: awaitingApproval ? '1px solid rgba(96,165,250,.24)' : '1px solid rgba(255,255,255,.06)', background: awaitingApproval ? 'rgba(30,41,59,.84)' : 'rgba(255,255,255,.03)', display: 'grid', gap: 12}}>
        <div style={{display: 'grid', gap: 6}}>
          <div style={{fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.12em', color: awaitingApproval ? '#93C5FD' : previewReady ? '#86EFAC' : '#64748B'}}>
            {awaitingApproval ? 'Plan ready' : building ? 'Build approved' : previewReady ? 'Plan approved' : 'Current direction'}
          </div>
          <div style={{fontSize: 15, fontWeight: 700, color: '#F8FAFC', lineHeight: 1.35}}>
            {plan.title}
          </div>
          <div style={{fontSize: 12, color: '#CBD5E1', lineHeight: 1.65}}>
            {plan.summary}
          </div>
        </div>

        <div style={{display: 'flex', gap: 8, flexWrap: 'wrap'}}>
          <span style={{padding: '6px 9px', borderRadius: 999, border: '1px solid rgba(255,255,255,.08)', background: 'rgba(255,255,255,.04)', fontSize: 11, color: '#E2E8F0'}}>
            {OUTPUT_MODES.find((mode) => mode.value === outputMode)?.label}
          </span>
          <span style={{padding: '6px 9px', borderRadius: 999, border: '1px solid rgba(255,255,255,.08)', background: 'rgba(255,255,255,.04)', fontSize: 11, color: '#E2E8F0'}}>
            {styleLabel}
          </span>
          <span style={{padding: '6px 9px', borderRadius: 999, border: '1px solid rgba(255,255,255,.08)', background: 'rgba(255,255,255,.04)', fontSize: 11, color: '#E2E8F0'}}>
            {clientLabel}
          </span>
        </div>

        {architecture.length ? (
          <div style={{display: 'grid', gap: 8}}>
            <div style={{fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.12em', color: '#64748B'}}>
              Architecture
            </div>
            <div style={{display: 'grid', gap: 7}}>
              {architecture.map((item, index) => (
                <div key={`${item}-${index}`} style={{fontSize: 12, color: '#E2E8F0', lineHeight: 1.55, display: 'flex', gap: 8}}>
                  <span style={{color: '#64748B', minWidth: 14}}>{index + 1}.</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {features.length ? (
          <div style={{display: 'grid', gap: 8}}>
            <div style={{fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.12em', color: '#64748B'}}>
              Sections + features
            </div>
            <div style={{display: 'grid', gap: 7}}>
              {features.map((item) => (
                <div key={item} style={{fontSize: 12, color: '#CBD5E1', lineHeight: 1.55}}>
                  {item}
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {effects.length ? (
          <div style={{display: 'grid', gap: 8}}>
            <div style={{fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.12em', color: '#64748B'}}>
              Global effects
            </div>
            <div style={{display: 'flex', gap: 8, flexWrap: 'wrap'}}>
              {effects.map((item) => (
                <span key={item} style={{padding: '6px 9px', borderRadius: 999, border: '1px solid rgba(255,255,255,.08)', background: 'rgba(2,6,23,.35)', fontSize: 11, color: '#E2E8F0'}}>
                  {item}
                </span>
              ))}
            </div>
          </div>
        ) : null}

        {assetLines.length ? (
          <div style={{display: 'grid', gap: 8}}>
            <div style={{fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.12em', color: '#64748B'}}>
              Assets needed
            </div>
            <div style={{display: 'grid', gap: 7}}>
              {assetLines.map((item) => (
                <div key={item} style={{fontSize: 12, color: '#CBD5E1', lineHeight: 1.55}}>
                  {item}
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {(awaitingApproval || building || previewReady) ? (
          <div style={{display: 'flex', gap: 8}}>
            <button
              onClick={onEditPlan}
              style={{flex: 1, padding: '10px 12px', borderRadius: 12, border: '1px solid rgba(255,255,255,.10)', background: 'rgba(255,255,255,.04)', color: '#F8FAFC', fontSize: 12, fontWeight: 700, cursor: 'pointer'}}
            >
              {awaitingApproval ? 'Edit plan' : 'Refine plan'}
            </button>
            <button
              onClick={onApprove}
              disabled={loading || !awaitingApproval}
              style={{flex: 1, padding: '10px 12px', borderRadius: 12, border: 'none', background: loading || !awaitingApproval ? '#334155' : '#2563EB', color: '#F8FAFC', fontSize: 12, fontWeight: 700, cursor: loading || !awaitingApproval ? 'default' : 'pointer'}}
            >
              {building || loading ? 'Building…' : previewReady ? 'Preview built' : 'Approve & Build'}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function WorkflowProgressCard({phase, buildProgress = [], buildEvents = []}) {
  const visibleEvents = buildEvents.slice(0, 4);
  const title = phase === 'building'
    ? 'Build progress'
    : phase === 'preview_ready'
      ? 'Build timeline'
      : 'Recent activity';

  if (!visibleEvents.length && !buildProgress.length) return null;

  return (
    <div style={{display: 'grid', gap: 8}}>
      <WorkflowSectionTitle>{title}</WorkflowSectionTitle>
      <div style={{padding: '14px 15px', borderRadius: 16, border: '1px solid rgba(255,255,255,.06)', background: 'rgba(255,255,255,.03)', display: 'grid', gap: 12}}>
        {buildProgress.length ? (
          <div style={{display: 'grid', gap: 8}}>
            {buildProgress.map((step) => {
              const dotColor = step.status === 'completed'
                ? '#34D399'
                : step.status === 'active'
                  ? '#60A5FA'
                  : step.status === 'error'
                    ? '#F87171'
                    : '#475569';
              return (
                <div key={step.id} style={{display: 'flex', alignItems: 'center', gap: 10}}>
                  <span style={{width: 8, height: 8, borderRadius: '50%', background: dotColor, flex: '0 0 auto'}} />
                  <div style={{fontSize: 12, color: step.status === 'queued' ? '#64748B' : '#E2E8F0', lineHeight: 1.5}}>
                    {step.label}
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}
        {visibleEvents.length ? (
          <div style={{display: 'grid', gap: 8}}>
            {visibleEvents.map((event, index) => (
              <div key={`${event.label}-${index}`} style={{padding: '10px 12px', borderRadius: 12, border: '1px solid rgba(255,255,255,.05)', background: 'rgba(2,6,23,.35)', display: 'grid', gap: 4}}>
                <div style={{fontSize: 11, fontWeight: 700, color: '#E2E8F0'}}>{event.label}</div>
                <div style={{fontSize: 11, color: '#94A3B8', lineHeight: 1.55}}>{event.detail}</div>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

class PreviewErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {error: null};
  }

  static getDerivedStateFromError(error) {
    return {error};
  }

  componentDidCatch(error, info) {
    console.error('Builder v2 preview render failed', error, info);
  }

  componentDidUpdate(prevProps) {
    if (prevProps.resetKey !== this.props.resetKey && this.state.error) {
      this.setState({error: null});
    }
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{borderRadius: 24, border: '1px solid rgba(248,113,113,.24)', background: 'rgba(127,29,29,.12)', padding: 24, display: 'grid', gap: 12}}>
          <div style={{fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: '#FCA5A5'}}>
            Preview renderer crashed
          </div>
          <div style={{fontSize: 14, fontWeight: 700, color: '#F8FAFC'}}>
            The build completed, but the live preview hit a render error.
          </div>
          <div style={{fontSize: 13, color: '#FECACA', lineHeight: 1.7}}>
            {String(this.state.error?.message || this.state.error || 'Unknown preview render error')}
          </div>
          <div style={{fontSize: 12, color: '#CBD5E1', lineHeight: 1.7}}>
            The structured JSON is still available below, so we can tighten the renderer without losing the build output.
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function PortalEditorV2Page() {
  const previewCaptureRef = useRef(null);
  const fileInputRef = useRef(null);
  const [viewportWidth, setViewportWidth] = useState(() => (typeof window === 'undefined' ? 1440 : window.innerWidth));
  const [outputMode, setOutputMode] = useState('portal');
  const [provider, setProvider] = useState('anthropic');
  const [model, setModel] = useState(MODEL_OPTIONS.anthropic[0].value);
  const [styleMode, setStyleMode] = useState('cinematic');
  const [messages, setMessages] = useState([{role: 'assistant', content: MODE_INTRO.portal}]);
  const [input, setInput] = useState('');
  const [phase, setPhase] = useState('idle');
  const [activeView, setActiveView] = useState('preview');
  const [toolNotice, setToolNotice] = useState('');
  const [clients, setClients] = useState([]);
  const [portals, setPortals] = useState([]);
  const [builderDataSource, setBuilderDataSource] = useState('live');
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedPortal, setSelectedPortal] = useState('');
  const [plan, setPlan] = useState(null);
  const [extractedJSON, setExtractedJSON] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [lastPublishedUrl, setLastPublishedUrl] = useState('');
  const [error, setError] = useState('');
  const [selectedPreviewNode, setSelectedPreviewNode] = useState(getDefaultPreviewNode('portal'));
  const [showInspectorPanel, setShowInspectorPanel] = useState(false);
  const [showStructuredOutput, setShowStructuredOutput] = useState(false);
  const [showActivity, setShowActivity] = useState(false);
  const [showDeployPanel, setShowDeployPanel] = useState(false);
  const [showFullConversation, setShowFullConversation] = useState(false);
  const [leftRailMode, setLeftRailMode] = useState('brief');
  const [showLibrary, setShowLibrary] = useState(false);
  const [showRawBrief, setShowRawBrief] = useState(false);
  const [references, setReferences] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [referenceLibrary, setReferenceLibrary] = useState(() => loadReferenceLibrary());
  const [helperLoading, setHelperLoading] = useState('');
  const [buildProgress, setBuildProgress] = useState([]);
  const [versions, setVersions] = useState([]);
  const [deploySlug, setDeploySlug] = useState('');
  const [deployPassword, setDeployPassword] = useState('');
  const [deployNotifyClient, setDeployNotifyClient] = useState(false);
  const [deployTemplateId, setDeployTemplateId] = useState('brand-reveal-v1');
  const [deployStatus, setDeployStatus] = useState('active');
  const [buildEvents, setBuildEvents] = useState([
    {label: 'Builder ready', detail: 'Start with a prompt and I will plan before building.'},
  ]);
  const buildProgressTimerRef = useRef(null);

  useEffect(() => {
    const handleResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    saveReferenceLibrary(referenceLibrary);
  }, [referenceLibrary]);

  useEffect(() => () => {
    if (buildProgressTimerRef.current) {
      window.clearInterval(buildProgressTimerRef.current);
    }
  }, []);

  const loadBuilderData = async () => {
    try {
      const [clientsData, portalsData] = await Promise.all([clientsApi.list(), portalsApi.list()]);
      const nextClients = clientsData || [];
      const nextPortals = portalsData?.portals || portalsData || [];
      if (!nextClients.length && !nextPortals.length) {
        const cached = readBuilderWorkspaceCache();
        if (cached?.clients?.length || cached?.portals?.length) {
          setClients(cached.clients || []);
          setPortals(cached.portals || []);
          setBuilderDataSource('cache');
          setError('Live workspace data came back empty, so the builder reopened your last synced client and portal list.');
          return;
        }

        setClients(FALLBACK_CLIENTS);
        setPortals(FALLBACK_PORTALS);
        setBuilderDataSource('fallback');
        setSelectedClient((current) => current || FALLBACK_CLIENT_ID);
        setSelectedPortal((current) => current || FALLBACK_PORTAL_ID);
        setError('No live clients or portals were returned, so the builder opened a local draft workspace instead.');
        return;
      }

      setClients(nextClients);
      setPortals(nextPortals);
      setBuilderDataSource('live');
      writeBuilderWorkspaceCache(nextClients, nextPortals);
      setError((current) => current?.includes('workspace') || current?.includes('builder data') ? '' : current);
    } catch (fetchError) {
      const cached = readBuilderWorkspaceCache();
      if (cached?.clients?.length || cached?.portals?.length) {
        setClients(cached.clients || []);
        setPortals(cached.portals || []);
        setBuilderDataSource('cache');
        setError('Live client and portal data is temporarily unavailable, so the builder is using your last synced workspace snapshot.');
        return;
      }

      setClients(FALLBACK_CLIENTS);
      setPortals(FALLBACK_PORTALS);
      setBuilderDataSource('fallback');
      setSelectedClient((current) => current || FALLBACK_CLIENT_ID);
      setSelectedPortal((current) => current || FALLBACK_PORTAL_ID);
      setError(`Live client and portal data is unavailable right now (${String(fetchError)}). You can keep planning in a local draft workspace and retry anytime.`);
    }
  };

  useEffect(() => {
    loadBuilderData();
  }, []);

  const filteredPortals = useMemo(
    () => (selectedClient
      ? portals.filter((portal) => String(portal.client_id) === String(selectedClient))
      : portals),
    [portals, selectedClient],
  );

  useEffect(() => {
    if (!clients.length) {
      if (selectedClient) setSelectedClient('');
      if (selectedPortal) setSelectedPortal('');
      return;
    }

    const clientStillExists = clients.some((client) => String(client.id) === String(selectedClient));
    const nextClientId = clientStillExists
      ? String(selectedClient)
      : String(clients[0].id);

    const nextPortals = portals.filter((portal) => (
      nextClientId ? String(portal.client_id) === String(nextClientId) : true
    ));
    const portalStillExists = nextPortals.some((portal) => String(portal.id) === String(selectedPortal));
    const nextPortalId = nextPortals.length
      ? (portalStillExists ? String(selectedPortal) : String(nextPortals[0].id))
      : '';

    if (nextClientId !== String(selectedClient || '')) {
      setSelectedClient(nextClientId);
    }

    if (nextPortalId !== String(selectedPortal || '')) {
      setSelectedPortal(nextPortalId);
    }
  }, [clients, portals, selectedClient, selectedPortal]);

  const selectedClientRecord = clients.find((client) => String(client.id) === String(selectedClient));
  const selectedPortalRecord = portals.find((portal) => String(portal.id) === String(selectedPortal));
  const normalizedPreview = extractedJSON
    ? normalizeBuilderPayload(outputMode, extractedJSON, {plan, client: selectedClientRecord, styleMode})
    : null;
  const resolvedActiveView = activeView;
  const previewBoundaryKey = JSON.stringify({
    outputMode,
    phase,
    title: normalizedPreview?.title || normalizedPreview?.presentation?.title || plan?.title || '',
    previewMode: normalizedPreview?.mode || '',
  });
  const {previewSummary, inspector, previewMetaError} = safelyBuildPreviewMeta({
    outputMode,
    normalizedPreview,
    plan,
    client: selectedClientRecord,
    selectedPreviewNode,
  });
  const canPatchPreview = Boolean(normalizedPreview && plan);
  const planNeedsApproval = Boolean(plan && phase === 'awaiting_approval');
  const planStatusLabel = planNeedsApproval ? 'Plan pending approval' : 'Approved build plan';
  const patchTargetLabel = canPatchPreview ? formatSelectionLabel(outputMode, selectedPreviewNode) : '';
  const promptPlaceholder = planNeedsApproval
    ? 'Describe what to change in the plan before building the preview…'
    : canPatchPreview
      ? `Describe the changes you want for ${patchTargetLabel.toLowerCase()} while keeping the rest of the build intact…`
      : outputMode === 'presentation'
        ? 'Describe the story, audience, and the motion language you want…'
        : 'Describe the portal, reference site, mood, components, and motion you want…';
  const promptActionLabel = planNeedsApproval ? 'Update plan' : canPatchPreview ? 'Patch preview' : 'Create plan';
  const primaryHeaderAction = planNeedsApproval ? 'approve' : (normalizedPreview && phase === 'preview_ready') ? 'save' : 'none';
  const showInspector = resolvedActiveView === 'preview' && showInspectorPanel && Boolean(normalizedPreview && inspector);
  const conversationMessages = messages.filter((message, index) => !(
    index === 0
    && message.role === 'assistant'
    && message.content === MODE_INTRO[outputMode]
  ));
  const visibleConversationMessages = showFullConversation
    ? conversationMessages
    : conversationMessages.slice(-4);
  const latestUserMessage = [...conversationMessages].reverse().find((message) => message.role === 'user');
  const briefSummary = useMemo(() => summarizeBriefForRail(latestUserMessage?.content || ''), [latestUserMessage?.content]);
  const promptForMatching = cleanText(input || latestUserMessage?.content || plan?.summary || '');
  const matchedLibraryItems = useMemo(() => getRecommendedLibraryItems({
    items: referenceLibrary,
    prompt: promptForMatching,
    client: selectedClientRecord,
    styleMode,
    outputMode,
    limit: 6,
  }), [referenceLibrary, promptForMatching, selectedClientRecord, styleMode, outputMode]);
  const libraryRuntimeContext = useMemo(() => libraryItemsToRuntimeContext(matchedLibraryItems), [matchedLibraryItems]);
  const effectiveReferences = useMemo(
    () => mergeReferenceItems(references, libraryRuntimeContext.references),
    [references, libraryRuntimeContext.references],
  );
  const effectiveAttachments = useMemo(
    () => mergeAttachmentItems(attachments, libraryRuntimeContext.attachments),
    [attachments, libraryRuntimeContext.attachments],
  );
  const latestEvent = buildEvents[0];
  const isMobile = viewportWidth < 768;
  const isTablet = viewportWidth < 1024;
  const completedBuildSteps = buildProgress.filter((step) => step.status === 'completed').length;
  const activeBuildStep = buildProgress.find((step) => step.status === 'active');
  const buildProgressValue = buildProgress.length
    ? Math.round((((completedBuildSteps) + (activeBuildStep ? 0.5 : 0)) / buildProgress.length) * 100)
    : 0;
  const chatStatusCopy = error
    ? error
    : previewMetaError
      ? previewMetaError
    : helperLoading === 'polish'
      ? 'Polishing your prompt…'
      : helperLoading === 'generate'
        ? 'Generating a stronger prompt from your references…'
        : phase === 'awaiting_approval'
          ? 'Plan ready. Review it when you want, then approve to build.'
          : phase === 'building'
            ? `Building now${activeBuildStep ? `: ${activeBuildStep.label}` : '…'}`
            : phase === 'preview_ready'
              ? 'Preview ready. Keep prompting to refine the result.'
              : latestEvent?.detail || 'Describe what you want and I’ll build it into the preview.';
  const builderDataNeedsRetry = builderDataSource !== 'live';
  const builderDataChip = builderDataSource === 'cache'
    ? 'Cached workspace'
    : builderDataSource === 'fallback'
      ? 'Draft workspace'
      : null;
  const publishSlug = slugifyValue(deploySlug || selectedPortalRecord?.slug || selectedClientRecord?.name || '');
  const publishUrl = publishSlug ? `${PORTAL_URL}/${publishSlug}` : '';
  const contextCount = effectiveReferences.length + effectiveAttachments.length;
  const isIdleEmpty = !plan && !latestUserMessage && !loading && phase === 'idle';
  const showRailModes = true;

  useEffect(() => {
    setSelectedPreviewNode(getDefaultPreviewNode(outputMode));
  }, [outputMode]);

  useEffect(() => {
    const nextSlug = selectedPortalRecord?.slug
      || slugifyValue(selectedClientRecord?.company || selectedClientRecord?.name || plan?.title || '');
    setDeploySlug(nextSlug);
    setDeployTemplateId(
      selectedPortalRecord?.template_id
      || normalizedPreview?.portalTemplate
      || 'brand-reveal-v1'
    );
    setDeployStatus(selectedPortalRecord?.status || 'active');
    setDeployPassword('');
    setLastPublishedUrl('');
  }, [selectedPortalRecord, selectedClientRecord, plan, normalizedPreview]);

  const appendBuildEvent = (label, detail) => {
    setBuildEvents((current) => [{label, detail}, ...current].slice(0, 10));
  };

  const stopBuildProgress = () => {
    if (buildProgressTimerRef.current) {
      window.clearInterval(buildProgressTimerRef.current);
      buildProgressTimerRef.current = null;
    }
  };

  const startBuildProgress = (structure = []) => {
    stopBuildProgress();
    const steps = createBuildProgress(structure);
    setBuildProgress(steps);

    if (steps.length <= 1) return;

    buildProgressTimerRef.current = window.setInterval(() => {
      setBuildProgress((current) => {
        const activeIndex = current.findIndex((step) => step.status === 'active');
        if (activeIndex === -1 || activeIndex >= current.length - 1) return current;

        return current.map((step, index) => ({
          ...step,
          status: index < activeIndex + 1 ? 'completed' : index === activeIndex + 1 ? 'active' : 'queued',
        }));
      });
    }, 1100);
  };

  const completeBuildProgress = () => {
    stopBuildProgress();
    setBuildProgress((current) => current.map((step) => ({...step, status: 'completed'})));
  };

  const failBuildProgress = () => {
    stopBuildProgress();
    setBuildProgress((current) => {
      const activeIndex = current.findIndex((step) => step.status === 'active');
      if (activeIndex === -1) return current;

      return current.map((step, index) => ({
        ...step,
        status: index === activeIndex ? 'error' : step.status,
      }));
    });
  };

  const handleInspectorFieldChange = (fieldKey, value) => {
    if (!extractedJSON) return;

    setExtractedJSON((current) => updateWrappedOutput(current, outputMode, (content) => {
      if (outputMode === 'presentation') {
        return patchPresentationPreview(content, selectedPreviewNode, fieldKey, value);
      }

      return patchPortalPreview(content, selectedPreviewNode, fieldKey, value);
    }));
  };

  const handlePlanFieldChange = (fieldKey, value) => {
    setPlan((current) => {
      if (!current) return current;
      return {
        ...current,
        [fieldKey]: value,
      };
    });
  };

  const handlePlanSectionChange = (index, value) => {
    setPlan((current) => {
      if (!current) return current;
      const nextStructure = [...(current.structure || [])];
      nextStructure[index] = value;

      const nextUnderstanding = current.understanding
        ? {
            ...current.understanding,
            sections: nextStructure,
          }
        : current.understanding;

      const nextContentPlan = (current.contentPlan || []).map((item) => {
        const matchedIndex = (current.structure || []).findIndex((section) => section === item.section);
        if (matchedIndex === index) {
          return {
            ...item,
            section: value,
          };
        }
        return item;
      });

      return {
        ...current,
        structure: nextStructure,
        understanding: nextUnderstanding,
        contentPlan: nextContentPlan,
      };
    });
  };

  const handleAddPlanSection = () => {
    setPlan((current) => {
      if (!current) return current;
      const nextStructure = [...(current.structure || []), `New section ${(current.structure || []).length + 1}`];
      return {
        ...current,
        structure: nextStructure,
        understanding: current.understanding
          ? {
              ...current.understanding,
              sections: nextStructure,
            }
          : current.understanding,
      };
    });
  };

  const handleRemovePlanSection = (index) => {
    setPlan((current) => {
      if (!current) return current;
      if ((current.structure || []).length <= 1) return current;
      const nextStructure = (current.structure || []).filter((_, currentIndex) => currentIndex !== index);
      const removedSection = current.structure?.[index];
      return {
        ...current,
        structure: nextStructure,
        understanding: current.understanding
          ? {
              ...current.understanding,
              sections: nextStructure,
            }
          : current.understanding,
        contentPlan: (current.contentPlan || []).filter((item) => item.section !== removedSection),
      };
    });
  };

  const addVersion = ({description, nextPlan, nextExtractedJSON}) => {
    if (!nextExtractedJSON) return;
    setVersions((current) => [
      createVersionRecord({
        description,
        outputMode,
        plan: nextPlan,
        extractedJSON: nextExtractedJSON,
      }),
      ...current,
    ].slice(0, 12));
  };

  const restoreVersion = (versionId) => {
    const version = versions.find((item) => item.id === versionId);
    if (!version) return;

    stopBuildProgress();
    setPlan(version.plan || null);
    setExtractedJSON(version.extractedJSON || null);
    setPhase(version.extractedJSON ? 'preview_ready' : 'awaiting_approval');
    setActiveView('preview');
    setBuildProgress([]);
    setShowInspectorPanel(false);
    setSelectedPreviewNode(getDefaultPreviewNode(version.outputMode || outputMode));
    appendBuildEvent('Version restored', version.description);
    setToolNotice(`Restored ${version.title}.`);
  };

  const handleAssetSwap = (currentAsset, nextAssetId) => {
    if (!currentAsset || currentAsset.id === nextAssetId) return;

    const nextAsset = getRegistryOptionsForCategory({
      category: currentAsset.category,
      outputMode,
      limit: 50,
    }).find((item) => item.id === nextAssetId);

    if (!nextAsset) return;

    setPlan((current) => {
      if (!current) return current;

      const selectedAssets = (current.selectedAssets || []).map((item) => (
        item.id === currentAsset.id ? nextAsset : item
      ));

      return {
        ...current,
        selectedAssets,
        visualDirection: syncAssetMixLine(current, selectedAssets),
      };
    });

    appendBuildEvent('Asset swapped', `${currentAsset.title} replaced with ${nextAsset.title}.`);
  };

  const resetSession = () => {
    stopBuildProgress();
    setMessages([{role: 'assistant', content: MODE_INTRO[outputMode]}]);
    setInput('');
    setPlan(null);
    setExtractedJSON(null);
    setPhase('idle');
    setActiveView('preview');
    setError('');
    setSelectedPreviewNode(getDefaultPreviewNode(outputMode));
    setShowInspectorPanel(false);
    setShowStructuredOutput(false);
    setShowActivity(false);
    setToolNotice('');
    setBuildProgress([]);
    setVersions([]);
    setBuildEvents([{label: 'Builder reset', detail: 'New session started.'}]);
  };

  const handleProviderChange = (nextProvider) => {
    setProvider(nextProvider);
    setModel(MODEL_OPTIONS[nextProvider][0].value);
  };

  const handleModeChange = (nextMode) => {
    stopBuildProgress();
    setOutputMode(nextMode);
    setMessages([{role: 'assistant', content: MODE_INTRO[nextMode]}]);
    setPlan(null);
    setExtractedJSON(null);
    setPhase('idle');
    setActiveView('preview');
    setSaveMsg('');
    setSelectedPreviewNode(getDefaultPreviewNode(nextMode));
    setShowInspectorPanel(false);
    setShowStructuredOutput(false);
    setToolNotice('');
    setBuildProgress([]);
    setVersions([]);
    appendBuildEvent('Mode changed', `Switched to ${nextMode}.`);
  };

  const handleClientChange = (nextClientId) => {
    setSelectedClient(nextClientId);
    if (selectedPortal) {
      const portalStillValid = portals.some(
        (portal) => String(portal.id) === String(selectedPortal) && String(portal.client_id) === String(nextClientId),
      );
      if (!portalStillValid) setSelectedPortal('');
    }
  };

  const handlePortalChange = (nextPortalId) => {
    setSelectedPortal(nextPortalId);
    const portal = portals.find((entry) => String(entry.id) === String(nextPortalId));
    if (portal) setSelectedClient(String(portal.client_id));
  };

  const handleAddReference = () => {
    const value = window.prompt('Add a reference URL or note for the builder.');
    const nextValue = cleanText(value);
    if (!nextValue) return;

    setReferences((current) => [
      ...current,
      {
        id: `ref-${Date.now()}`,
        label: nextValue.replace(/^https?:\/\//, '').slice(0, 60),
        value: nextValue,
      },
    ]);
    setToolNotice('Reference added to the builder context.');
    appendBuildEvent('Reference added', nextValue);
  };

  const handleFilesSelected = async (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    try {
      const nextAttachments = await Promise.all(files.map(async (file) => {
        let dataUrl = '';

        if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
          try {
            dataUrl = await readFileAsDataUrl(file);
          } catch {
            dataUrl = '';
          }
        }

        return buildAttachmentRecord(file, dataUrl);
      }));

      setAttachments((current) => [
        ...current,
        ...nextAttachments,
      ]);
      setToolNotice(`${files.length} file${files.length === 1 ? '' : 's'} attached to the prompt context.`);
      appendBuildEvent('Files attached', nextAttachments.map((file) => file.name).join(', '));
    } finally {
      event.target.value = '';
    }
  };

  const handleSaveSourcesToLibrary = () => {
    const entries = createLibraryEntries({
      references,
      attachments,
      client: selectedClientRecord,
    });

    if (!entries.length) {
      setToolNotice('Add a few references or files first, then save them to the library.');
      return;
    }

    const beforeCount = referenceLibrary.length;
    const nextLibrary = mergeLibraryEntries(referenceLibrary, entries);
    setReferenceLibrary(nextLibrary);
    const addedCount = Math.max(nextLibrary.length - beforeCount, 0);
    setShowLibrary(true);
    setLeftRailMode('library');
    setToolNotice(addedCount ? `${addedCount} source${addedCount === 1 ? '' : 's'} saved to the reference library.` : 'Those sources are already in the reference library.');
    appendBuildEvent('Library updated', `${entries.length} source${entries.length === 1 ? '' : 's'} saved for future builds.`);
  };

  const handleRemoveLibraryItem = (itemId) => {
    setReferenceLibrary((current) => removeLibraryEntry(current, itemId));
  };

  const handleCaptureScreenshot = async () => {
    if (!previewCaptureRef.current) return;

    try {
      const dataUrl = await toPng(previewCaptureRef.current, {
        cacheBust: true,
        pixelRatio: 2,
      });
      const link = document.createElement('a');
      link.download = `builder-preview-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
      setToolNotice('Preview screenshot downloaded.');
      appendBuildEvent('Screenshot captured', 'Downloaded the current preview as PNG.');
    } catch (captureError) {
      setToolNotice(`Screenshot failed. ${String(captureError)}`);
    }
  };

  const runPromptHelper = async (mode) => {
    if (helperLoading) return;

    const helperInput = mode === 'polish' ? cleanText(input) : '';
    if (mode === 'polish' && !helperInput) {
      setToolNotice('Add some prompt text first, then polish it.');
      return;
    }

    setHelperLoading(mode);
    setToolNotice('');

    try {
      const helperPrompt = mode === 'polish'
        ? buildPromptPolishMessage({
            input: helperInput,
            outputMode,
            styleMode,
            client: selectedClientRecord,
            references: effectiveReferences,
            attachments: effectiveAttachments,
          })
        : buildPromptGeneratorMessage({
            outputMode,
            styleMode,
            client: selectedClientRecord,
            references: effectiveReferences,
            attachments: effectiveAttachments,
          });

      const data = await ai.generateBuilderContent({
        provider,
        model,
        styleMode,
        templateId: selectedPortalRecord?.template_id || 'brand-reveal-v1',
        portalIntent: 'brand-identity',
        outputMode,
        messages: [
          {role: 'assistant', content: MODE_INTRO[outputMode]},
          buildVisualReferenceMessage({
            client: selectedClientRecord,
            portal: selectedPortalRecord,
            references: effectiveReferences,
            attachments: effectiveAttachments,
          }),
          {role: 'assistant', content: helperPrompt},
        ].filter(Boolean),
        maxTokens: 900,
      });

      const nextText = normalizeTextReply(data.reply || '');
      if (!nextText) {
        setToolNotice('The prompt helper returned an empty result.');
        return;
      }

      setInput(nextText);
      setToolNotice(mode === 'polish' ? 'Prompt polished.' : 'Starter prompt generated from your current context.');
      appendBuildEvent(mode === 'polish' ? 'Prompt polished' : 'Prompt generated', nextText.slice(0, 120));
    } catch (helperError) {
      setToolNotice(`${mode === 'polish' ? 'Prompt polish' : 'Prompt generation'} failed. ${String(helperError)}`);
    } finally {
      setHelperLoading('');
    }
  };

  const handleToolMenuAction = async (action) => {
    if (action === 'history') {
      setLeftRailMode('history');
      setToolNotice('Version history opened.');
      return;
    }

    if (action === 'reference') {
      handleAddReference();
      return;
    }

    if (action === 'attach') {
      fileInputRef.current?.click();
      return;
    }

    if (action === 'screenshot') {
      await handleCaptureScreenshot();
      return;
    }
  };

  const submitPrompt = async () => {
    if (!cleanText(input) || loading) return;

    const userPrompt = cleanText(input);

    if (planNeedsApproval && plan) {
      stopBuildProgress();
      const revisedPrompt = [
        plan.briefSubject ? `Subject: ${plan.briefSubject}` : '',
        plan.visualThesis ? `Current direction: ${plan.visualThesis}` : '',
        plan.structure?.length ? `Current structure: ${plan.structure.join(' • ')}` : '',
        `Revision request: ${userPrompt}`,
      ].filter(Boolean).join('\n');

      const revisedPlan = createPlan({
        prompt: revisedPrompt,
        outputMode,
        styleMode,
        client: selectedClientRecord,
        references: effectiveReferences,
        attachments: effectiveAttachments,
        libraryMatches: matchedLibraryItems,
      });

      setMessages((current) => [
        ...current,
        {role: 'user', content: userPrompt},
        {role: 'assistant', content: 'Plan updated. Review the revision, and approve it when you are ready to build the first preview.'},
      ]);
      setPlan(revisedPlan);
      setExtractedJSON(null);
      setBuildProgress([]);
      setInput('');
      setPhase('awaiting_approval');
      setActiveView('preview');
      setError('');
      setSaveMsg('');
      setSelectedPreviewNode(getDefaultPreviewNode(outputMode));
      setShowInspectorPanel(false);
      setShowStructuredOutput(false);
      setToolNotice('Plan updated. Review it, or keep refining before you build.');
      appendBuildEvent('Plan revised', revisedPlan.title);
      return;
    }

    if (canPatchPreview) {
      setMessages((current) => [...current, {role: 'user', content: userPrompt}]);
      setInput('');
      setLoading(true);
      setPhase('patching');
      setActiveView('preview');
      setError('');
      setSaveMsg('');
      appendBuildEvent('Patch started', `Updating ${patchTargetLabel} from follow-up prompt.`);

      try {
        const requestMessages = [
          {role: 'assistant', content: MODE_INTRO[outputMode]},
          {role: 'assistant', content: buildContextMessage({client: selectedClientRecord, portal: selectedPortalRecord, plan})},
          buildVisualReferenceMessage({
            client: selectedClientRecord,
            portal: selectedPortalRecord,
            plan,
            references: effectiveReferences,
            attachments: effectiveAttachments,
          }),
          {role: 'assistant', content: buildPlanMessage(plan)},
          {
            role: 'assistant',
            content: buildPatchMessage({
              outputMode,
              plan,
              selectedNodeId: selectedPreviewNode,
              preview: normalizedPreview,
              instruction: userPrompt,
            }),
          },
        ].filter(Boolean);

        const data = await ai.generateBuilderContent({
          provider,
          model,
          styleMode,
          templateId: selectedPortalRecord?.template_id || 'brand-reveal-v1',
          portalIntent: 'brand-identity',
          outputMode,
          messages: requestMessages,
          maxTokens: outputMode === 'presentation' ? 2600 : 2200,
        });

        const reply = data.reply || 'The builder finished the patch request, but did not return a structured response.';
        const json = data.structured || extractJSON(reply);

        setMessages((current) => [...current, {
          role: 'assistant',
          content: json
            ? createBuildStatusMessage({outputMode, json, plan, client: selectedClientRecord})
            : reply,
        }]);

        if (!json) {
          setPhase('error');
          setError('Patch reply did not include structured JSON. Existing preview was preserved.');
          appendBuildEvent('Patch failed', 'No structured JSON returned. Existing preview preserved.');
          return;
        }

        setExtractedJSON(json);
        setPhase('preview_ready');
        setShowInspectorPanel(false);
        addVersion({
          description: `Patched ${patchTargetLabel}`,
          nextPlan: plan,
          nextExtractedJSON: json,
        });
        appendBuildEvent('Patch applied', `${patchTargetLabel} updated in the live preview.`);
        return;
      } catch (patchError) {
        setPhase('error');
        setError(`Patch failed. ${String(patchError)}`);
        appendBuildEvent('Patch failed', String(patchError));
        return;
      } finally {
        setLoading(false);
      }
    }

    stopBuildProgress();
    const nextPlan = createPlan({
      prompt: userPrompt,
      outputMode,
      styleMode,
      client: selectedClientRecord,
      references: effectiveReferences,
      attachments: effectiveAttachments,
      libraryMatches: matchedLibraryItems,
    });

    setMessages((current) => [
      ...current,
      {role: 'user', content: userPrompt},
      {role: 'assistant', content: 'Understanding captured. Review the parsed direction, confirm the plan, and approve when you are ready to build.'},
    ]);
    setPlan(nextPlan);
    setExtractedJSON(null);
    setBuildProgress([]);
    setInput('');
    setPhase('awaiting_approval');
    setActiveView('preview');
    setError('');
    setSaveMsg('');
    setSelectedPreviewNode(getDefaultPreviewNode(outputMode));
    setShowInspectorPanel(false);
    setShowStructuredOutput(false);
    appendBuildEvent('Understanding captured', `${nextPlan.understanding.portalType} • ${nextPlan.understanding.motionStyle}`);
    appendBuildEvent('Plan generated', nextPlan.title);
  };

  const approveAndBuild = async () => {
    if (!plan || loading) return;

    const provisionalOutput = createFallbackStructuredOutput({
      outputMode,
      plan,
      client: selectedClientRecord,
      styleMode,
    });

    setLoading(true);
    setPhase('building');
    setActiveView('preview');
    setError('');
    setExtractedJSON(null);
    setShowDeployPanel(false);
    setShowInspectorPanel(false);
    startBuildProgress(plan.structure);
    appendBuildEvent('Build started', 'Using approved plan to generate structured output.');

    try {
      const requestMessages = [
        {role: 'assistant', content: MODE_INTRO[outputMode]},
        {role: 'assistant', content: buildContextMessage({client: selectedClientRecord, portal: selectedPortalRecord, plan})},
        buildVisualReferenceMessage({
          client: selectedClientRecord,
          portal: selectedPortalRecord,
          plan,
          references: effectiveReferences,
          attachments: effectiveAttachments,
        }),
        ...messages,
        {role: 'assistant', content: buildPlanMessage(plan)},
      ].filter(Boolean);

      const data = await ai.generateBuilderContent({
        provider,
        model,
        styleMode,
        templateId: selectedPortalRecord?.template_id || 'brand-reveal-v1',
        portalIntent: 'brand-identity',
        outputMode,
        messages: requestMessages.map((message) => ({
          role: message.role,
          content: message.content,
        })),
        maxTokens: outputMode === 'presentation' ? 2400 : 1800,
      });

      const reply = data.reply || 'The builder finished, but did not return a structured response.';
      const json = data.structured || extractJSON(reply);

      setMessages((current) => [...current, {
        role: 'assistant',
        content: json
          ? createBuildStatusMessage({outputMode, json, plan, client: selectedClientRecord})
          : reply,
      }]);
      if (!json) {
        setExtractedJSON(provisionalOutput);
        setPhase('preview_ready');
        setError('The model did not return clean structured JSON, so you are seeing a plan-based working draft instead.');
        completeBuildProgress();
        addVersion({
          description: 'Fallback working draft',
          nextPlan: plan,
          nextExtractedJSON: provisionalOutput,
        });
        appendBuildEvent('Fallback draft ready', 'Model reply was incomplete, so the approved plan was turned into a working draft preview.');
        return;
      }

      setExtractedJSON(json);
      setPhase('preview_ready');
      setSelectedPreviewNode(getDefaultPreviewNode(outputMode));
      setShowInspectorPanel(false);
      setShowDeployPanel(Boolean(selectedPortal));
      completeBuildProgress();
      addVersion({
        description: 'Initial build',
        nextPlan: plan,
        nextExtractedJSON: json,
      });
      appendBuildEvent('Build finished', 'Structured preview ready.');
    } catch (buildError) {
      setPhase('error');
      setError(`Builder failed. ${String(buildError)}`);
      failBuildProgress();
      appendBuildEvent('Build failed', String(buildError));
    } finally {
      setLoading(false);
    }
  };

  const saveToPortal = async () => {
    if (!selectedPortal) {
      setSaveMsg('Publish needs a target portal first. Select one before publishing.');
      setShowDeployPanel(true);
      return;
    }

    if (!extractedJSON) {
      setSaveMsg('There is no structured build to publish yet. Approve and build first.');
      setShowDeployPanel(true);
      return;
    }

    setSaving(true);
    setSaveMsg('');

    try {
      const rawPayload = normalizeBuilderPayload(outputMode, extractedJSON, {plan, client: selectedClientRecord, styleMode});
      const payload = outputMode === 'presentation'
        ? rawPayload
        : withPortalMetadata(rawPayload, {
            templateId: deployTemplateId || selectedPortalRecord?.template_id || 'brand-reveal-v1',
            styleMode,
          });

      const nextSlug = slugifyValue(deploySlug || selectedPortalRecord?.slug || selectedClientRecord?.name || 'portal');
      const updatePayload = {
        slug: nextSlug,
        template_id: deployTemplateId || 'brand-reveal-v1',
        status: deployStatus || 'active',
      };

      if (deployPassword.trim()) {
        updatePayload.password = deployPassword.trim();
      }

      const updatedPortal = await portalsApi.update(selectedPortal, updatePayload);
      await portalsApi.updateContent(selectedPortal, payload);

      const mergedPortal = {
        ...selectedPortalRecord,
        ...updatedPortal,
        slug: updatedPortal?.slug || nextSlug,
        template_id: updatedPortal?.template_id || updatePayload.template_id,
        status: updatedPortal?.status || updatePayload.status,
      };

      setPortals((current) => current.map((portal) => (
        String(portal.id) === String(selectedPortal)
          ? {...portal, ...mergedPortal, content: payload}
          : portal
      )));

      if (deployNotifyClient && selectedClientRecord?.email) {
        const shareUrl = `${PORTAL_URL}/${mergedPortal.slug || nextSlug}`;
        const subject = encodeURIComponent(`${selectedClientRecord.name || 'Your'} portal is ready`);
        const body = encodeURIComponent(
          `Hi ${selectedClientRecord.name || ''},\n\nYour updated ${outputMode === 'presentation' ? 'presentation' : 'portal'} is ready.\n\nView it here: ${shareUrl}\n${deployPassword.trim() ? `Password: ${deployPassword.trim()}\n` : ''}\nBest,\nBradley Robert Creative`,
        );
        window.open(`mailto:${selectedClientRecord.email}?subject=${subject}&body=${body}`, '_blank', 'noopener,noreferrer');
      }

      setLastPublishedUrl(`${PORTAL_URL}/${mergedPortal.slug || nextSlug}`);
      setSaveMsg(`Published ${outputMode === 'presentation' ? 'presentation' : 'portal'} to ${mergedPortal.slug || nextSlug}.`);
      appendBuildEvent('Published', 'Structured output and portal settings were sent live to the selected client portal.');
      setShowDeployPanel(false);
    } catch (saveError) {
      setLastPublishedUrl('');
      setSaveMsg(`Publish failed. ${String(saveError)}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{display: 'flex', flexDirection: isTablet ? 'column' : 'row', minHeight: '100vh', background: '#020617', color: '#E2E8F0', fontFamily: 'Inter, sans-serif'}}>
      <aside style={{width: isTablet ? '100%' : 344, borderRight: isTablet ? 'none' : '1px solid rgba(255,255,255,.06)', borderBottom: isTablet ? '1px solid rgba(255,255,255,.06)' : 'none', background: 'linear-gradient(180deg, rgba(15,23,42,1) 0%, rgba(2,6,23,1) 100%)', display: 'flex', flexDirection: 'column'}}>
        <div style={{padding: '18px 18px 14px', borderBottom: '1px solid rgba(255,255,255,.06)', display: 'grid', gap: 12}}>
          <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12}}>
            <div>
              <div style={{fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.14em', color: '#64748B'}}>Envision</div>
              <div style={{fontSize: 20, fontWeight: 800, color: '#F8FAFC', marginTop: 4}}>Builder v2</div>
            </div>
            <PhasePill phase={phase} />
          </div>

          <div style={{display: 'flex', gap: 8, flexWrap: 'wrap'}}>
            {OUTPUT_MODES.map((mode) => (
              <button
                key={mode.value}
                onClick={() => handleModeChange(mode.value)}
                style={{
                  padding: '8px 12px',
                  borderRadius: 999,
                  border: outputMode === mode.value ? '1px solid rgba(96,165,250,.28)' : '1px solid rgba(255,255,255,.08)',
                  background: outputMode === mode.value ? 'rgba(37,99,235,.18)' : 'rgba(255,255,255,.03)',
                  color: outputMode === mode.value ? '#DBEAFE' : '#CBD5E1',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {mode.label}
              </button>
            ))}
          </div>

          <div style={{display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 10}}>
            <label style={{display: 'grid', gap: 6}}>
              <span style={{fontSize: 10, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '.08em'}}>Client</span>
              <select
                value={selectedClient}
                onChange={(e) => handleClientChange(e.target.value)}
                style={{width: '100%', padding: '10px 12px', borderRadius: 12, border: '1px solid rgba(255,255,255,.08)', background: 'rgba(255,255,255,.04)', color: '#F8FAFC', fontSize: 13}}
              >
                <option value="">Select a client…</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id} style={{color: '#111827'}}>
                    {client.name}{client.company ? ` — ${client.company}` : ''}
                  </option>
                ))}
              </select>
            </label>

            <label style={{display: 'grid', gap: 6}}>
              <span style={{fontSize: 10, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '.08em'}}>Portal</span>
              <select
                value={selectedPortal}
                onChange={(e) => handlePortalChange(e.target.value)}
                style={{width: '100%', padding: '10px 12px', borderRadius: 12, border: '1px solid rgba(255,255,255,.08)', background: 'rgba(255,255,255,.04)', color: '#F8FAFC', fontSize: 13}}
              >
                <option value="">Select a portal…</option>
                {filteredPortals.map((portal) => (
                  <option key={portal.id} value={portal.id} style={{color: '#111827'}}>
                    {(portal.client_name || portal.slug)} ({portal.slug})
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div style={{display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, minmax(0, 1fr))', gap: 10}}>
            <label style={{display: 'grid', gap: 6}}>
              <span style={{fontSize: 10, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '.08em'}}>Provider</span>
              <select
                value={provider}
                onChange={(e) => handleProviderChange(e.target.value)}
                style={{width: '100%', padding: '10px 12px', borderRadius: 12, border: '1px solid rgba(255,255,255,.08)', background: 'rgba(255,255,255,.04)', color: '#F8FAFC', fontSize: 13}}
              >
                {Object.keys(MODEL_OPTIONS).map((option) => (
                  <option key={option} value={option} style={{color: '#111827'}}>
                    {option.charAt(0).toUpperCase() + option.slice(1)}
                  </option>
                ))}
              </select>
            </label>

            <label style={{display: 'grid', gap: 6}}>
              <span style={{fontSize: 10, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '.08em'}}>Model</span>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                style={{width: '100%', padding: '10px 12px', borderRadius: 12, border: '1px solid rgba(255,255,255,.08)', background: 'rgba(255,255,255,.04)', color: '#F8FAFC', fontSize: 13}}
              >
                {MODEL_OPTIONS[provider].map((option) => (
                  <option key={option.value} value={option.value} style={{color: '#111827'}}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label style={{display: 'grid', gap: 6}}>
              <span style={{fontSize: 10, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '.08em'}}>Art direction</span>
              <select
                value={styleMode}
                onChange={(e) => setStyleMode(e.target.value)}
                style={{width: '100%', padding: '10px 12px', borderRadius: 12, border: '1px solid rgba(255,255,255,.08)', background: 'rgba(255,255,255,.04)', color: '#F8FAFC', fontSize: 13}}
              >
                {STYLE_MODES.map((mode) => (
                  <option key={mode.value} value={mode.value} style={{color: '#111827'}}>
                    {mode.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '10px 12px', borderRadius: 16, border: error ? '1px solid rgba(248,113,113,.18)' : '1px solid rgba(255,255,255,.06)', background: error ? 'rgba(127,29,29,.10)' : 'rgba(255,255,255,.03)'}}>
            <div style={{fontSize: 12, color: error ? '#FECACA' : '#CBD5E1', lineHeight: 1.5}}>
              {isIdleEmpty ? 'Ready for a prompt.' : chatStatusCopy}
            </div>
            <div style={{display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end'}}>
              {builderDataChip ? (
                <span style={{fontSize: 10, color: '#FDE68A', borderRadius: 999, padding: '5px 9px', background: 'rgba(120,53,15,.18)', border: '1px solid rgba(251,191,36,.2)'}}>
                  {builderDataChip}
                </span>
              ) : null}
              <span style={{fontSize: 10, color: '#E2E8F0', borderRadius: 999, padding: '5px 9px', background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.08)'}}>
                {STYLE_MODES.find((mode) => mode.value === styleMode)?.label}
              </span>
              {contextCount ? (
                <span style={{fontSize: 10, color: '#E2E8F0', borderRadius: 999, padding: '5px 9px', background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.08)'}}>
                  {contextCount} source{contextCount === 1 ? '' : 's'}
                </span>
              ) : null}
              {builderDataNeedsRetry ? (
                <button
                  onClick={loadBuilderData}
                  style={{padding: '5px 10px', borderRadius: 999, border: '1px solid rgba(251,191,36,.24)', background: 'rgba(120,53,15,.2)', color: '#FDE68A', fontSize: 10, fontWeight: 700, cursor: 'pointer'}}
                >
                  Retry data
                </button>
              ) : null}
            </div>
          </div>

          {showRailModes ? (
            <div style={{display: 'flex', gap: 8, flexWrap: 'wrap'}}>
              {[
                {id: 'brief', label: 'Brief'},
                {id: 'library', label: 'Library'},
                {id: 'history', label: 'History'},
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setLeftRailMode(tab.id)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 999,
                    border: leftRailMode === tab.id ? '1px solid rgba(96,165,250,.28)' : '1px solid rgba(255,255,255,.08)',
                    background: leftRailMode === tab.id ? 'rgba(37,99,235,.18)' : 'rgba(255,255,255,.03)',
                    color: leftRailMode === tab.id ? '#DBEAFE' : '#CBD5E1',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div style={{flex: 1, minHeight: 0, overflowY: 'auto', padding: 16, display: 'grid', gap: 14, alignContent: 'start'}}>
          {isIdleEmpty ? (
            <div style={{fontSize: 12, color: '#64748B', lineHeight: 1.7, paddingTop: 2}}>
              Describe what you want to build, then I’ll turn it into a plan and working draft.
            </div>
          ) : null}

          {leftRailMode === 'brief' ? (
            <div style={{display: 'grid', gap: 14}}>
              {plan ? (
                <WorkflowPlanCard
                  plan={plan}
                  outputMode={outputMode}
                  styleMode={styleMode}
                  client={selectedClientRecord}
                  loading={loading}
                  phase={phase}
                  onApprove={approveAndBuild}
                  onEditPlan={() => {
                    setActiveView('preview');
                    setToolNotice('Describe what to change, then click Update plan.');
                  }}
                />
              ) : null}

              {(phase === 'building' || phase === 'preview_ready' || buildEvents.length > 1) ? (
                <WorkflowProgressCard
                  phase={phase}
                  buildProgress={buildProgress}
                  buildEvents={buildEvents}
                />
              ) : null}

              {!isIdleEmpty ? (
                <WorkflowPromptCard
                  prompt={briefSummary}
                  onToggleRaw={() => setShowRawBrief((current) => !current)}
                  showRaw={showRawBrief}
                  isStructured={briefSummary.isStructured}
                />
              ) : null}
            </div>
          ) : null}

          {leftRailMode === 'library' ? (
            <div style={{display: 'grid', gap: 14}}>
              <div style={{display: 'grid', gap: 8}}>
                <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10}}>
                  <div style={{fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.12em', color: '#64748B'}}>Source material</div>
                  <div style={{display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end'}}>
                    <button
                      type="button"
                      onClick={handleSaveSourcesToLibrary}
                      style={{
                        padding: '7px 10px',
                        borderRadius: 999,
                        border: '1px solid rgba(56,189,248,.18)',
                        background: 'rgba(56,189,248,.10)',
                        color: '#BAE6FD',
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      Save to library
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowLibrary((current) => !current)}
                      style={{
                        padding: '7px 10px',
                        borderRadius: 999,
                        border: '1px solid rgba(255,255,255,.08)',
                        background: 'rgba(255,255,255,.03)',
                        color: '#CBD5E1',
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      {showLibrary ? 'Hide library' : `Open library (${referenceLibrary.length})`}
                    </button>
                  </div>
                </div>

                {!references.length && !attachments.length && !matchedLibraryItems.length ? (
                  <div style={{fontSize: 12, color: '#64748B', lineHeight: 1.7, padding: '2px 0 8px'}}>
                    Bring references, screenshots, motion clips, or project files in here and save the best ones into the library for future builds.
                  </div>
                ) : null}

                {matchedLibraryItems.length ? (
                  <div style={{display: 'grid', gap: 8}}>
                    <div style={{fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.12em', color: '#475569'}}>Suggested from library</div>
                    <div style={{display: 'grid', gap: 8}}>
                      {matchedLibraryItems.map((item) => (
                        <div
                          key={`match-${item.id}`}
                          style={{
                            padding: '10px 12px',
                            borderRadius: 14,
                            border: '1px solid rgba(148,163,184,.14)',
                            background: 'rgba(15,23,42,.42)',
                            display: 'grid',
                            gap: 4,
                          }}
                        >
                          <div style={{fontSize: 12, fontWeight: 700, color: '#E2E8F0'}}>{item.title}</div>
                          <div style={{fontSize: 11, color: '#94A3B8', lineHeight: 1.5}}>{formatLibraryItemMeta(item)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                {references.length || attachments.length ? (
                  <div style={{display: 'flex', gap: 8, flexWrap: 'wrap'}}>
                    {references.map((item) => (
                      <span key={item.id} style={{padding: '6px 9px', borderRadius: 999, background: 'rgba(56,189,248,.12)', border: '1px solid rgba(56,189,248,.18)', color: '#BAE6FD', fontSize: 11, fontWeight: 700}}>
                        Ref · {item.label}
                      </span>
                    ))}
                    {attachments.map((item) => (
                      <span key={item.id} style={{padding: '6px 9px', borderRadius: 999, background: 'rgba(244,114,182,.12)', border: '1px solid rgba(244,114,182,.18)', color: '#FBCFE8', fontSize: 11, fontWeight: 700}}>
                        File · {item.name}
                      </span>
                    ))}
                  </div>
                ) : null}

                {showLibrary && referenceLibrary.length ? (
                  <div style={{display: 'grid', gap: 8}}>
                    <div style={{fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.12em', color: '#475569'}}>Reference library</div>
                    <div style={{display: 'grid', gap: 8, maxHeight: 320, overflow: 'auto', paddingRight: 4}}>
                      {referenceLibrary.map((item) => (
                        <div
                          key={`library-${item.id}`}
                          style={{
                            padding: '10px 12px',
                            borderRadius: 14,
                            border: '1px solid rgba(255,255,255,.06)',
                            background: 'rgba(255,255,255,.03)',
                            display: 'grid',
                            gap: 6,
                          }}
                        >
                          <div style={{display: 'flex', alignItems: 'start', justifyContent: 'space-between', gap: 10}}>
                            <div style={{display: 'grid', gap: 4}}>
                              <div style={{fontSize: 12, fontWeight: 700, color: '#E2E8F0'}}>{item.title}</div>
                              <div style={{fontSize: 11, color: '#94A3B8', lineHeight: 1.45}}>{formatLibraryItemMeta(item)}</div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveLibraryItem(item.id)}
                              style={{
                                padding: '5px 8px',
                                borderRadius: 999,
                                border: '1px solid rgba(248,113,113,.16)',
                                background: 'rgba(127,29,29,.18)',
                                color: '#FCA5A5',
                                fontSize: 10,
                                fontWeight: 700,
                                cursor: 'pointer',
                              }}
                            >
                              Remove
                            </button>
                          </div>
                          {item.url ? (
                            <a href={item.url} target="_blank" rel="noreferrer" style={{fontSize: 11, color: '#93C5FD', textDecoration: 'none'}}>
                              {item.url}
                            </a>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                {showLibrary && !referenceLibrary.length ? (
                  <div style={{fontSize: 12, color: '#64748B', lineHeight: 1.6}}>
                    Save a few references or files and they’ll show up here as reusable taste inputs for future builds.
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}

          {leftRailMode === 'history' ? (
            <div style={{display: 'grid', gap: 14}}>
              <div style={{display: 'grid', gap: 8}}>
                <div style={{fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.12em', color: '#64748B'}}>Version history</div>
                {versions.length ? (
                  <div style={{display: 'grid', gap: 8}}>
                    {versions.map((version) => (
                      <div
                        key={version.id}
                        style={{
                          padding: '12px 14px',
                          borderRadius: 16,
                          border: '1px solid rgba(255,255,255,.06)',
                          background: 'rgba(255,255,255,.03)',
                          display: 'grid',
                          gap: 8,
                        }}
                      >
                        <div style={{display: 'flex', alignItems: 'start', justifyContent: 'space-between', gap: 10}}>
                          <div style={{display: 'grid', gap: 4}}>
                            <div style={{fontSize: 12, fontWeight: 700, color: '#E2E8F0'}}>{version.title}</div>
                            <div style={{fontSize: 11, color: '#64748B', textTransform: 'uppercase', letterSpacing: '.08em'}}>
                              {formatVersionTime(version.createdAt)}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => restoreVersion(version.id)}
                            style={{
                              padding: '7px 10px',
                              borderRadius: 999,
                              border: '1px solid rgba(96,165,250,.18)',
                              background: 'rgba(37,99,235,.12)',
                              color: '#DBEAFE',
                              fontSize: 11,
                              fontWeight: 700,
                              cursor: 'pointer',
                            }}
                          >
                            Restore
                          </button>
                        </div>
                        <div style={{fontSize: 12, color: '#CBD5E1', lineHeight: 1.6}}>
                          {version.description}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{fontSize: 12, color: '#64748B', lineHeight: 1.7}}>
                    Once you build a few directions, they’ll appear here so you can jump back without digging through the chat.
                  </div>
                )}
              </div>

              {conversationMessages.length > 2 ? (
                <div style={{display: 'grid', gap: 8}}>
                  <button
                    onClick={() => setShowFullConversation((current) => !current)}
                    style={{
                      justifySelf: 'start',
                      padding: '8px 10px',
                      borderRadius: 999,
                      border: '1px solid rgba(255,255,255,.08)',
                      background: 'rgba(255,255,255,.03)',
                      color: '#CBD5E1',
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    {showFullConversation ? 'Hide note log' : `Open note log (${conversationMessages.length})`}
                  </button>
                  {showFullConversation ? (
                    <div style={{display: 'grid', gap: 8}}>
                      {visibleConversationMessages.map((message, index) => (
                        <div
                          key={`${message.role}-${index}`}
                          style={{
                            padding: '10px 12px',
                            borderRadius: 14,
                            border: '1px solid rgba(255,255,255,.06)',
                            background: 'rgba(255,255,255,.03)',
                          }}
                        >
                          <div style={{fontSize: 10, textTransform: 'uppercase', letterSpacing: '.08em', color: message.role === 'user' ? '#BFDBFE' : '#64748B', marginBottom: 6}}>
                            {message.role === 'user' ? 'You' : 'Builder'}
                          </div>
                          <div style={{fontSize: 12, color: '#CBD5E1', lineHeight: 1.65, whiteSpace: 'pre-wrap'}}>
                            {formatConversationMessage(message)}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        <div style={{padding: 16, borderTop: '1px solid rgba(255,255,255,.06)', display: 'grid', gap: 10}}>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFilesSelected}
            style={{display: 'none'}}
          />
          {canPatchPreview ? (
            <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '9px 12px', borderRadius: 14, border: '1px solid rgba(192,132,252,.18)', background: 'rgba(76,29,149,.10)'}}>
              <div style={{fontSize: 12, color: '#E9D5FF'}}>
                Editing <strong>{patchTargetLabel}</strong>
              </div>
              <button
                onClick={() => setSelectedPreviewNode(getDefaultPreviewNode(outputMode))}
                style={{padding: '8px 10px', borderRadius: 10, border: '1px solid rgba(255,255,255,.08)', background: 'rgba(255,255,255,.05)', color: '#F5F3FF', fontSize: 11, fontWeight: 700, cursor: 'pointer'}}
              >
                Reset focus
              </button>
            </div>
          ) : null}
          {toolNotice ? (
            <div style={{fontSize: 11, color: '#94A3B8', lineHeight: 1.55}}>
              {toolNotice}
            </div>
          ) : null}
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                submitPrompt();
              }
            }}
            placeholder={promptPlaceholder}
            rows={4}
            style={{width: '100%', resize: 'none', padding: '14px 16px', borderRadius: 16, border: '1px solid rgba(255,255,255,.08)', background: 'rgba(255,255,255,.04)', color: '#F8FAFC', fontSize: 13, lineHeight: 1.6, outline: 'none'}}
          />
          <div style={{display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap'}}>
            <button
              type="button"
              onClick={() => handleToolMenuAction('attach')}
              style={{padding: '9px 12px', borderRadius: 999, border: '1px solid rgba(255,255,255,.10)', background: 'rgba(255,255,255,.04)', color: '#F8FAFC', fontSize: 11, fontWeight: 700, cursor: 'pointer'}}
            >
              Attach file
            </button>
            <button
              type="button"
              onClick={() => handleToolMenuAction('reference')}
              style={{padding: '9px 12px', borderRadius: 999, border: '1px solid rgba(255,255,255,.10)', background: 'rgba(255,255,255,.04)', color: '#F8FAFC', fontSize: 11, fontWeight: 700, cursor: 'pointer'}}
            >
              Add reference
            </button>
            <button
              type="button"
              onClick={() => handleToolMenuAction('history')}
              style={{padding: '9px 12px', borderRadius: 999, border: '1px solid rgba(255,255,255,.10)', background: 'rgba(255,255,255,.04)', color: '#CBD5E1', fontSize: 11, fontWeight: 700, cursor: 'pointer'}}
            >
              History
            </button>
          </div>
          <div style={{display: 'flex', gap: 10, alignItems: 'center'}}>
            <button
              onClick={submitPrompt}
              disabled={!cleanText(input) || loading}
              style={{flex: 1, padding: '11px 14px', borderRadius: 12, border: 'none', background: !cleanText(input) || loading ? '#334155' : '#2563EB', color: '#F8FAFC', fontSize: 12, fontWeight: 700, cursor: !cleanText(input) || loading ? 'default' : 'pointer'}}
            >
              {loading
                ? phase === 'patching'
                  ? 'Patching…'
                  : 'Building…'
                : promptActionLabel}
            </button>
          </div>
        </div>
      </aside>

      <section style={{flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', background: 'radial-gradient(circle at top left, rgba(37,99,235,.18), transparent 28%), radial-gradient(circle at bottom right, rgba(217,70,239,.14), transparent 26%), #09090B'}}>
        <header style={{padding: isMobile ? '16px' : '18px 24px', borderBottom: '1px solid rgba(255,255,255,.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap'}}>
          <div style={{display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap'}}>
            <button
              onClick={() => setActiveView('preview')}
              style={{padding: '9px 14px', borderRadius: 999, border: resolvedActiveView === 'preview' ? '1px solid rgba(96,165,250,.35)' : '1px solid rgba(255,255,255,.08)', background: resolvedActiveView === 'preview' ? 'rgba(37,99,235,.18)' : 'rgba(255,255,255,.03)', color: normalizedPreview || !plan ? '#F8FAFC' : '#94A3B8', fontSize: 12, fontWeight: 700, cursor: 'pointer'}}
            >
              Preview
            </button>
            {plan && !planNeedsApproval ? (
              <button
                onClick={() => setActiveView('plan')}
                style={{padding: '9px 14px', borderRadius: 999, border: resolvedActiveView === 'plan' ? '1px solid rgba(96,165,250,.35)' : '1px solid rgba(255,255,255,.08)', background: resolvedActiveView === 'plan' ? 'rgba(37,99,235,.18)' : 'rgba(255,255,255,.03)', color: '#F8FAFC', fontSize: 12, fontWeight: 700, cursor: 'pointer'}}
              >
                {planNeedsApproval ? 'Review plan' : 'Plan details'}
              </button>
            ) : null}
          </div>

          <div style={{display: 'flex', alignItems: 'center', gap: 10}}>
            {normalizedPreview ? (
              <button
                onClick={() => setShowInspectorPanel((current) => !current)}
                style={{padding: '10px 14px', borderRadius: 12, border: '1px solid rgba(255,255,255,.08)', background: showInspectorPanel ? 'rgba(37,99,235,.18)' : 'rgba(255,255,255,.03)', color: '#F8FAFC', fontSize: 12, fontWeight: 700, cursor: 'pointer'}}
              >
                {showInspectorPanel ? 'Hide inspector' : 'Show inspector'}
              </button>
            ) : null}
            {primaryHeaderAction === 'save' ? (
              <button
                onClick={() => setShowDeployPanel((current) => !current)}
                disabled={!extractedJSON}
                style={{padding: '10px 14px', borderRadius: 12, border: 'none', background: !extractedJSON ? '#334155' : showDeployPanel ? '#0F766E' : '#10B981', color: '#F8FAFC', fontSize: 12, fontWeight: 700, cursor: !extractedJSON ? 'default' : 'pointer'}}
              >
                {showDeployPanel ? 'Close publish' : 'Publish'}
              </button>
            ) : null}
          </div>
        </header>

        <div style={{flex: 1, minHeight: 0, display: 'flex', flexDirection: isTablet ? 'column' : 'row'}}>
          <div style={{flex: 1, minWidth: 0, padding: isMobile ? 16 : 24, overflow: 'auto'}}>
            {resolvedActiveView === 'plan' ? (
              plan ? (
                <PlanConceptStage
                  plan={plan}
                  styleMode={styleMode}
                  outputMode={outputMode}
                  client={selectedClientRecord}
                  planNeedsApproval={planNeedsApproval}
                  onApprove={approveAndBuild}
                  onShowPrompt={() => setActiveView('preview')}
                />
              ) : (
                <div style={{maxWidth: 980, margin: '0 auto', minHeight: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                  <div style={{padding: 48, textAlign: 'center', color: '#94A3B8', fontSize: 14, lineHeight: 1.7}}>
                    The plan will appear here after you submit a prompt.
                  </div>
                </div>
              )
            ) : (
              <div ref={previewCaptureRef} style={{maxWidth: showInspector ? 1320 : 1480, margin: '0 auto', minHeight: '100%', display: 'grid', gap: 20, transition: 'max-width .22s ease'}}>
                {normalizedPreview ? (
                  <PreviewErrorBoundary resetKey={previewBoundaryKey}>
                    <BuilderLivePreview
                      outputMode={outputMode}
                      preview={normalizedPreview}
                      plan={plan}
                      styleMode={styleMode}
                      client={selectedClientRecord}
                      attachments={attachments}
                      selectedNodeId={selectedPreviewNode}
                      onSelectNode={(nodeId) => {
                        setSelectedPreviewNode(nodeId);
                      }}
                    />
                  </PreviewErrorBoundary>
                ) : (
                <PreviewCanvas
                  plan={plan}
                  previewSummary={previewSummary}
                  outputMode={outputMode}
                  styleMode={styleMode}
                  client={selectedClientRecord}
                  phase={phase}
                  onApprove={approveAndBuild}
                  onEditPlan={() => {
                    setActiveView('preview');
                    setToolNotice('Describe what to change, then click Update plan.');
                  }}
                />
              )}

                {normalizedPreview && showDeployPanel ? (
                  <div style={{borderRadius: 24, border: '1px solid rgba(16,185,129,.22)', background: 'linear-gradient(180deg, rgba(6,78,59,.48), rgba(15,23,42,.9))', padding: isMobile ? 18 : 24, display: 'grid', gap: 18}}>
                    <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap'}}>
                      <div style={{display: 'grid', gap: 6}}>
                        <div style={{fontSize: 12, fontWeight: 700, color: '#6EE7B7', textTransform: 'uppercase', letterSpacing: '.08em'}}>Portal ready</div>
                        <div style={{fontSize: isMobile ? 24 : 28, fontWeight: 800, color: '#F8FAFC', letterSpacing: '-.03em'}}>Publish to client portal</div>
                        <div style={{fontSize: 13, color: '#CBD5E1', lineHeight: 1.7, maxWidth: 760}}>
                          Approve & Build only creates the preview. Publish sends this version live to the selected client portal with the current slug, template, and access settings.
                        </div>
                      </div>
                      <div style={{fontSize: 12, color: '#A7F3D0', padding: '8px 12px', borderRadius: 999, border: '1px solid rgba(110,231,183,.22)', background: 'rgba(16,185,129,.12)'}}>
                        {selectedPortalRecord ? `Updating ${selectedPortalRecord.slug || 'selected portal'}` : 'Select a target portal'}
                      </div>
                    </div>

                    {publishUrl ? (
                      <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', padding: '12px 14px', borderRadius: 16, border: '1px solid rgba(255,255,255,.08)', background: 'rgba(255,255,255,.03)'}}>
                        <div style={{display: 'grid', gap: 4}}>
                          <div style={{fontSize: 10, fontWeight: 700, color: '#A7F3D0', textTransform: 'uppercase', letterSpacing: '.08em'}}>Live URL</div>
                          <div style={{fontSize: 13, color: '#E2E8F0', lineHeight: 1.5, wordBreak: 'break-all'}}>{publishUrl}</div>
                        </div>
                        <button
                          onClick={() => window.open(publishUrl, '_blank', 'noopener,noreferrer')}
                          style={{padding: '10px 14px', borderRadius: 12, border: '1px solid rgba(255,255,255,.08)', background: 'rgba(255,255,255,.05)', color: '#F8FAFC', fontSize: 12, fontWeight: 700, cursor: 'pointer'}}
                        >
                          Open live portal
                        </button>
                      </div>
                    ) : null}

                    <div style={{display: 'grid', gridTemplateColumns: isTablet ? '1fr' : 'repeat(2, minmax(0, 1fr))', gap: 14}}>
                      <label style={{display: 'grid', gap: 6}}>
                        <span style={{fontSize: 11, fontWeight: 700, color: '#A7F3D0', textTransform: 'uppercase', letterSpacing: '.08em'}}>URL slug</span>
                        <input
                          value={deploySlug}
                          onChange={(e) => setDeploySlug(slugifyValue(e.target.value))}
                          placeholder="client-portal"
                          style={{width: '100%', padding: '11px 12px', borderRadius: 12, border: '1px solid rgba(255,255,255,.08)', background: 'rgba(255,255,255,.04)', color: '#F8FAFC', fontSize: 13, outline: 'none'}}
                        />
                      </label>
                      <label style={{display: 'grid', gap: 6}}>
                        <span style={{fontSize: 11, fontWeight: 700, color: '#A7F3D0', textTransform: 'uppercase', letterSpacing: '.08em'}}>Template</span>
                        <select
                          value={deployTemplateId}
                          onChange={(e) => setDeployTemplateId(e.target.value)}
                          style={{width: '100%', padding: '11px 12px', borderRadius: 12, border: '1px solid rgba(255,255,255,.08)', background: 'rgba(255,255,255,.04)', color: '#F8FAFC', fontSize: 13, outline: 'none'}}
                        >
                          {TEMPLATE_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value} style={{color: '#111827'}}>{option.label}</option>
                          ))}
                        </select>
                      </label>
                      <label style={{display: 'grid', gap: 6}}>
                        <span style={{fontSize: 11, fontWeight: 700, color: '#A7F3D0', textTransform: 'uppercase', letterSpacing: '.08em'}}>Status</span>
                        <select
                          value={deployStatus}
                          onChange={(e) => setDeployStatus(e.target.value)}
                          style={{width: '100%', padding: '11px 12px', borderRadius: 12, border: '1px solid rgba(255,255,255,.08)', background: 'rgba(255,255,255,.04)', color: '#F8FAFC', fontSize: 13, outline: 'none'}}
                        >
                          <option value="draft" style={{color: '#111827'}}>Draft</option>
                          <option value="active" style={{color: '#111827'}}>Active</option>
                          <option value="archived" style={{color: '#111827'}}>Archived</option>
                        </select>
                      </label>
                      <label style={{display: 'grid', gap: 6}}>
                        <span style={{fontSize: 11, fontWeight: 700, color: '#A7F3D0', textTransform: 'uppercase', letterSpacing: '.08em'}}>Password</span>
                        <input
                          value={deployPassword}
                          onChange={(e) => setDeployPassword(e.target.value)}
                          placeholder={selectedPortalRecord?.plain_password ? 'Leave blank to keep current password' : 'Optional password'}
                          style={{width: '100%', padding: '11px 12px', borderRadius: 12, border: '1px solid rgba(255,255,255,.08)', background: 'rgba(255,255,255,.04)', color: '#F8FAFC', fontSize: 13, outline: 'none'}}
                        />
                      </label>
                    </div>

                    <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap'}}>
                      <label style={{display: 'inline-flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#CBD5E1'}}>
                        <input
                          type="checkbox"
                          checked={deployNotifyClient}
                          onChange={(e) => setDeployNotifyClient(e.target.checked)}
                        />
                        Send a client handoff email draft after publish
                      </label>
                      <div style={{display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap'}}>
                        <button
                          onClick={() => {
                            const nextSlug = publishSlug;
                            if (!nextSlug) return;
                            navigator.clipboard.writeText(`${PORTAL_URL}/${nextSlug}`);
                            setSaveMsg('Share link copied.');
                          }}
                          disabled={!publishSlug}
                          style={{padding: '10px 14px', borderRadius: 12, border: '1px solid rgba(255,255,255,.08)', background: 'rgba(255,255,255,.04)', color: '#F8FAFC', fontSize: 12, fontWeight: 700, cursor: !publishSlug ? 'default' : 'pointer'}}
                        >
                          Copy share link
                        </button>
                        <button
                          onClick={() => window.open(publishUrl, '_blank', 'noopener,noreferrer')}
                          disabled={!publishUrl}
                          style={{padding: '10px 14px', borderRadius: 12, border: '1px solid rgba(255,255,255,.08)', background: 'rgba(255,255,255,.04)', color: '#F8FAFC', fontSize: 12, fontWeight: 700, cursor: !publishUrl ? 'default' : 'pointer'}}
                        >
                          Open live portal
                        </button>
                        <button
                          onClick={saveToPortal}
                          disabled={!selectedPortal || !extractedJSON || saving || !deploySlug}
                          style={{padding: '11px 16px', borderRadius: 12, border: 'none', background: !selectedPortal || !extractedJSON || saving || !deploySlug ? '#334155' : '#10B981', color: '#F8FAFC', fontSize: 12, fontWeight: 800, cursor: !selectedPortal || !extractedJSON || saving || !deploySlug ? 'default' : 'pointer'}}
                        >
                          {saving ? 'Publishing…' : 'Publish to client portal'}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : null}

                {(showStructuredOutput || saveMsg) ? (
                  <div style={{borderRadius: 24, border: '1px solid rgba(255,255,255,.08)', background: 'rgba(15,23,42,.72)', padding: 20}}>
                    <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12}}>
                      <div style={{fontSize: 13, fontWeight: 700, color: '#F8FAFC'}}>Structured output</div>
                      <div style={{display: 'flex', alignItems: 'center', gap: 10}}>
                        {saveMsg ? <div style={{fontSize: 12, color: saveMsg.startsWith('Publish failed') ? '#FCA5A5' : '#86EFAC'}}>{saveMsg}</div> : null}
                        {lastPublishedUrl ? (
                          <button
                            onClick={() => window.open(lastPublishedUrl, '_blank', 'noopener,noreferrer')}
                            style={{padding: '8px 10px', borderRadius: 10, border: '1px solid rgba(255,255,255,.08)', background: 'rgba(255,255,255,.04)', color: '#F8FAFC', fontSize: 11, fontWeight: 700, cursor: 'pointer'}}
                          >
                            Open live portal
                          </button>
                        ) : null}
                        <button
                          onClick={() => setShowStructuredOutput(false)}
                          style={{padding: '8px 10px', borderRadius: 10, border: '1px solid rgba(255,255,255,.08)', background: 'rgba(255,255,255,.04)', color: '#F8FAFC', fontSize: 11, fontWeight: 700, cursor: 'pointer'}}
                        >
                          Hide JSON
                        </button>
                      </div>
                    </div>
                    <pre style={{margin: 0, maxHeight: 360, overflow: 'auto', fontSize: 11, lineHeight: 1.55, color: '#CBD5E1', whiteSpace: 'pre-wrap'}}>
                      {normalizedPreview
                        ? JSON.stringify(normalizedPreview, null, 2)
                        : 'No structured JSON yet. Approve a plan to generate output.'}
                    </pre>
                  </div>
                ) : normalizedPreview ? (
                  <div style={{display: 'flex', justifyContent: 'center'}}>
                    <button
                      onClick={() => setShowStructuredOutput(true)}
                      style={{padding: '10px 14px', borderRadius: 999, border: '1px solid rgba(255,255,255,.08)', background: 'rgba(255,255,255,.03)', color: '#CBD5E1', fontSize: 12, fontWeight: 700, cursor: 'pointer'}}
                    >
                      Show structured output
                    </button>
                  </div>
                ) : null}
              </div>
            )}
          </div>

          {showInspector ? (
            <InspectorDrawer
              activeView={activeView}
              inspector={inspector}
              outputMode={outputMode}
              phase={phase}
              compact={isTablet}
              onEditField={handleInspectorFieldChange}
              onSwapAsset={handleAssetSwap}
            />
          ) : null}
        </div>
      </section>
    </div>
  );
}
