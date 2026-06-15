# Envision Platform — Lessons Learned

## Session Log
Record what went wrong or unexpected in each Claude Code session so it doesn't repeat.

---

### Session 1 — Initial Setup
- Date: March 30, 2026
- Notes: First Claude Code setup. Created CLAUDE.md, hooks, and task tracking files.

### Portal HTML Upload Safety
- Date: June 15, 2026
- Notes: Partial portal content updates must merge into the existing JSONB document so uploads do not erase generated sections or metadata. Uploaded iframe HTML must not combine `allow-scripts` with `allow-same-origin`, or scripts can inherit portal-origin access.
