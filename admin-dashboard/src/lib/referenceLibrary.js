const STORAGE_KEY = 'envision-creative-reference-library-v1';

function cleanText(value = '') {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function slugify(value = '') {
  return cleanText(value)
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function uniq(values = []) {
  return [...new Set(values.filter(Boolean))];
}

function extractKeywords(value = '') {
  return cleanText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

function inferType({sourceType, text, type = '', url = '', cues = [], keywords = []}) {
  const combined = cleanText([text, url, ...cues, ...keywords].join(' ')).toLowerCase();

  if (/(brief|spec|campaign|guideline|brand guide|pdf|doc|html|launch date|deliverable)/.test(combined)) {
    return 'knowledge';
  }

  if (/(motion|animation|gsap|scrolltrigger|parallax|timeline|transition|dribbble|mp4|webgl|shader|cursor-reactive)/.test(combined)) {
    return 'motion';
  }

  if (/(template|structure|layout|chapter|scene|storyboard|portal|presentation|deck)/.test(combined)) {
    return 'template';
  }

  if (sourceType === 'attachment' && type.startsWith('image/')) return 'reference';
  return 'reference';
}

function inferTags({text, url = '', type = '', cues = [], keywords = []}) {
  const combined = cleanText([text, url, type, ...cues, ...keywords].join(' ')).toLowerCase();
  const tags = [];

  const tagTests = [
    ['luxury', /(luxury|chanel|premium|expensive|material|bronze|gold)/],
    ['editorial', /(editorial|magazine|poster|typography|minimal editorial)/],
    ['cinematic', /(cinematic|atmospheric|noir|immersive)/],
    ['motion', /(motion|animation|transition|timeline|lottie|micro\-interaction|dribbble|mp4)/],
    ['gsap', /(gsap|scrolltrigger|scrub|pinned|sticky story|scrollytelling)/],
    ['webgl', /(webgl|shader|ogl|three|3d|cursor-reactive|dora)/],
    ['parallax', /(parallax|depth|layered|foreground|background)/],
    ['systems', /(system|platform|variant|grid|signal|industrial|product)/],
    ['product-storytelling', /(product|watch|drawer|vionaro|industrial design)/],
    ['brand-identity', /(brand|identity|logo|wordmark|mark|typography|palette)/],
    ['presentation', /(presentation|deck|slides|reveal)/],
    ['portal', /(portal|experience|microsite|website)/],
    ['knowledge', /(brief|spec|guideline|campaign|deliverable|notes)/],
  ];

  tagTests.forEach(([tag, pattern]) => {
    if (pattern.test(combined)) tags.push(tag);
  });

  return uniq([...tags, ...keywords.slice(0, 8)]);
}

function createFingerprint(parts = []) {
  return slugify(parts.filter(Boolean).join('|'));
}

function createLibraryEntryFromReference(reference, client) {
  const label = cleanText(reference?.label || reference?.value || 'Reference');
  const value = cleanText(reference?.value || reference?.label || '');
  const url = /^https?:\/\//.test(value) ? value : '';
  const keywords = extractKeywords(`${label} ${value}`);
  const tags = inferTags({text: `${label} ${value}`, url, keywords});
  return {
    id: reference?.id || `library-ref-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    fingerprint: createFingerprint(['reference', url || value]),
    title: label,
    sourceType: 'reference',
    libraryType: inferType({sourceType: 'reference', text: `${label} ${value}`, url, keywords}),
    url,
    value,
    notes: '',
    tags,
    cues: [],
    keywords,
    previewUrl: '',
    assetType: 'text/reference',
    clientId: client?.id ? String(client.id) : '',
    clientName: client?.name || '',
    createdAt: new Date().toISOString(),
  };
}

function createLibraryEntryFromAttachment(attachment, client) {
  const name = cleanText(attachment?.name || 'Attachment');
  const type = cleanText(attachment?.type || 'file');
  const cues = Array.isArray(attachment?.cues) ? attachment.cues : [];
  const keywords = Array.isArray(attachment?.keywords) ? attachment.keywords : extractKeywords(name);
  const tags = inferTags({text: name, type, cues, keywords});
  return {
    id: attachment?.id || `library-file-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    fingerprint: createFingerprint(['attachment', name, type]),
    title: name,
    sourceType: 'attachment',
    libraryType: inferType({sourceType: 'attachment', text: name, type, cues, keywords}),
    url: '',
    value: name,
    notes: '',
    tags,
    cues,
    keywords,
    previewUrl: attachment?.previewUrl || '',
    assetType: type || 'file',
    clientId: client?.id ? String(client.id) : '',
    clientName: client?.name || '',
    createdAt: new Date().toISOString(),
  };
}

export function loadReferenceLibrary() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveReferenceLibrary(items = []) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Ignore storage failures; library is a convenience layer.
  }
}

export function createLibraryEntries({references = [], attachments = [], client = null}) {
  return [
    ...references.map((item) => createLibraryEntryFromReference(item, client)),
    ...attachments.map((item) => createLibraryEntryFromAttachment(item, client)),
  ];
}

export function mergeLibraryEntries(existing = [], incoming = []) {
  const map = new Map();
  [...existing, ...incoming].forEach((item) => {
    const key = item.fingerprint || item.id;
    const previous = map.get(key);
    map.set(key, previous ? {...previous, ...item, tags: uniq([...(previous.tags || []), ...(item.tags || [])])} : item);
  });
  return Array.from(map.values()).sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
}

export function removeLibraryEntry(existing = [], id) {
  return existing.filter((item) => item.id !== id);
}

export function getRecommendedLibraryItems({items = [], prompt = '', client = null, styleMode = '', outputMode = '', limit = 6}) {
  const promptKeywords = extractKeywords(`${prompt} ${styleMode} ${outputMode}`);
  const styleTag = styleMode === 'bold' ? 'campaign' : styleMode;

  const ranked = items
    .map((item) => {
      let score = 0;
      if (client?.id && item.clientId && String(item.clientId) === String(client.id)) score += 6;
      if (client?.name && item.clientName && item.clientName === client.name) score += 3;
      if (styleTag && (item.tags || []).includes(styleTag)) score += 4;
      if (outputMode === 'presentation' && (item.tags || []).includes('presentation')) score += 3;
      if (outputMode === 'portal' && (item.tags || []).includes('portal')) score += 3;
      promptKeywords.forEach((keyword) => {
        if ((item.tags || []).includes(keyword)) score += 2;
        if ((item.keywords || []).includes(keyword)) score += 1;
        if (cleanText(item.title).toLowerCase().includes(keyword)) score += 1;
      });
      if ((item.libraryType === 'motion' || (item.tags || []).includes('motion')) && /(motion|scroll|animate|transition|parallax)/.test(prompt.toLowerCase())) score += 3;
      return {item, score};
    })
    .filter((entry) => entry.score > 0 || entry.item.clientId && client?.id && String(entry.item.clientId) === String(client.id))
    .sort((a, b) => b.score - a.score || new Date(b.item.createdAt || 0) - new Date(a.item.createdAt || 0));

  return ranked.slice(0, limit).map((entry) => entry.item);
}

export function libraryItemsToRuntimeContext(items = []) {
  const references = [];
  const attachments = [];

  items.forEach((item, index) => {
    if (item.sourceType === 'reference') {
      references.push({
        id: item.id || `lib-ref-${index}`,
        label: item.title,
        value: item.url || item.value || item.title,
        libraryType: item.libraryType,
        tags: item.tags || [],
        cues: item.cues || [],
        keywords: item.keywords || [],
      });
      return;
    }

    attachments.push({
      id: item.id || `lib-file-${index}`,
      name: item.title,
      type: item.assetType || 'file',
      cues: item.cues || [],
      keywords: item.keywords || [],
      dataUrl: '',
      previewUrl: item.previewUrl || '',
      libraryType: item.libraryType,
      tags: item.tags || [],
    });
  });

  return {references, attachments};
}

export function getLibraryTypeLabel(value = 'reference') {
  const map = {
    reference: 'Reference',
    template: 'Template',
    knowledge: 'Knowledge',
    motion: 'Motion',
  };
  return map[value] || 'Reference';
}
