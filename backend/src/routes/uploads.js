const router = require('express').Router();
const { requireAdmin } = require('../middleware/auth');
const multer = require('multer');
const https = require('https');
const http = require('http');

// Multer memory storage
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

// Cloudinary upload via REST API (no SDK needed)
async function uploadToCloudinary(buffer, mimetype, folder = 'envision-portals') {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) throw new Error('Cloudinary not configured');

  const timestamp = Math.round(Date.now() / 1000);
  const crypto = require('crypto');
  const signature = crypto.createHash('sha1')
    .update(`folder=${folder}&timestamp=${timestamp}${apiSecret}`)
    .digest('hex');

  const FormData = require('form-data');
  const form = new FormData();
  form.append('file', buffer, { contentType: mimetype, filename: `upload_${Date.now()}` });
  form.append('api_key', apiKey);
  form.append('timestamp', timestamp.toString());
  form.append('signature', signature);
  form.append('folder', folder);

  const resourceType = mimetype.startsWith('video') ? 'video' : 'image';
  const url = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`;

  return new Promise((resolve, reject) => {
    const req = https.request(url, {
      method: 'POST',
      headers: form.getHeaders(),
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch { reject(new Error('Invalid Cloudinary response')); }
      });
    });
    req.on('error', reject);
    form.pipe(req);
  });
}

// POST /api/uploads/asset — upload image or video
router.post('/asset', requireAdmin, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file provided' });
  try {
    const result = await uploadToCloudinary(req.file.buffer, req.file.mimetype);
    res.json({
      url: result.secure_url,
      publicId: result.public_id,
      type: result.resource_type,
      width: result.width,
      height: result.height,
      format: result.format,
      bytes: result.bytes,
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/uploads/fetch-url — fetch a URL for Claude to analyze
router.post('/fetch-url', requireAdmin, async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'URL required' });

  try {
    const parsed = new URL(url);
    const protocol = parsed.protocol === 'https:' ? https : http;

    const html = await new Promise((resolve, reject) => {
      const request = protocol.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; EnvisionBot/1.0)',
          'Accept': 'text/html',
        },
        timeout: 10000,
      }, (response) => {
        // Handle redirects
        if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
          return resolve(`REDIRECT:${response.headers.location}`);
        }
        let data = '';
        response.on('data', chunk => data += chunk);
        response.on('end', () => resolve(data));
      });
      request.on('error', reject);
      request.on('timeout', () => { request.destroy(); reject(new Error('Request timed out')); });
    });

    if (html.startsWith('REDIRECT:')) {
      return res.json({ url, redirectTo: html.replace('REDIRECT:', ''), html: '' });
    }

    // Strip scripts and styles, keep structure
    const stripped = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/\s+/g, ' ')
      .substring(0, 15000); // Limit size for Claude

    // Extract meta info
    const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
    const descMatch = html.match(/<meta[^>]*name="description"[^>]*content="([^"]*)"[^>]*>/i);
    const colorMatches = html.match(/#[0-9A-Fa-f]{3,6}/g) || [];
    const fontMatches = html.match(/font-family:\s*['"]?([^;'"]+)/g) || [];

    res.json({
      url,
      title: titleMatch?.[1] || '',
      description: descMatch?.[1] || '',
      colors: [...new Set(colorMatches)].slice(0, 20),
      fonts: [...new Set(fontMatches)].slice(0, 10),
      html: stripped,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
