# Envision Platform — Lessons Learned

## Session Log
Record what went wrong or unexpected in each Claude Code session so it doesn't repeat.

---

### Session 1 — Initial Setup
- Date: March 30, 2026
- Notes: First Claude Code setup. Created CLAUDE.md, hooks, and task tracking files.

### Critical bug automation — Portal PATCH merge
- Date: June 25, 2026
- Notes: `PATCH /api/portals/:id` must merge `content` into the existing JSONB column; replacing it can wipe live portal sections. Shell validation was blocked because the configured `node scripts/pre-push-check.js` hook emitted non-JSON before commands ran.
