const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const test = require('node:test');

test('decision track events are not silently swallowed', () => {
  const apiSrc = readFileSync(
    path.resolve(__dirname, '../client-portal/src/lib/api.js'),
    'utf8'
  );

  assert.match(apiSrc, /SILENT_TRACK_EVENTS/);
  assert.match(apiSrc, /approve|revision_requested/);
  // Global silent catch on every event must not remain.
  assert.doesNotMatch(
    apiSrc,
    /api\.post\(`\/portals\/\$\{portalId\}\/events`[\s\S]*?\)\.catch\(\(\)\s*=>\s*\{\}\)/
  );
});

test('ApprovalSection only marks submitted after a successful track call', () => {
  const approvalSrc = readFileSync(
    path.resolve(__dirname, '../client-portal/src/components/Approval/ApprovalSection.jsx'),
    'utf8'
  );

  assert.match(approvalSrc, /setSubmitError/);
  assert.match(approvalSrc, /Approval could not be sent/);
  assert.match(approvalSrc, /Feedback could not be sent/);
  assert.match(approvalSrc, /try\s*\{[\s\S]*track\.event\(portalId,\s*'approve'/);
  assert.match(approvalSrc, /try\s*\{[\s\S]*track\.event\(portalId,\s*'revision_requested'/);
});

test('builder approveAndBuild does not override mode token budgets', () => {
  const editorSrc = readFileSync(
    path.resolve(__dirname, '../admin-dashboard/src/pages/PortalEditorV2Page.jsx'),
    'utf8'
  );

  const start = editorSrc.indexOf('const approveAndBuild = async');
  assert.ok(start >= 0, 'approveAndBuild not found');
  const buildFn = editorSrc.slice(start, start + 4500);
  const genIdx = buildFn.indexOf('ai.generateBuilderContent');
  assert.ok(genIdx >= 0, 'generateBuilderContent call missing in approveAndBuild');
  const generateCall = buildFn.slice(genIdx, genIdx + 700);

  assert.doesNotMatch(generateCall, /maxTokens\s*:/);
  assert.doesNotMatch(generateCall, /1800/);
  assert.doesNotMatch(generateCall, /2400/);
});

test('portal create UI requires a non-empty password', () => {
  const portalsPage = readFileSync(
    path.resolve(__dirname, '../admin-dashboard/src/pages/PortalsPage.jsx'),
    'utf8'
  );
  assert.match(portalsPage, /form\.password\.trim\(\)/);
});
