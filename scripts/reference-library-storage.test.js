const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

function loadLibrary() {
  const file = path.join(__dirname, '../admin-dashboard/src/lib/referenceLibrary.js');
  let src = fs.readFileSync(file, 'utf8');
  src = src.replace(/^export /gm, '');
  src += `
    module.exports = {
      MAX_INLINE_MEDIA_BYTES,
      MAX_LIBRARY_JSON_BYTES,
      stripInlineMedia,
      shouldInlineMediaFile,
      sanitizeLibraryEntry,
      sanitizeLibraryItems,
      fitLibraryWithinQuota,
      createLibraryEntries,
      loadReferenceLibrary,
      saveReferenceLibrary,
    };
  `;
  const module = { exports: {} };
  vm.runInNewContext(src, {
    module,
    exports: module.exports,
    console,
    Date,
    Math,
    Set,
    Map,
    JSON,
    TextEncoder,
    window: global.window,
  });
  return module.exports;
}

test('shouldInlineMediaFile rejects videos and oversized images', () => {
  const { shouldInlineMediaFile, MAX_INLINE_MEDIA_BYTES } = loadLibrary();
  assert.equal(shouldInlineMediaFile({ type: 'video/mp4', size: 12 * 1024 * 1024 }), false);
  assert.equal(shouldInlineMediaFile({ type: 'image/jpeg', size: MAX_INLINE_MEDIA_BYTES + 1 }), false);
  assert.equal(shouldInlineMediaFile({ type: 'image/png', size: 24 * 1024 }), true);
  assert.equal(shouldInlineMediaFile(null), false);
});

test('sanitizeLibraryEntry strips data-URL preview and dataUrl fields', () => {
  const { sanitizeLibraryEntry } = loadLibrary();
  const sanitized = sanitizeLibraryEntry({
    id: 'file-1',
    title: 'logo.png',
    previewUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    dataUrl: 'data:image/png;base64,AAAA',
    url: 'https://cdn.example.com/logo.png',
  });
  assert.equal(sanitized.previewUrl, '');
  assert.equal(sanitized.dataUrl, '');
  assert.equal(sanitized.url, 'https://cdn.example.com/logo.png');
  assert.equal(sanitized.title, 'logo.png');
});

test('createLibraryEntries does not persist attachment data URLs', () => {
  const { createLibraryEntries } = loadLibrary();
  const [entry] = createLibraryEntries({
    attachments: [{
      id: 'att-1',
      name: 'hero.jpg',
      type: 'image/jpeg',
      previewUrl: `data:image/jpeg;base64,${'A'.repeat(4000)}`,
      dataUrl: `data:image/jpeg;base64,${'B'.repeat(4000)}`,
    }],
    client: { id: 'c1', name: 'Jazz STL' },
  });
  assert.equal(entry.previewUrl, '');
  assert.equal(entry.dataUrl, undefined);
  assert.equal(entry.title, 'hero.jpg');
});

test('fitLibraryWithinQuota drops oldest entries until JSON fits', () => {
  const { fitLibraryWithinQuota } = loadLibrary();
  const items = Array.from({ length: 40 }, (_, index) => ({
    id: `item-${index}`,
    title: `Item ${index}`,
    notes: 'n'.repeat(2000),
    createdAt: new Date(2026, 0, index + 1).toISOString(),
  }));
  const fitted = fitLibraryWithinQuota(items, 8 * 1024);
  assert.ok(fitted.length > 0);
  assert.ok(fitted.length < items.length);
  assert.equal(fitted[0].id, 'item-0');
  assert.ok(Buffer.byteLength(JSON.stringify(fitted), 'utf8') <= 8 * 1024);
});

test('saveReferenceLibrary never writes data URLs into localStorage', () => {
  const store = new Map();
  global.window = {
    localStorage: {
      getItem: (key) => (store.has(key) ? store.get(key) : null),
      setItem: (key, value) => { store.set(key, String(value)); },
      removeItem: (key) => { store.delete(key); },
    },
  };

  const { saveReferenceLibrary, loadReferenceLibrary } = loadLibrary();
  saveReferenceLibrary([{
    id: 'file-1',
    title: 'mood.png',
    previewUrl: `data:image/png;base64,${'C'.repeat(8000)}`,
    dataUrl: `data:image/png;base64,${'D'.repeat(8000)}`,
  }]);

  const raw = store.get('envision-creative-reference-library-v1');
  assert.ok(raw);
  assert.equal(raw.includes('data:image'), false);
  assert.equal(loadReferenceLibrary()[0].previewUrl, '');
});
