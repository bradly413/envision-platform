function cleanText(value = '') {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function tokenize(value = '') {
  return cleanText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

function uniq(values = []) {
  return [...new Set(values.filter(Boolean))];
}

export const STARTER_TEMPLATE_LIBRARY = [
  {
    id: 'curv-parallax-onepage',
    title: 'CURV one-page parallax',
    summary: 'A direct one-page parallax starter with stacked service sections, team blocks, pricing, blog, and contact rhythm.',
    vibe: 'Parallax multipurpose',
    bestFor: 'Microsites, campaign landers, product stories, portal moodboards',
    outputModes: ['portal'],
    styleModes: ['cinematic', 'bold', 'editorial'],
    structure: ['Parallax hero', 'About', 'Team', 'Services', 'Work', 'Pricing', 'Blog', 'Contact'],
    motion: ['Layered parallax', 'One-page scroll progression', 'Hero depth', 'Section snap rhythm'],
    tags: ['parallax', 'portal', 'one-page', 'campaign', 'motion'],
    keywords: ['curv', 'one page', 'parallax', 'multipurpose', 'microsite'],
    sourceLabel: 'one-page-multipurpose-parallax-template',
  },
  {
    id: 'cinematic-logo-reveal',
    title: 'Cinematic logo reveal',
    summary: 'A dark, scene-led identity presentation with an opening title, wordmark reveal, logo evolution, and closing lockup.',
    vibe: 'Cinematic',
    bestFor: 'Brand identity presentations, rebrands, logo systems',
    outputModes: ['portal', 'presentation'],
    styleModes: ['cinematic', 'editorial', 'luxury'],
    structure: ['Opening title', 'Wordmark reveal', 'Brand context', 'Logo evolution', 'Logo system', 'Closing'],
    motion: ['Parallax layers', 'Title transitions', 'Ambient glow', 'Scroll depth'],
    tags: ['brand-identity', 'logo', 'wordmark', 'presentation', 'portal', 'cinematic'],
    keywords: ['logo reveal', 'brand identity', 'rebrand', 'wordmark', 'logo system'],
  },
  {
    id: 'editorial-brand-story',
    title: 'Editorial brand story',
    summary: 'Poster-like layouts, disciplined whitespace, and typography-led pacing for a more art-directed story.',
    vibe: 'Editorial',
    bestFor: 'Creative studios, personal brands, fashion, design narratives',
    outputModes: ['portal', 'presentation'],
    styleModes: ['editorial', 'minimal', 'cinematic'],
    structure: ['Poster hero', 'Manifesto', 'Brand context', 'Typography', 'Applications', 'Closing'],
    motion: ['Slow fades', 'Headline sequencing', 'Pinned text moments'],
    tags: ['editorial', 'brand-identity', 'typography', 'presentation', 'portal'],
    keywords: ['editorial', 'poster', 'manifesto', 'typography', 'art direction'],
  },
  {
    id: 'nicex-creative-portfolio',
    title: 'Nicex creative portfolio',
    summary: 'An immersive portfolio reference with asymmetrical grid energy, featured-image storytelling, and multimedia presentation cues.',
    vibe: 'Creative portfolio',
    bestFor: 'Studios, designers, creators, portfolio-driven presentations',
    outputModes: ['portal', 'presentation'],
    styleModes: ['editorial', 'cinematic', 'minimal'],
    structure: ['Feature hero', 'Selected work', 'Asymmetrical gallery', 'Story blocks', 'Contact'],
    motion: ['Image-led transitions', 'Portfolio reveals', 'Editorial pacing'],
    tags: ['portfolio', 'editorial', 'creative', 'presentation', 'portal'],
    keywords: ['nicex', 'portfolio', 'creative portfolio', 'featured image', 'asymmetrical grid'],
    sourceLabel: 'nicex-creative-portfolio-theme',
  },
  {
    id: 'minimal-modern-case-study',
    title: 'Minimal modern case study',
    summary: 'Quiet typography, cleaner grids, and restrained motion for a composed one-page presentation.',
    vibe: 'Minimal modern',
    bestFor: 'Consultancies, agencies, B2B brands, case studies',
    outputModes: ['portal', 'presentation'],
    styleModes: ['minimal', 'editorial'],
    structure: ['Hero statement', 'Context', 'Core idea', 'System', 'Applications', 'Recommendation'],
    motion: ['Restrained scroll depth', 'Soft section handoffs', 'Type-first reveals'],
    tags: ['minimal', 'case-study', 'portal', 'presentation', 'systems'],
    keywords: ['minimal modern', 'case study', 'consulting', 'clean', 'grid'],
  },
  {
    id: 'bold-campaign-takeover',
    title: 'Bold campaign takeover',
    summary: 'A louder launch format with oversized headlines, rhythmic sections, and bolder motion cues.',
    vibe: 'Bold campaign',
    bestFor: 'Campaign launches, activations, product drops, announcements',
    outputModes: ['portal', 'presentation'],
    styleModes: ['bold', 'cinematic'],
    structure: ['Launch hero', 'Audience context', 'Campaign hook', 'Channel rollout', 'Proof', 'CTA'],
    motion: ['Staggered reveals', 'Scroll-triggered transitions', '3D card motion'],
    tags: ['campaign', 'launch', 'presentation', 'portal', 'motion'],
    keywords: ['campaign', 'launch', 'activation', 'rollout', 'announcement'],
  },
  {
    id: 'challenge-premium-theme',
    title: 'Challenge premium system',
    summary: 'A broad premium theme reference with sliders, swipe-ready sections, and flexible multi-section storytelling.',
    vibe: 'Premium multi-section',
    bestFor: 'Broader marketing sites, capability decks, flexible section systems',
    outputModes: ['portal', 'presentation'],
    styleModes: ['bold', 'minimal', 'cinematic'],
    structure: ['Hero slider', 'Capability sections', 'Grid content', 'Portfolio', 'Proof', 'CTA'],
    motion: ['Slider transitions', 'Section inheritance', 'Flexible multi-block pacing'],
    tags: ['system', 'multi-section', 'campaign', 'portal', 'presentation'],
    keywords: ['challenge', 'premium wordpress', 'slider', 'page builder', 'portfolio'],
    sourceLabel: 'Challenge_v1.5.0',
  },
  {
    id: 'fort-premium-theme',
    title: 'Fort premium system',
    summary: 'A flexible premium theme starter suited to structured brand sites, capability pages, and portfolio-style flows.',
    vibe: 'Structured premium',
    bestFor: 'Consulting sites, service brands, polished case-study portals',
    outputModes: ['portal', 'presentation'],
    styleModes: ['minimal', 'editorial', 'cinematic'],
    structure: ['Statement hero', 'Service grid', 'Portfolio', 'Proof', 'Contact'],
    motion: ['Clean slider moments', 'Steady section pacing', 'Subtle reveal rhythm'],
    tags: ['system', 'portfolio', 'services', 'portal', 'presentation'],
    keywords: ['fort', 'premium wordpress', 'services', 'portfolio', 'capabilities'],
    sourceLabel: 'Fort_v1.3.0',
  },
  {
    id: 'luxury-showcase',
    title: 'Luxury showcase',
    summary: 'Premium framing, slower movement, and material-rich surfaces for hospitality, real estate, or high-end goods.',
    vibe: 'Luxury',
    bestFor: 'Luxury brands, hospitality, real estate, premium services',
    outputModes: ['portal', 'presentation'],
    styleModes: ['luxury', 'cinematic', 'editorial'],
    structure: ['Immersive hero', 'Positioning', 'Brand world', 'Applications', 'Signature details', 'Closing'],
    motion: ['Layered parallax', 'Soft zooms', 'Cinematic fade transitions'],
    tags: ['luxury', 'premium', 'portal', 'presentation', 'parallax'],
    keywords: ['luxury', 'premium', 'hospitality', 'real estate', 'showcase'],
  },
  {
    id: 'uniiq-creative-portfolio',
    title: 'Uniiq creative portfolio',
    summary: 'A portfolio-led creative template with multiple header systems and modular content blocks for showcase-heavy builds.',
    vibe: 'Creative portfolio',
    bestFor: 'Creative firms, designers, studio case studies, modular portfolios',
    outputModes: ['portal', 'presentation'],
    styleModes: ['editorial', 'minimal', 'cinematic'],
    structure: ['Header system', 'Portfolio showcase', 'Narrative modules', 'Contact'],
    motion: ['Gallery pacing', 'Header variations', 'Creative content reveals'],
    tags: ['portfolio', 'creative', 'modular', 'presentation', 'portal'],
    keywords: ['uniiq', 'creative portfolio', 'header variations', 'portfolio showcase'],
    sourceLabel: 'mainfiles / uniiq',
  },
  {
    id: 'institutional-trust-system',
    title: 'Institutional trust system',
    summary: 'A credibility-first identity flow with stronger hierarchy, seal or logo-system logic, and proof-oriented structure.',
    vibe: 'Institutional',
    bestFor: 'Schools, nonprofits, civic brands, healthcare, institutional systems',
    outputModes: ['portal', 'presentation'],
    styleModes: ['minimal', 'editorial', 'cinematic'],
    structure: ['Opening statement', 'Institutional context', 'Trust problem', 'Identity system', 'Applications', 'Recommendation'],
    motion: ['Measured transitions', 'Structured sequencing', 'Less decorative motion'],
    tags: ['institutional', 'trust', 'brand-identity', 'presentation', 'portal'],
    keywords: ['school', 'academy', 'college', 'institutional', 'trust', 'credibility'],
  },
  {
    id: 'product-story-scroll',
    title: 'Product story scroll',
    summary: 'A narrative microsite template with modular chapters, horizontal moments, and product detail reveals.',
    vibe: 'Product storytelling',
    bestFor: 'Product launches, feature explainers, industrial and physical products',
    outputModes: ['portal'],
    styleModes: ['bold', 'cinematic', 'editorial'],
    structure: ['Immersive hero', 'Problem', 'Feature chapters', 'Detail moments', 'Proof', 'CTA'],
    motion: ['Pinned chapters', 'Horizontal scroll panels', 'Layered feature reveals'],
    tags: ['product-storytelling', 'portal', 'motion', 'gsap'],
    keywords: ['product story', 'feature', 'chapter', 'detail', 'horizontal'],
  },
  {
    id: 'deck-keynote-dark',
    title: 'Dark keynote deck',
    summary: 'A presentation-first template with dramatic title slides, modular content scenes, and cleaner transitions.',
    vibe: 'Presentation keynote',
    bestFor: 'Pitch decks, internal presentations, conference decks, keynote reveals',
    outputModes: ['presentation'],
    styleModes: ['cinematic', 'minimal', 'editorial'],
    structure: ['Opening slide', 'Context', 'Core narrative', 'System slides', 'Applications', 'Closing'],
    motion: ['Title transitions', 'Slide-safe atmospherics', 'Sequenced reveals'],
    tags: ['presentation', 'deck', 'slides', 'cinematic'],
    keywords: ['deck', 'slides', 'keynote', 'presentation', 'conference'],
  },
];

function scoreTemplate(template, {prompt = '', client = null, styleMode = '', outputMode = 'portal'}) {
  const promptText = cleanText(`${prompt} ${client?.name || ''} ${client?.company || ''}`).toLowerCase();
  const promptTokens = new Set(tokenize(promptText));
  let score = 0;

  if (template.outputModes.includes(outputMode)) score += 18;
  if (template.styleModes.includes(styleMode)) score += 14;

  template.tags.forEach((tag) => {
    if (promptText.includes(tag.replace(/-/g, ' ')) || promptTokens.has(tag)) score += 5;
  });

  template.keywords.forEach((keyword) => {
    if (promptText.includes(keyword)) score += 7;
  });

  if (template.sourceLabel && promptText.includes(template.sourceLabel.toLowerCase())) score += 18;

  if (/logo|wordmark|rebrand|brand identity/.test(promptText) && template.id === 'cinematic-logo-reveal') score += 22;
  if (/campaign|launch|rollout|activation/.test(promptText) && template.id === 'bold-campaign-takeover') score += 20;
  if (/school|academy|college|institutional|trust/.test(promptText) && template.id === 'institutional-trust-system') score += 20;
  if (/luxury|premium|hospitality|real estate/.test(promptText) && template.id === 'luxury-showcase') score += 20;
  if (/product|feature|industrial|spec/.test(promptText) && template.id === 'product-story-scroll') score += 16;
  if (/parallax|one page|one-page/.test(promptText) && template.id === 'curv-parallax-onepage') score += 22;
  if (/portfolio|creative portfolio|studio/.test(promptText) && ['nicex-creative-portfolio', 'uniiq-creative-portfolio'].includes(template.id)) score += 18;

  return score;
}

export function pickStarterTemplateMatches({prompt = '', client = null, styleMode = '', outputMode = 'portal', limit = 4} = {}) {
  return STARTER_TEMPLATE_LIBRARY
    .map((template) => ({template, score: scoreTemplate(template, {prompt, client, styleMode, outputMode})}))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.template.title.localeCompare(b.template.title))
    .slice(0, limit)
    .map((entry) => entry.template);
}

export function createReferenceFromStarterTemplate(template) {
  if (!template) return null;

  return {
    id: `starter-template-${template.id}`,
    label: template.title,
    value: `${template.title} — ${template.summary}`,
    sourceType: 'system',
    libraryType: 'template',
    tags: uniq(template.tags || []),
    cues: uniq([
      ...(template.structure || []).map((item) => `section: ${item}`),
      ...(template.motion || []).map((item) => `motion: ${item}`),
      template.bestFor ? `best for: ${template.bestFor}` : '',
    ]),
    templateSummary: template.summary,
    templateStructure: template.structure || [],
    templateMotion: template.motion || [],
    templateVibe: template.vibe || '',
    templateBestFor: template.bestFor || '',
    templateSource: template.sourceLabel || '',
  };
}
