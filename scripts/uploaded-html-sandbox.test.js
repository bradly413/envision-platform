const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const test = require('node:test');

test('uploaded HTML cannot combine script and same-origin privileges', () => {
  const presentationPage = readFileSync(
    path.resolve(__dirname, '../client-portal/src/pages/PresentationPage.jsx'),
    'utf8'
  );
  const sandbox = presentationPage.match(/sandbox="([^"]+)"/)?.[1] || '';

  assert.match(sandbox, /\ballow-scripts\b/);
  assert.doesNotMatch(sandbox, /\ballow-same-origin\b/);
});
