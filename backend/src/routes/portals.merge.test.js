const test = require('node:test');
const assert = require('node:assert/strict');

const { _private } = require('./portals');

test('appendMergedContentPatch merges JSONB content instead of replacing it', () => {
  const fields = [];
  const values = [];
  const content = { hero: { headline: 'Updated headline' } };

  const nextIndex = _private.appendMergedContentPatch({
    fields,
    values,
    index: 1,
    content,
  });

  assert.equal(nextIndex, 2);
  assert.deepEqual(fields, ["content = COALESCE(content, '{}'::jsonb) || $1::jsonb"]);
  assert.deepEqual(values, [JSON.stringify(content)]);
});

test('appendMergedContentPatch rejects non-object content patches', () => {
  for (const content of [null, [], 'text']) {
    assert.throws(
      () => _private.appendMergedContentPatch({
        fields: [],
        values: [],
        index: 1,
        content,
      }),
      /Portal content PATCH must be a JSON object/
    );
  }
});
