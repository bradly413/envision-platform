const router = require('express').Router();
const { requireAdmin } = require('../middleware/auth');

router.use(requireAdmin);

// Simple HTML tag extraction helpers
function extractMeta(html, name) {
  const pattern = new RegExp(`<meta[^>]+(?:name|property)=["']${name}["'][^>]+content=["']([^"']+)["']`, 'i');
  const match = html.match(pattern);
  if (match) return match[1];
  // Try reversed attribute order
  const alt = new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:name|property)=["']${name}["']`, 'i');
  const altMatch = html.match(alt);
  return altMatch ? altMatch[1] : '';
}

function extractTitle(html) {
  const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return match ? match[1].trim() : '';
}

function extractBodyText(html) {
  // Remove script and style blocks
  let cleaned = html.replace(/<script[\s\S]*?<\/script>/gi, '');
  cleaned = cleaned.replace(/<style[\s\S]*?<\/style>/gi, '');
  cleaned = cleaned.replace(/<nav[\s\S]*?<\/nav>/gi, '');
  cleaned = cleaned.replace(/<footer[\s\S]*?<\/footer>/gi, '');
  // Strip tags
  cleaned = cleaned.replace(/<[^>]+>/g, ' ');
  // Normalize whitespace
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  return cleaned.slice(0, 3000);
}

// Rate limit: track per-IP timestamps
const requestTimes = new Map();
const RATE_LIMIT_MS = 12000; // 5 req/min = 1 per 12s
const MAX_TRACKED = 200;

router.post('/', async (req, res) => {
  const { url } = req.body || {};

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'url is required' });
  }

  // Basic URL validation
  let parsed;
  try {
    parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return res.status(400).json({ error: 'Only http/https URLs are supported' });
    }
  } catch {
    return res.status(400).json({ error: 'Invalid URL' });
  }

  // Simple rate limit
  const ip = req.ip || 'unknown';
  const now = Date.now();
  const last = requestTimes.get(ip) || 0;
  if (now - last < RATE_LIMIT_MS) {
    return res.status(429).json({ error: 'Rate limit exceeded. Try again in a few seconds.' });
  }
  requestTimes.set(ip, now);
  if (requestTimes.size > MAX_TRACKED) {
    const oldest = [...requestTimes.entries()].sort((a, b) => a[1] - b[1])[0];
    if (oldest) requestTimes.delete(oldest[0]);
  }

  try {
    const response = await fetch(parsed.href, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; EnvisionBot/1.0)',
        'Accept': 'text/html,application/xhtml+xml,*/*',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      return res.status(502).json({ error: `Upstream returned ${response.status}` });
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text/html') && !contentType.includes('application/xhtml')) {
      return res.status(400).json({ error: 'URL did not return HTML content' });
    }

    const html = await response.text();

    res.json({
      url: parsed.href,
      title: extractTitle(html),
      description: extractMeta(html, 'description') || extractMeta(html, 'og:description'),
      ogImage: extractMeta(html, 'og:image'),
      text: extractBodyText(html),
    });
  } catch (err) {
    if (err.name === 'TimeoutError' || err.name === 'AbortError') {
      return res.status(504).json({ error: 'URL fetch timed out' });
    }
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
