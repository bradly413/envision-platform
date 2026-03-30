const router = require('express').Router();
const { requireAdmin } = require('../middleware/auth');

router.use(requireAdmin);

// ─── Firecrawl integration ────────────────────────────────────
// Uses Firecrawl API when FIRECRAWL_API_KEY is set in Railway.
// Falls back to basic fetch+regex when key is missing.

async function scrapeWithFirecrawl(url) {
  const apiKey = process.env.FIRECRAWL_API_KEY;

  // Scrape single page — returns markdown + metadata
  const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      url,
      formats: ['markdown', 'extract'],
      extract: {
        schema: {
          type: 'object',
          properties: {
            title: { type: 'string', description: 'Page title' },
            description: { type: 'string', description: 'Page meta description or first paragraph summary' },
            brandColors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  hex: { type: 'string' },
                  name: { type: 'string' },
                  usage: { type: 'string' },
                },
              },
              description: 'Brand colors found on the page (from CSS variables, inline styles, or visual elements)',
            },
            fonts: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  usage: { type: 'string' },
                },
              },
              description: 'Font families used on the page',
            },
            logoUrl: { type: 'string', description: 'URL of the site logo if found' },
            industry: { type: 'string', description: 'Industry or category of the business' },
            tone: { type: 'string', description: 'Overall tone of the site (luxury, corporate, playful, minimal, etc.)' },
            keyPhrases: {
              type: 'array',
              items: { type: 'string' },
              description: 'Key marketing phrases or taglines found on the page',
            },
          },
        },
      },
    }),
    signal: AbortSignal.timeout(30000),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `Firecrawl returned ${response.status}`);
  }

  const data = await response.json();
  const result = data.data || {};

  return {
    url,
    source: 'firecrawl',
    title: result.metadata?.title || result.extract?.title || '',
    description: result.metadata?.description || result.extract?.description || '',
    ogImage: result.metadata?.ogImage || '',
    text: (result.markdown || '').slice(0, 5000),
    extract: result.extract || null,
    metadata: {
      statusCode: result.metadata?.statusCode,
      language: result.metadata?.language,
      sourceURL: result.metadata?.sourceURL || url,
    },
  };
}

async function crawlWithFirecrawl(url, maxPages) {
  const apiKey = process.env.FIRECRAWL_API_KEY;

  // Crawl multiple pages — returns array of page results
  const response = await fetch('https://api.firecrawl.dev/v1/crawl', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      url,
      limit: maxPages,
      scrapeOptions: { formats: ['markdown'] },
    }),
    signal: AbortSignal.timeout(60000),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `Firecrawl crawl returned ${response.status}`);
  }

  const data = await response.json();

  // Crawl returns a job — poll for completion
  if (data.id) {
    return { jobId: data.id, status: 'crawling', message: 'Crawl started. Poll /api/scrape/crawl-status for results.' };
  }

  return data;
}

// ─── Basic fallback scraper ───────────────────────────────────

function extractMeta(html, name) {
  const pattern = new RegExp(`<meta[^>]+(?:name|property)=["']${name}["'][^>]+content=["']([^"']+)["']`, 'i');
  const match = html.match(pattern);
  if (match) return match[1];
  const alt = new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:name|property)=["']${name}["']`, 'i');
  const altMatch = html.match(alt);
  return altMatch ? altMatch[1] : '';
}

function extractTitle(html) {
  const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return match ? match[1].trim() : '';
}

function extractBodyText(html) {
  let cleaned = html.replace(/<script[\s\S]*?<\/script>/gi, '');
  cleaned = cleaned.replace(/<style[\s\S]*?<\/style>/gi, '');
  cleaned = cleaned.replace(/<nav[\s\S]*?<\/nav>/gi, '');
  cleaned = cleaned.replace(/<footer[\s\S]*?<\/footer>/gi, '');
  cleaned = cleaned.replace(/<[^>]+>/g, ' ');
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  return cleaned.slice(0, 3000);
}

async function scrapeBasic(url) {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; EnvisionBot/1.0)',
      'Accept': 'text/html,application/xhtml+xml,*/*',
    },
    signal: AbortSignal.timeout(10000),
  });

  if (!response.ok) throw new Error(`Upstream returned ${response.status}`);

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('text/html') && !contentType.includes('application/xhtml')) {
    throw new Error('URL did not return HTML content');
  }

  const html = await response.text();
  return {
    url,
    source: 'basic',
    title: extractTitle(html),
    description: extractMeta(html, 'description') || extractMeta(html, 'og:description'),
    ogImage: extractMeta(html, 'og:image'),
    text: extractBodyText(html),
    extract: null,
    metadata: null,
  };
}

// ─── Rate limiting ────────────────────────────────────────────

const requestTimes = new Map();
const RATE_LIMIT_MS = 6000;
const MAX_TRACKED = 200;

function checkRateLimit(ip) {
  const now = Date.now();
  const last = requestTimes.get(ip) || 0;
  if (now - last < RATE_LIMIT_MS) return false;
  requestTimes.set(ip, now);
  if (requestTimes.size > MAX_TRACKED) {
    const oldest = [...requestTimes.entries()].sort((a, b) => a[1] - b[1])[0];
    if (oldest) requestTimes.delete(oldest[0]);
  }
  return true;
}

// ─── Routes ───────────────────────────────────────────────────

// POST /api/scrape — single page scrape (Firecrawl or fallback)
router.post('/', async (req, res) => {
  const { url } = req.body || {};

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'url is required' });
  }

  let parsed;
  try {
    parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return res.status(400).json({ error: 'Only http/https URLs are supported' });
    }
  } catch {
    return res.status(400).json({ error: 'Invalid URL' });
  }

  const ip = req.ip || 'unknown';
  if (!checkRateLimit(ip)) {
    return res.status(429).json({ error: 'Rate limit exceeded. Try again in a few seconds.' });
  }

  try {
    const result = process.env.FIRECRAWL_API_KEY
      ? await scrapeWithFirecrawl(parsed.href)
      : await scrapeBasic(parsed.href);
    res.json(result);
  } catch (err) {
    if (err.name === 'TimeoutError' || err.name === 'AbortError') {
      return res.status(504).json({ error: 'URL fetch timed out' });
    }
    res.status(500).json({ error: err.message });
  }
});

// POST /api/scrape/crawl — multi-page crawl (Firecrawl only)
router.post('/crawl', async (req, res) => {
  if (!process.env.FIRECRAWL_API_KEY) {
    return res.status(503).json({ error: 'Firecrawl not configured. Add FIRECRAWL_API_KEY to enable crawling.' });
  }

  const { url, maxPages = 5 } = req.body || {};

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'url is required' });
  }

  let parsed;
  try {
    parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return res.status(400).json({ error: 'Only http/https URLs are supported' });
    }
  } catch {
    return res.status(400).json({ error: 'Invalid URL' });
  }

  const ip = req.ip || 'unknown';
  if (!checkRateLimit(ip)) {
    return res.status(429).json({ error: 'Rate limit exceeded.' });
  }

  try {
    const result = await crawlWithFirecrawl(parsed.href, Math.min(maxPages, 10));
    res.json(result);
  } catch (err) {
    if (err.name === 'TimeoutError' || err.name === 'AbortError') {
      return res.status(504).json({ error: 'Crawl request timed out' });
    }
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
