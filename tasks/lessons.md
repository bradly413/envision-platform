# Envision Platform — Lessons Learned

## Session Log
Record what went wrong or unexpected in each Claude Code session so it doesn't repeat.

---

### Session 1 — Initial Setup
- Date: March 30, 2026
- Notes: First Claude Code setup. Created CLAUDE.md, hooks, and task tracking files.

### Session 2 — Client Portal Session and HTML Isolation
- Date: July 19, 2026
- Portal content omitted from persisted Zustand state must be restored from the authenticated session endpoint before rendering after a refresh.
- Never combine `allow-scripts` and `allow-same-origin` for uploaded `srcDoc` HTML on the authenticated portal origin; it exposes parent DOM and localStorage tokens.
