const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const test = require('node:test');

test('portal events require authenticated portalId to match route id', () => {
  const portalsSrc = readFileSync(
    path.resolve(__dirname, '../backend/src/routes/portals.js'),
    'utf8'
  );

  const eventsHandler = portalsSrc.slice(
    portalsSrc.indexOf("router.post('/:id/events'"),
    portalsSrc.indexOf("router.get('/session/current'")
  );

  assert.match(
    eventsHandler,
    /req\.portal\.portalId\s*!==\s*req\.params\.id/
  );
  assert.match(
    eventsHandler,
    /INSERT INTO portal_events[\s\S]*req\.portal\.portalId/
  );
  assert.doesNotMatch(
    eventsHandler,
    /INSERT INTO portal_events[\s\S]*req\.params\.id/
  );
});
