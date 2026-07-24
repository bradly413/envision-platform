const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const { requireAdmin } = require('./auth');

const JWT_SECRET = 'auth-middleware-test-secret';

function invoke(token) {
  const result = { status: null, body: null, nextCalled: false };
  const req = {
    headers: token ? { authorization: `Bearer ${token}` } : {},
  };
  const res = {
    status(code) {
      result.status = code;
      return this;
    },
    json(body) {
      result.body = body;
      return this;
    },
  };

  requireAdmin(req, res, () => {
    result.nextCalled = true;
  });

  return { req, result };
}

test.before(() => {
  process.env.JWT_SECRET = JWT_SECRET;
});

test('requireAdmin accepts an admin token', () => {
  const token = jwt.sign(
    { id: 'admin-id', email: 'admin@example.com', role: 'admin' },
    JWT_SECRET
  );

  const { req, result } = invoke(token);

  assert.equal(result.nextCalled, true);
  assert.equal(result.status, null);
  assert.equal(req.user.role, 'admin');
});

test('requireAdmin rejects a valid portal token', () => {
  const token = jwt.sign(
    { portalId: 'portal-id', slug: 'client-portal', clientId: 'client-id' },
    JWT_SECRET
  );

  const { req, result } = invoke(token);

  assert.equal(result.nextCalled, false);
  assert.equal(result.status, 403);
  assert.deepEqual(result.body, { error: 'Admin access required' });
  assert.equal(req.user, undefined);
});

test('requireAdmin rejects an invalid token', () => {
  const { result } = invoke('not-a-valid-token');

  assert.equal(result.nextCalled, false);
  assert.equal(result.status, 401);
  assert.deepEqual(result.body, { error: 'Invalid token' });
});
