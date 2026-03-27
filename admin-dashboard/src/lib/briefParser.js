const OBJECTIVE_KEYWORDS = [
  'awareness',
  'acquisition',
  'conversion',
  'retention',
  'engagement',
  'launch',
  'traffic',
  'donations',
  'attendance',
  'subscriptions',
  'sales',
];

const TONE_KEYWORDS = [
  'luxury',
  'premium',
  'editorial',
  'bold',
  'modern',
  'minimal',
  'cinematic',
  'cultural',
  'community',
  'energetic',
  'elevated',
  'playful',
  'immersive',
  'documentary',
];

function compactText(value = '') {
  return String(value || '')
    .replace(/data:[^"'\s>]+/gi, 'data:[embedded]')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/[\u0000-\u001f\u007f-\u009f]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function unique(values = []) {
  return [...new Set(values.filter(Boolean))];
}

function summarize(text = '', limit = 360) {
  return compactText(text).slice(0, limit);
}

function sanitizeHtml(raw = '') {
  return String(raw || '')
    .replace(/data:[^"'\s>]+/gi, 'data:[embedded]')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ');
}

function stripTags(raw = '') {
  return compactText(String(raw || '').replace(/<[^>]+>/g, ' '));
}

function matchFirst(text, regex) {
  const match = text.match(regex);
  return match?.[1] ? compactText(match[1]) : '';
}

function collectToneSignals(text = '') {
  const lower = compactText(text).toLowerCase();
  return TONE_KEYWORDS.filter((keyword) => lower.includes(keyword));
}

function collectObjectives(text = '') {
  const lower = compactText(text).toLowerCase();
  return OBJECTIVE_KEYWORDS.filter((keyword) => lower.includes(keyword));
}

function extractHeadingsFromHtml(html = '') {
  const matches = [...html.matchAll(/<(h1|h2|h3)[^>]*>([\s\S]*?)<\/\1>/gi)];
  const sectionMatches = [...html.matchAll(/class=["'][^"']*section-header[^"']*["'][^>]*>([\s\S]*?)<\/[^>]+>/gi)];
  return unique([
    ...matches.map((match) => stripTags(match[2])),
    ...sectionMatches.map((match) => stripTags(match[1])),
  ]).slice(0, 16);
}

function extractCssColors(html = '') {
  const colors = [];
  for (const match of html.matchAll(/--([\w-]+)\s*:\s*(#[0-9a-fA-F]{3,8})/g)) {
    colors.push(`${match[1]} ${match[2]}`);
  }
  return unique(colors).slice(0, 8);
}

function extractMediaHints(html = '', text = '') {
  const items = [];
  const push = (type, label) => {
    if (!label) return;
    items.push({ type, label: summarize(label, 100) });
  };

  const imageCount = (html.match(/<img\b/gi) || []).length;
  const videoCount = (html.match(/<video\b/gi) || []).length;
  const iframeCount = (html.match(/<iframe\b/gi) || []).length;

  if (videoCount) {
    const captionMatches = [...html.matchAll(/class=["'][^"']*video-caption[^"']*["'][^>]*>([\s\S]*?)<\/[^>]+>/gi)];
    if (captionMatches.length) {
      captionMatches.forEach((match) => push('video', stripTags(match[1])));
    } else {
      push('video', `${videoCount} embedded video asset${videoCount === 1 ? '' : 's'}`);
    }
  }

  if (imageCount) {
    const labelMatches = [...html.matchAll(/class=["'][^"']*(ad-label|mockup-caption)[^"']*["'][^>]*>([\s\S]*?)<\/[^>]+>/gi)];
    if (labelMatches.length) {
      labelMatches.forEach((match) => push('image', stripTags(match[2])));
    } else {
      push('image', `${imageCount} embedded image asset${imageCount === 1 ? '' : 's'}`);
    }
  }

  if (iframeCount) {
    push('embed', `${iframeCount} embedded iframe${iframeCount === 1 ? '' : 's'}`);
  }

  const linkMatches = [...html.matchAll(/<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)];
  linkMatches.forEach((match) => {
    const label = stripTags(match[2]) || match[1];
    push('link', label);
  });

  const tableCount = (html.match(/<table\b/gi) || []).length;
  if (tableCount) {
    push('spec', `${tableCount} specification table${tableCount === 1 ? '' : 's'}`);
  }

  if (!items.length) {
    if (/video/i.test(text)) push('video', 'Video deliverable referenced');
    if (/display ad/i.test(text)) push('image', 'Display ad creative referenced');
    if (/website mockup/i.test(text)) push('image', 'Website mockup referenced');
  }

  return unique(items.map((item) => `${item.type}::${item.label}`)).map((entry) => {
    const [type, label] = entry.split('::');
    return { type, label };
  }).slice(0, 10);
}

function parseHtmlBrief(raw = '', name = '') {
  const html = sanitizeHtml(raw);
  const text = stripTags(html.replace(/<style[\s\S]*?<\/style>/gi, ' '));
  const title = matchFirst(html, /<title[^>]*>([\s\S]*?)<\/title>/i) || name;
  const theme = matchFirst(text, /Campaign Theme:\s*["“]?([^"|”\n]+)/i);
  const launchDate =
    matchFirst(text, /Campaign Launch:\s*([A-Za-z]+\s+\d{1,2},\s+\d{4})/i) ||
    matchFirst(text, /Launch Date:\s*([A-Za-z]+\s+\d{1,2},\s+\d{4})/i);
  const tagline = matchFirst(html, /class=["'][^"']*doc-tagline[^"']*["'][^>]*>([\s\S]*?)<\/[^>]+>/i);
  const sectionHeadings = extractHeadingsFromHtml(html);
  const colors = extractCssColors(html);
  const objectives = collectObjectives(`${tagline} ${text}`).slice(0, 6);

  const summary =
    summarize(stripTags(matchFirst(html, /class=["'][^"']*intro-text[^"']*["'][^>]*>([\s\S]*?)<\/[^>]+>/i)), 420) ||
    summarize(text, 420);

  return {
    kind: 'creative-brief',
    sourceType: 'html',
    title,
    campaignTheme: theme,
    launchDate,
    objectives,
    sections: sectionHeadings,
    assets: extractMediaHints(html, text),
    brandSignals: {
      colors,
      tone: collectToneSignals(`${theme} ${summary} ${sectionHeadings.join(' ')}`).slice(0, 6),
    },
    summary,
  };
}

function parseTextBrief(raw = '', name = '') {
  const text = compactText(raw);
  const lines = String(raw || '')
    .split(/\r?\n/)
    .map((line) => compactText(line))
    .filter(Boolean);

  const candidateHeadings = lines
    .filter((line) => line.length <= 80 && /^[A-Z0-9][A-Za-z0-9 .,&:/'"()-]+$/.test(line))
    .slice(0, 12);

  return {
    kind: 'creative-brief',
    sourceType: 'text',
    title: lines[0] || name,
    campaignTheme: matchFirst(text, /Theme:\s*["“]?([^"|”]+)/i),
    launchDate: matchFirst(text, /(?:Launch|Start) Date:\s*([A-Za-z]+\s+\d{1,2},\s+\d{4})/i),
    objectives: collectObjectives(text).slice(0, 6),
    sections: unique(candidateHeadings),
    assets: extractMediaHints('', text),
    brandSignals: {
      colors: unique([...text.matchAll(/#[0-9a-fA-F]{3,8}/g)].map((match) => match[0])).slice(0, 8),
      tone: collectToneSignals(text).slice(0, 6),
    },
    summary: summarize(text, 420),
  };
}

export function parseCreativeBrief(raw = '', { name = '', mimeType = '' } = {}) {
  const text = String(raw || '');
  if (!text.trim()) return null;

  const normalizedMime = mimeType.toLowerCase();
  const looksLikeHtml = normalizedMime.includes('html') || /<html[\s>]|<!doctype html/i.test(text);
  const brief = looksLikeHtml ? parseHtmlBrief(text, name) : parseTextBrief(text, name);

  if (!brief.summary && !brief.sections.length && !brief.assets.length) return null;
  return brief;
}

export function formatBriefForContext(brief) {
  if (!brief) return '';

  const lines = [
    `title: ${brief.title || 'Untitled brief'}`,
  ];

  if (brief.campaignTheme) lines.push(`campaign theme: ${brief.campaignTheme}`);
  if (brief.launchDate) lines.push(`launch date: ${brief.launchDate}`);
  if (brief.objectives?.length) lines.push(`objectives: ${brief.objectives.join(', ')}`);
  if (brief.sections?.length) lines.push(`sections: ${brief.sections.join(' | ')}`);
  if (brief.assets?.length) lines.push(`assets: ${brief.assets.map((asset) => `${asset.type}:${asset.label}`).join(' | ')}`);
  if (brief.brandSignals?.colors?.length) lines.push(`brand colors: ${brief.brandSignals.colors.join(', ')}`);
  if (brief.brandSignals?.tone?.length) lines.push(`tone signals: ${brief.brandSignals.tone.join(', ')}`);
  if (brief.summary) lines.push(`summary: ${brief.summary}`);

  return lines.join('\n');
}
