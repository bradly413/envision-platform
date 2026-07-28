const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const { pickAllowlistedFields, buildParameterizedSet } = require('./allowlistedPatch');

const CLIENT_PATCH_FIELDS = [
  'name', 'company', 'email', 'phone', 'stage',
  'project_type', 'budget', 'revenue', 'notes', 'tags',
];

test('pickAllowlistedFields keeps only known columns', () => {
  const { fields, values } = pickAllowlistedFields(
    { name: 'Acme', stage: 'active', evil: 'nope' },
    CLIENT_PATCH_FIELDS
  );
  assert.deepEqual(fields, ['name', 'stage']);
  assert.deepEqual(values, ['Acme', 'active']);
});

test('pickAllowlistedFields ignores SQL-injection style keys', () => {
  const malicious = {
    "stage = 'archived'--": 'x',
    'name); DROP TABLE clients;--': 'x',
    id: 'should-never-patch-pk',
  };
  const { fields, values } = pickAllowlistedFields(malicious, CLIENT_PATCH_FIELDS);
  assert.deepEqual(fields, []);
  assert.deepEqual(values, []);
  const set = buildParameterizedSet(fields);
  assert.equal(set, '');
});

test('buildParameterizedSet never embeds raw keys as free SQL', () => {
  const { fields, values } = pickAllowlistedFields(
    { notes: 'hello', budget: 1000 },
    CLIENT_PATCH_FIELDS
  );
  // Fields follow allowlist order, not request-body key order.
  const set = buildParameterizedSet(fields);
  assert.equal(set, 'budget = $2, notes = $3');
  assert.deepEqual(values, [1000, 'hello']);
  assert.doesNotMatch(set, /;/);
  assert.doesNotMatch(set, /--/);
});

test('clients and tasks routes use allowlistedPatch helper', () => {
  const clientsSrc = readFileSync(path.resolve(__dirname, '../routes/clients.js'), 'utf8');
  const tasksSrc = readFileSync(path.resolve(__dirname, '../routes/tasks.js'), 'utf8');
  assert.match(clientsSrc, /pickAllowlistedFields/);
  assert.match(tasksSrc, /pickAllowlistedFields/);
  assert.doesNotMatch(clientsSrc, /Object\.keys\(req\.body\)/);
  assert.doesNotMatch(tasksSrc, /Object\.keys\(req\.body\)/);
});
