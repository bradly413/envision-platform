const router = require('express').Router();
const { requireAdmin } = require('../middleware/auth');
const multer = require('multer');
const https = require('https');
const http = require('http');
const crypto = require('crypto');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

// Upload to Cloudinary using multipart/form-data manually
async function uploadToCloudinary(buffer, mimetype, originalname) {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) throw new Error('Cloudinary not configured');

  const timestamp = Math.round(Date.now() / 1000);
  const folder = 'envision-portals';
  const signature = crypto.createHash('sha1')
    .update(`folder=${folder}&timestamp=${timestamp}${apiSecret}`)
    .digest('hex');

  const boundary = `----FormBoundary${crypto.randomBytes(16).toString('hex')}`;
  const resourceType = mimetype.startsWith('video') ? 'video' : 'image';

  const fields = { api_key: apiKey, timestamp: String(timestamp), signature, folder };
  let body = '';
  for (const [key, val] of Object.entries(fields)) {
    body += `--${boundary}\r\nContent-Disposition: form-data; name="${key}"\r\n\r\n${val}\r\n`;
  }
  const fileHeader = `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${originalname}"\r\nContent-Type: ${mimetype}\r\n\r\n`;
  const footer = `\r\n--${boundary}--\r\n`;

  const bodyBuf = Buffer.concat([
    Buffer.from(body),
    Buffer.from(fileHeader),
    buffer,
    Buffer.from(footer),
  ]);

  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'api.cloudinary.com',
      path: `/v1_1/${cloudName}/${resourceType}/upload`,
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': bodyBuf.length,
      },
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => { try { resolve(JSON.parse(data)); } catch { reject(new Error('Invalid Cloudinary response: ' + data)); } });
    });
    req.on('error', reject);
    req.write(bodyBuf);
    req.end();
  });
}

// POST /api/uploads/asset
router.post('/asset', requireAdmin, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file provided' });
  try {
    const result = await uploadToCloudinary(req.file.buffer, req.file.mimetype, req.file.originalname);
    if (result.error) return res.status(400).json({ error: result.error.message });
    res.json({ url: result.secure_url, publicId: result.public_id, type: result.resource_type, width: result.width, height: result.height, format: result.format, bytes: result.bytes });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/uploads/fetch-url
router.post('/fetch-url', requireAdmin, async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'URL required' });
  try {
    const parsed = new URL(url);
    const protocol = parsed.protocol === 'https:' ? https : http;
    const html = await new Promise((resolve, reject) => {
      const request = protocol.get(url, { headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'text/html' }, timeout: 10000 }, (response) => {
        if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) return resolve('REDIRECT:' + response.headers.location);
        let data = '';
        response.on('data', chunk => data += chunk);
        response.on('end', () => resolve(data));
      });
      request.on('error', reject);
      request.on('timeout', () => { request.destroy(); reject(new Error('Request timed out')); });
    });
    if (html.startsWith('REDIRECT:')) return res.json({ url, redirectTo: html.replace('REDIRECT:', ''), html: '' });
    const stripped = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '').replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '').replace(/\s+/g, ' ').substring(0, 15000);
    const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
    const colorMatches = html.match(/#[0-9A-Fa-f]{3,6}/g) || [];
    const fontMatches = html.match(/font-family:\s*['"]?([^;'"]+)/g) || [];
    res.json({ url, title: titleMatch?.[1] || '', colors: [...new Set(colorMatches)].slice(0, 20), fonts: [...new Set(fontMatches)].slice(0, 10), html: stripped });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
