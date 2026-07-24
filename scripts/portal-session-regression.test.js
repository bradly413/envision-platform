const assert = require('node:assert/strict');
const test = require('node:test');

test('portal session route is registered before the dynamic admin route', () => {
  const router = require('../backend/src/routes/portals');
  const routePaths = router.stack
    .filter((layer) => layer.route)
    .map((layer) => layer.route.path);

  assert.ok(
    routePaths.indexOf('/session/current') < routePaths.indexOf('/:id'),
    'Express would otherwise handle /session/current as the admin-only /:id route'
  );
});
