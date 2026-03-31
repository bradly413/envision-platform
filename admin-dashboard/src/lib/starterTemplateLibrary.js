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
    id: 'one-page-pro-creative',
    title: 'One Page Pro creative',
    summary: 'A polished multi-purpose one-page starter with strong parallax, gallery, and hero-treatment flexibility across creative and corporate variants.',
    vibe: 'One-page pro',
    bestFor: 'Agency landers, polished one-page portals, creative/corporate hybrid builds',
    outputModes: ['portal', 'presentation'],
    styleModes: ['cinematic', 'bold', 'minimal'],
    structure: ['Hero intro', 'Capabilities', 'Portfolio', 'Proof', 'Team or about', 'Contact'],
    motion: ['Parallax hero', 'Video-backed sections', 'Gallery reveals', '3D accents'],
    tags: ['one-page', 'parallax', 'creative', 'corporate', 'motion'],
    keywords: ['one page pro', 'onepage html', 'creative package', 'corporate package'],
    sourceLabel: 'one-page-pro-multi-purpose-onepage-html-template',
  },
  {
    id: 'reone-parallax-system',
    title: 'ReOne parallax system',
    summary: 'A broad one-page parallax reference with many photography, portfolio, and multi-page variants that suggest stronger media-led pacing.',
    vibe: 'Parallax portfolio',
    bestFor: 'Creative showcases, photography-heavy portals, media-led campaign stories',
    outputModes: ['portal', 'presentation'],
    styleModes: ['cinematic', 'editorial', 'bold'],
    structure: ['Media hero', 'Portfolio or gallery', 'Story sections', 'Proof', 'CTA'],
    motion: ['Swiper moments', 'Parallax scroll', 'Video-backed sections', 'Gallery sequencing'],
    tags: ['parallax', 'portfolio', 'gallery', 'media', 'motion'],
    keywords: ['reone', 'photography', 'multi page', 'portfolio', 'swiper'],
    sourceLabel: 'reone-one-page-parallax',
  },
  {
    id: 'rocket-creative-system',
    title: 'Rocket creative system',
    summary: 'A creative multipurpose system with strong grid elements, image sections, and dramatic section rhythm for broader concept exploration.',
    vibe: 'Creative multipurpose',
    bestFor: 'Agency sites, campaign structures, modular section systems, content-rich portals',
    outputModes: ['portal', 'presentation'],
    styleModes: ['bold', 'editorial', 'cinematic'],
    structure: ['Statement hero', 'Grid modules', 'Image-led sections', 'Proof', 'CTA'],
    motion: ['Parallax depth', 'Scroll reveals', 'Gallery rhythm', '3D hero treatment'],
    tags: ['creative', 'system', 'grid', 'campaign', 'motion'],
    keywords: ['rocket', 'creative multipurpose', 'grid', 'elements', 'gallery'],
    sourceLabel: 'Rocket-HTML-Package',
  },
  {
    id: 'rano-landing-system',
    title: 'Rano landing system',
    summary: 'A cleaner landing-page reference with app-style sections, softer parallax, and conversion-minded landing flow.',
    vibe: 'Landing page',
    bestFor: 'SaaS-style portals, launches, product/service lead-gen stories',
    outputModes: ['portal'],
    styleModes: ['minimal', 'bold', 'cinematic'],
    structure: ['Lead hero', 'Features', 'Benefits', 'Gallery or proof', 'CTA'],
    motion: ['Parallax accents', 'Video support', 'Landing-page pacing'],
    tags: ['landing-page', 'conversion', 'parallax', 'portal'],
    keywords: ['rano', 'landing page', 'template', 'index-v2'],
    sourceLabel: 'rano-package',
  },
  {
    id: 'bigstream-parallax-theme',
    title: 'BigStream parallax theme',
    summary: 'A broad one-page parallax theme with many index variants, slider moments, and media-forward sections for louder portal concepts.',
    vibe: 'High-variation parallax',
    bestFor: 'Campaign portals, media-heavy one-pagers, bold landing experiences, showcase sites',
    outputModes: ['portal', 'presentation'],
    styleModes: ['bold', 'cinematic', 'editorial'],
    structure: ['Hero slider', 'Story sections', 'Portfolio or gallery', 'Media modules', 'CTA'],
    motion: ['Parallax scroll', 'Slider transitions', 'Video support', '3D depth accents'],
    tags: ['parallax', 'slider', 'media', 'campaign', 'motion'],
    keywords: ['bigstream', 'one page parallax theme', 'index-15', 'index-23'],
    sourceLabel: 'bigstream-one-page-multi-purpose-template',
  },
  {
    id: 'goarch-architecture-landing',
    title: 'Go.arch architecture landing',
    summary: 'An architecture and real-estate landing reference with cinematic structure, gallery-led sections, and stronger premium spatial pacing.',
    vibe: 'Architectural premium',
    bestFor: 'Real estate, architecture, hospitality, premium property or place-driven portals',
    outputModes: ['portal', 'presentation'],
    styleModes: ['luxury', 'minimal', 'cinematic'],
    structure: ['Immersive hero', 'Project or place story', 'Gallery', 'Spatial detail', 'CTA'],
    motion: ['Parallax depth', 'Slider pacing', 'Video-backed scenes', 'Gallery transitions'],
    tags: ['architecture', 'real-estate', 'luxury', 'gallery', 'motion'],
    keywords: ['go.arch', 'architecture', 'real estate landing page', 'interiors'],
    sourceLabel: 'dist',
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
    id: 'denzel-personal-onepage',
    title: 'Denzel personal onepage',
    summary: 'A lighter one-page personal template with a cleaner portfolio rhythm that can help simplify founder, consultant, or personal-brand portals.',
    vibe: 'Personal portfolio',
    bestFor: 'Founder brands, consultants, speakers, personal portfolio-style portals',
    outputModes: ['portal', 'presentation'],
    styleModes: ['minimal', 'editorial'],
    structure: ['Personal hero', 'About', 'Portfolio or proof', 'Contact'],
    motion: ['Scroll reveals', 'Portfolio pacing', 'One-page flow'],
    tags: ['personal-brand', 'portfolio', 'one-page', 'minimal'],
    keywords: ['denzel', 'onepage personal template', 'personal'],
    sourceLabel: 'dist 2',
  },
  {
    id: 'brom-creative-page',
    title: 'Brom creative page',
    summary: 'A creative page system with swiper-driven sections, image-heavy portfolio modules, and more experimental one-page scene composition.',
    vibe: 'Experimental creative',
    bestFor: 'Studios, photographers, art-directed campaign pages, creative showcases',
    outputModes: ['portal', 'presentation'],
    styleModes: ['editorial', 'cinematic', 'bold'],
    structure: ['Creative hero', 'Swiper modules', 'Portfolio gallery', 'Story sections', 'Closing'],
    motion: ['Swiper transitions', 'Video-backed sections', '3D accents', 'Gallery pacing'],
    tags: ['creative', 'swiper', 'portfolio', 'gallery', 'motion'],
    keywords: ['brom', 'ckav', 'html creative page', 'one page'],
    sourceLabel: 'main',
  },
  {
    id: 'skill-modern-creative',
    title: 'Skill modern creative',
    summary: 'A modern creative template family with strong dark one-page variants, architecture-inspired compositions, and cleaner portfolio pacing.',
    vibe: 'Modern creative',
    bestFor: 'Studios, architecture, creative firms, portfolio-led brand stories',
    outputModes: ['portal', 'presentation'],
    styleModes: ['editorial', 'minimal', 'cinematic'],
    structure: ['Dark hero', 'Portfolio or featured work', 'Capabilities', 'Story blocks', 'Contact'],
    motion: ['Scroll-led reveals', 'Video support', 'Portfolio sequencing'],
    tags: ['creative', 'portfolio', 'dark', 'editorial', 'motion'],
    keywords: ['skill template', 'one page dark', 'architecture', 'modern creative'],
    sourceLabel: 'Skill v1_21',
  },
  {
    id: 'spyder-onepage-parallax',
    title: 'Spyder one-page parallax',
    summary: 'A direct one-page parallax template with strong gallery and media sections that can push portals toward richer motion and image-led rhythm.',
    vibe: 'One-page parallax',
    bestFor: 'Media-heavy one-pagers, photographers, creative campaigns, parallax landing pages',
    outputModes: ['portal', 'presentation'],
    styleModes: ['cinematic', 'bold', 'editorial'],
    structure: ['Hero section', 'Portfolio or gallery', 'Services', 'Story blocks', 'Contact'],
    motion: ['Parallax scroll', 'Video support', '3D accents', 'Gallery reveals'],
    tags: ['parallax', 'one-page', 'portfolio', 'gallery', 'motion'],
    keywords: ['spyder', 'one page parallax', 'html5 template', 'gallery'],
    sourceLabel: 'Spyder_Onepage_HTML5_Template',
  },
  {
    id: 'whizz-split-slider',
    title: 'Whizz split slider',
    summary: 'A high-variation creative system with split sliders, landing pages, and editorial/media treatments suited to more expressive portals.',
    vibe: 'Expressive creative',
    bestFor: 'Creative campaigns, split-slider stories, media portfolios, bolder pitch surfaces',
    outputModes: ['portal', 'presentation'],
    styleModes: ['cinematic', 'editorial', 'bold'],
    structure: ['Split hero', 'Landing sequence', 'Media showcase', 'Portfolio or gallery', 'Closing'],
    motion: ['Swiper transitions', 'Parallax scroll', 'Video-backed scenes', 'Gallery pacing'],
    tags: ['slider', 'creative', 'media', 'portfolio', 'motion'],
    keywords: ['whizz', 'split slider', 'home landing split', 'creative'],
    sourceLabel: 'Whizz_html_tf_v1.0.2',
  },
  {
    id: 'woody-coming-soon-effects',
    title: 'Woody coming soon effects',
    summary: 'A narrower effect-driven reference with countdown and under-construction atmospheres that can inspire holding pages and launch states.',
    vibe: 'Launch placeholder',
    bestFor: 'Coming-soon portals, launch placeholders, teaser microsites',
    outputModes: ['portal'],
    styleModes: ['minimal', 'cinematic', 'bold'],
    structure: ['Launch title', 'Countdown or teaser', 'Background effect', 'Signup or CTA'],
    motion: ['Video backgrounds', 'Teaser pacing', 'Holding-page atmospherics'],
    tags: ['coming-soon', 'teaser', 'launch', 'video'],
    keywords: ['woody', 'under construction', 'coming soon', 'pipeline', 'heuristics'],
    sourceLabel: 'Woody - Coming Soon & Under Construction Hugo Theme',
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
