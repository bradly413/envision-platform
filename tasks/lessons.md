# Envision Platform — Lessons Learned

## Session Log
Record what went wrong or unexpected in each Claude Code session so it doesn't repeat.

---

### Session 1 — Initial Setup
- Date: March 30, 2026
- Notes: First Claude Code setup. Created CLAUDE.md, hooks, and task tracking files.

### Critical bug audit — 2026-07-28
- `PATCH /api/clients/:id` and `PATCH /api/tasks/:id` interpolated `Object.keys(req.body)` into SQL SET. Malicious keys (e.g. `"stage = 'archived'--"`) comment out WHERE and update all rows. Fix: allowlisted columns via `backend/src/utils/allowlistedPatch.js`.
- `POST /api/portals/:id/events` trusted `:id` without matching `req.portal.portalId` (unlike portal AI chat). Clients could forge approve/revision events on other portals. Fix: same portalId guard + insert using token portalId.
- Do not open duplicate PRs for bugs already covered by open draft PR #16 (auth bypass, session restore, HTML sandbox, builder targeting).
- Cursor shell hook runs `scripts/pre-push-check.js` and requires JSON stdout — human-readable check output blocks all shell. Never commit a dual-mode shim for that.
