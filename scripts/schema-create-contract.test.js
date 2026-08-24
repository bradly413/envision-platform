const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('path');
const { normalizeOptionalEmail } = require('../backend/src/utils/optionalEmail');

const schemaSql = readFileSync(
  path.resolve(__dirname, '../backend/src/config/schema.sql'),
  'utf8'
);
const dbSrc = readFileSync(
  path.resolve(__dirname, '../backend/src/config/db.js'),
  'utf8'
);
const portalsSrc = readFileSync(
  path.resolve(__dirname, '../backend/src/routes/portals.js'),
  'utf8'
);
const clientsSrc = readFileSync(
  path.resolve(__dirname, '../backend/src/routes/clients.js'),
  'utf8'
);
const indexSrc = readFileSync(
  path.resolve(__dirname, '../backend/src/index.js'),
  'utf8'
);

test('normalizeOptionalEmail turns blank UI values into SQL null', () => {
  assert.equal(normalizeOptionalEmail(''), null);
  assert.equal(normalizeOptionalEmail('   '), null);
  assert.equal(normalizeOptionalEmail(null), null);
  assert.equal(normalizeOptionalEmail(undefined), null);
  assert.equal(normalizeOptionalEmail('lead@example.com'), 'lead@example.com');
  assert.equal(normalizeOptionalEmail('  lead@example.com  '), 'lead@example.com');
});

test('schema.sql defines portals.plain_password used by create/update', () => {
  const portalsTable = schemaSql.slice(
    schemaSql.indexOf('CREATE TABLE portals'),
    schemaSql.indexOf('CREATE TABLE portal_events')
  );
  assert.match(portalsTable, /plain_password\s+VARCHAR\(255\)/);

  const createHandler = portalsSrc.slice(
    portalsSrc.indexOf('// Admin: create portal for a client'),
    portalsSrc.indexOf('// Admin: update portal content')
  );
  assert.match(createHandler, /plain_password/);
  assert.match(portalsSrc, /plain_password = \$/);
});

test('schema.sql allows clients.email to be omitted', () => {
  const clientsTable = schemaSql.slice(
    schemaSql.indexOf('CREATE TABLE clients'),
    schemaSql.indexOf('CREATE TABLE portals')
  );
  assert.match(clientsTable, /email\s+VARCHAR\(255\)\s+UNIQUE/);
  assert.doesNotMatch(clientsTable, /email\s+VARCHAR\(255\)\s+UNIQUE\s+NOT NULL/);
});

test('startup ensureSchema backfills live databases', () => {
  assert.match(dbSrc, /ADD COLUMN IF NOT EXISTS plain_password/);
  assert.match(dbSrc, /ALTER COLUMN email DROP NOT NULL/);
  assert.match(dbSrc, /SET email = NULL WHERE email = ''/);
  assert.match(indexSrc, /await db\.ensureSchema\(\)/);
});

test('client create persists normalized optional email', () => {
  assert.match(clientsSrc, /normalizeOptionalEmail\(email\)/);
  assert.match(clientsSrc, /require\('\.\.\/utils\/optionalEmail'\)/);
});
