const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const {
  normalizeOptionalDate,
  latestPortalDecision,
} = require('./portalCorrectness');

test('normalizeOptionalDate turns blank UI values into null', () => {
  assert.equal(normalizeOptionalDate(''), null);
  assert.equal(normalizeOptionalDate('   '), null);
  assert.equal(normalizeOptionalDate(null), null);
  assert.equal(normalizeOptionalDate(undefined), null);
  assert.equal(normalizeOptionalDate('2026-07-29'), '2026-07-29');
});

test('latestPortalDecision uses the newest approve/revision only', () => {
  const pending = latestPortalDecision([
    { event_type: 'login', created_at: '2026-01-01' },
  ]);
  assert.equal(pending.approved, false);
  assert.equal(pending.revisionRequested, false);

  const approvedThenRevised = latestPortalDecision([
    { event_type: 'approve', created_at: '2026-01-01T10:00:00Z' },
    {
      event_type: 'revision_requested',
      created_at: '2026-01-02T10:00:00Z',
      payload: { comment: 'Please revise hero' },
    },
  ]);
  assert.equal(approvedThenRevised.approved, false);
  assert.equal(approvedThenRevised.revisionRequested, true);
  assert.equal(approvedThenRevised.revisionNotes, 'Please revise hero');
  assert.equal(approvedThenRevised.approvedAt, null);

  const revisedThenApproved = latestPortalDecision([
    {
      event_type: 'revision_requested',
      created_at: '2026-01-01T10:00:00Z',
      payload: { comment: 'old' },
    },
    { event_type: 'approve', created_at: '2026-01-03T10:00:00Z' },
  ]);
  assert.equal(revisedThenApproved.approved, true);
  assert.equal(revisedThenApproved.revisionRequested, false);
  assert.equal(revisedThenApproved.approvedAt, '2026-01-03T10:00:00Z');
  assert.equal(revisedThenApproved.revisionNotes, null);
});

test('tasks create normalizes blank due_date', () => {
  const tasksSrc = readFileSync(path.resolve(__dirname, '../routes/tasks.js'), 'utf8');
  assert.match(tasksSrc, /normalizeOptionalDate/);
  assert.doesNotMatch(
    tasksSrc.slice(tasksSrc.indexOf("router.post('/')"), tasksSrc.indexOf("router.patch('/:id'")),
    /due_date\]\s*\)/
  );
});

test('portal create rejects blank passwords', () => {
  const portalsSrc = readFileSync(path.resolve(__dirname, '../routes/portals.js'), 'utf8');
  const createHandler = portalsSrc.slice(
    portalsSrc.indexOf('// Admin: create portal for a client'),
    portalsSrc.indexOf('// Admin: update portal content')
  );
  assert.match(createHandler, /Password is required/);
  assert.match(createHandler, /trimmedPassword/);
});

test('analytics uses latestPortalDecision helper', () => {
  const portalsSrc = readFileSync(path.resolve(__dirname, '../routes/portals.js'), 'utf8');
  assert.match(portalsSrc, /latestPortalDecision/);
  assert.doesNotMatch(
    portalsSrc.slice(
      portalsSrc.indexOf("router.get('/:id/analytics'"),
      portalsSrc.indexOf("router.post('/:id/events'")
    ),
    /events\.find\(\s*e\s*=>\s*e\.event_type === 'approve'/
  );
});

test('pg pool registers an error listener', () => {
  const dbSrc = readFileSync(path.resolve(__dirname, '../config/db.js'), 'utf8');
  assert.match(dbSrc, /pool\.on\(\s*['\"]error['\"]/);
});
