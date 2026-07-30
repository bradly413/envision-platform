const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const { pathToFileURL } = require('url');

const moduleUrl = pathToFileURL(
  path.join(__dirname, '../admin-dashboard/src/lib/builderWorkspaceCache.js')
).href;

describe('builder workspace cache sanitize', () => {
  it('strips portal passwords and content before cache write', async () => {
    const { sanitizePortalForCache, sanitizePortalsForCache } = await import(moduleUrl);

    const portal = {
      id: 'p1',
      slug: 'acme',
      client_id: 'c1',
      plain_password: 'secret-pass',
      password_hash: '$2a$10$examplehash',
      content: { hero: { headline: 'Huge payload' }, html: '<html></html>' },
      template_id: 'brand-reveal-v1',
      status: 'active',
    };

    const safe = sanitizePortalForCache(portal);
    assert.equal(safe.slug, 'acme');
    assert.equal(safe.template_id, 'brand-reveal-v1');
    assert.equal('plain_password' in safe, false);
    assert.equal('password_hash' in safe, false);
    assert.equal('content' in safe, false);
    // Original must remain untouched for in-session deploy UI.
    assert.equal(portal.plain_password, 'secret-pass');
    assert.ok(portal.content);

    const list = sanitizePortalsForCache([portal, null]);
    assert.equal(list.length, 2);
    assert.equal('plain_password' in list[0], false);
    assert.equal(list[1], null);
  });

  it('patch builder requests must not hard-cap maxTokens below mode defaults', () => {
    const fs = require('fs');
    const source = fs.readFileSync(
      path.join(__dirname, '../admin-dashboard/src/pages/PortalEditorV2Page.jsx'),
      'utf8'
    );

    // Call site (not the function definition): content: buildPatchMessage({...})
    const patchCallSite = source.indexOf('content: buildPatchMessage({');
    assert.ok(patchCallSite > 0, 'expected buildPatchMessage call site');
    const patchGenerate = source.indexOf('ai.generateBuilderContent({', patchCallSite);
    assert.ok(patchGenerate > 0, 'expected generateBuilderContent after patch message');
    const afterGenerate = source.slice(patchGenerate, patchGenerate + 500);
    const callMatch = afterGenerate.match(/ai\.generateBuilderContent\(\{[\s\S]*?\n\s*\}\);/);
    assert.ok(callMatch, 'expected to parse patch generateBuilderContent call');
    assert.equal(
      /maxTokens\s*:/.test(callMatch[0]),
      false,
      'patch path must omit maxTokens so backend MODE_TOKEN_DEFAULTS apply'
    );
  });
});
