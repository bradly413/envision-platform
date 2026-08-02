const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

// Mirror of admin-dashboard/src/lib/publishStatus.js (ESM) for Node's CJS test runner.
function resolvePublishStatus(deployStatus) {
  return deployStatus === 'archived' ? 'archived' : 'active';
}

function defaultDeployStatus(portalStatus) {
  return portalStatus === 'archived' ? 'archived' : 'active';
}

test('publish status never leaves a portal in draft', () => {
  assert.equal(resolvePublishStatus('draft'), 'active');
  assert.equal(resolvePublishStatus('active'), 'active');
  assert.equal(resolvePublishStatus(undefined), 'active');
  assert.equal(resolvePublishStatus(''), 'active');
  assert.equal(resolvePublishStatus('archived'), 'archived');
});

test('deploy panel defaults draft portals to active', () => {
  assert.equal(defaultDeployStatus('draft'), 'active');
  assert.equal(defaultDeployStatus(undefined), 'active');
  assert.equal(defaultDeployStatus('active'), 'active');
  assert.equal(defaultDeployStatus('archived'), 'archived');
});

test('portal create INSERT sets status active for client handoff', () => {
  const src = fs.readFileSync(
    path.join(__dirname, '../backend/src/routes/portals.js'),
    'utf8'
  );
  assert.match(
    src,
    /INSERT INTO portals \([^;]*\bstatus\b[^;]*\) VALUES \([^;]*'active'[^;]*\)/
  );
});

test('builder publish path uses resolvePublishStatus helper', () => {
  const page = fs.readFileSync(
    path.join(__dirname, '../admin-dashboard/src/pages/PortalEditorV2Page.jsx'),
    'utf8'
  );
  const helper = fs.readFileSync(
    path.join(__dirname, '../admin-dashboard/src/lib/publishStatus.js'),
    'utf8'
  );

  assert.match(page, /from ['"]\.\.\/lib\/publishStatus['"]/);
  assert.match(page, /resolvePublishStatus\(/);
  assert.match(page, /defaultDeployStatus\(/);
  assert.match(helper, /deployStatus === 'archived' \? 'archived' : 'active'/);
  assert.doesNotMatch(page, /status:\s*deployStatus\s*\|\|\s*'active'/);
  assert.doesNotMatch(
    page,
    /setDeployStatus\(selectedPortalRecord\?\.status\s*\|\|\s*'active'\)/
  );
});
