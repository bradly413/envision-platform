const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

describe('admin dashboard Netlify SPA redirects', () => {
  it('ships a public/_redirects SPA fallback for BrowserRouter routes', () => {
    const redirectsPath = path.join(__dirname, '../admin-dashboard/public/_redirects');
    assert.ok(fs.existsSync(redirectsPath), 'admin-dashboard/public/_redirects must exist');
    const content = fs.readFileSync(redirectsPath, 'utf8');
    // Netlify rewrite: serve index.html for all paths (login, portals, refresh, bookmarks)
    assert.match(
      content,
      /^\/\*\s+\/index\.html\s+200\s*$/m,
      'expected /* /index.html 200 SPA fallback rule'
    );
  });

  it('client portal keeps its SPA fallback (parity check)', () => {
    const redirectsPath = path.join(__dirname, '../client-portal/public/_redirects');
    assert.ok(fs.existsSync(redirectsPath), 'client-portal/public/_redirects must exist');
    const content = fs.readFileSync(redirectsPath, 'utf8');
    assert.match(content, /^\/\*\s+\/index\.html\s+200\s*$/m);
  });
});
