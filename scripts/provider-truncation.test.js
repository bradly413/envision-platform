const { test } = require('node:test');
const assert = require('node:assert/strict');
const {
  isProviderTruncation,
  providerTextResult,
  assertCompleteProviderText,
} = require('../backend/src/services/ai');

test('detects Anthropic max_tokens truncation', () => {
  assert.equal(isProviderTruncation('max_tokens'), true);
  assert.equal(isProviderTruncation('end_turn'), false);
});

test('detects OpenAI length truncation', () => {
  assert.equal(isProviderTruncation('length'), true);
  assert.equal(isProviderTruncation('stop'), false);
});

test('detects Google MAX_TOKENS truncation (case-insensitive)', () => {
  assert.equal(isProviderTruncation('MAX_TOKENS'), true);
  assert.equal(isProviderTruncation('STOP'), false);
});

test('providerTextResult marks truncated payloads and preserves text', () => {
  const truncated = providerTextResult('{"hero":{"title":"Half', 'max_tokens');
  assert.equal(truncated.truncated, true);
  assert.equal(truncated.stopReason, 'max_tokens');
  assert.match(truncated.text, /Half/);

  const complete = providerTextResult('{"hero":{},"brand":{}}', 'end_turn');
  assert.equal(complete.truncated, false);
  assert.equal(complete.stopReason, 'end_turn');
});

test('assertCompleteProviderText hard-fails truncated generation', () => {
  assert.throws(
    () => assertCompleteProviderText(providerTextResult('partial cinematic files...', 'length'), { stage: 'generation' }),
    /truncated by the provider \(stop_reason=length\)/
  );
});

test('assertCompleteProviderText returns text when generation completed', () => {
  const text = assertCompleteProviderText(
    providerTextResult('```json\n{"hero":{}}\n```', 'end_turn'),
    { stage: 'generation' }
  );
  assert.match(text, /hero/);
});

test('assertCompleteProviderText hard-fails truncated repair', () => {
  assert.throws(
    () => assertCompleteProviderText(providerTextResult('{"hero":', 'MAX_TOKENS'), { stage: 'repair' }),
    /AI repair was truncated by the provider \(stop_reason=MAX_TOKENS\)/
  );
});
