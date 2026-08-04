const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const {
  extractStructuredJson,
  isStructuredOutputForMode,
} = require('../backend/src/services/ai');

const truncatedPortalReply = `
Here is the portal JSON:
{
  "hero": {
    "title": "Charter Aviation",
    "subtitle": "Private flight, precisely composed."
  },
  "brand": {
    "name": "Charter",
    "tagline": "Quiet power aloft"
  },
  "experience": {
    "sectionSequence": ["hero", "brand", "logo"],
    "heroEffects": ["shader-background", "title-reveal"],
    "notes": "This object is cut off mid-stream and never closes
`;

test('rejects nested fragments from truncated portal JSON', () => {
  const structured = extractStructuredJson(truncatedPortalReply, 'portal');
  assert.equal(structured, null);
});

test('accepts a complete portal contract object', () => {
  const complete = {
    hero: { title: 'Charter Aviation' },
    brand: { name: 'Charter' },
    colors: { primary: '#111111' },
  };

  assert.equal(isStructuredOutputForMode(complete, 'portal'), true);
  assert.deepEqual(
    extractStructuredJson(`\`\`\`json\n${JSON.stringify(complete)}\n\`\`\``, 'portal'),
    complete
  );
});

test('rejects lone hero objects that look like nested fragments', () => {
  assert.equal(isStructuredOutputForMode({ hero: { title: 'Only hero' } }, 'portal'), false);
  assert.equal(isStructuredOutputForMode({ title: 'Nested fragment' }, 'portal'), false);
});

test('presentation mode requires presentation.slides', () => {
  assert.equal(
    isStructuredOutputForMode({ mode: 'presentation', presentation: { title: 'Deck' } }, 'presentation'),
    false
  );
  assert.equal(
    isStructuredOutputForMode({
      mode: 'presentation',
      presentation: { title: 'Deck', slides: [{ id: '1' }] },
    }, 'presentation'),
    true
  );
});

test('cinematic-flow mode requires cinematicFlow.scenes', () => {
  assert.equal(
    isStructuredOutputForMode({ cinematicFlow: { title: 'Flow' } }, 'cinematic-flow'),
    false
  );
  assert.equal(
    isStructuredOutputForMode({
      cinematicFlow: { title: 'Flow', scenes: [{ id: 'opening' }] },
    }, 'cinematic-flow'),
    true
  );
});

test('repairStructuredResponse no longer hard-codes a 2200 token cap', () => {
  const source = fs.readFileSync(
    path.join(__dirname, '../backend/src/services/ai.js'),
    'utf8'
  );

  assert.match(source, /const repairTokens = Math\.max\(Number\(maxTokens\) \|\| 0, 8192\)/);
  assert.doesNotMatch(
    source,
    /repairStructuredResponse[\s\S]*?maxTokens:\s*2200/
  );
});
