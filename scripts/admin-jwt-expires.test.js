const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const jwt = require('jsonwebtoken');

const authSrc = readFileSync(
  path.resolve(__dirname, '../backend/src/routes/auth.js'),
  'utf8'
);
const prePushSrc = readFileSync(
  path.resolve(__dirname, 'pre-push-check.js'),
  'utf8'
);

test('jsonwebtoken@9 rejects explicit undefined expiresIn', () => {
  assert.throws(
    () => jwt.sign({ id: 'admin' }, 'test-secret', { expiresIn: undefined }),
    /expiresIn/
  );
});

test('admin login falls back when JWT_EXPIRES_IN is unset', () => {
  assert.match(authSrc, /JWT_EXPIRES_IN\s*\|\|\s*['"]7d['"]/);
  assert.doesNotMatch(
    authSrc,
    /jwt\.sign\(\s*\{[^}]*\}\s*,\s*process\.env\.JWT_SECRET\s*,\s*\{\s*expiresIn:\s*process\.env\.JWT_EXPIRES_IN\s*\}\s*\)/
  );

  const token = jwt.sign(
    { id: 'admin', email: 'admin@example.com', role: 'admin' },
    'test-secret',
    { expiresIn: process.env.UNSET_JWT_EXPIRES_IN || '7d' }
  );
  const payload = jwt.verify(token, 'test-secret');
  assert.equal(payload.role, 'admin');
  assert.equal(typeof payload.exp, 'number');
});

test('pre-push env parity check includes JWT_EXPIRES_IN', () => {
  assert.match(prePushSrc, /JWT_EXPIRES_IN/);
});
