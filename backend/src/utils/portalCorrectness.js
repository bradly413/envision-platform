/**
 * Normalize optional date fields from admin UI forms.
 * Empty strings must become null — PostgreSQL DATE rejects ''.
 */
function normalizeOptionalDate(value) {
  if (value === undefined || value === null || String(value).trim() === '') {
    return null;
  }
  return value;
}

/**
 * Derive mutually exclusive portal decision from an ASC-ordered event list.
 * Latest approve/revision_requested wins so a later revision clears approval.
 */
function latestPortalDecision(events = []) {
  const decisionEvents = events.filter(
    (e) => e.event_type === 'approve' || e.event_type === 'revision_requested'
  );
  const latest = decisionEvents[decisionEvents.length - 1] || null;
  const approvalEvent = latest?.event_type === 'approve' ? latest : null;
  const revisionEvent = latest?.event_type === 'revision_requested' ? latest : null;
  return {
    approved: !!approvalEvent,
    approvedAt: approvalEvent?.created_at || null,
    revisionRequested: !!revisionEvent,
    revisionNotes: revisionEvent?.payload?.comment || null,
    revisionAt: revisionEvent?.created_at || null,
  };
}

module.exports = {
  normalizeOptionalDate,
  latestPortalDecision,
};
