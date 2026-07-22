# Envision Platform — Lessons Learned

## Session Log
Record what went wrong or unexpected in each Claude Code session so it doesn't repeat.

---

### Session 1 — Initial Setup
- Date: March 30, 2026
- Notes: First Claude Code setup. Created CLAUDE.md, hooks, and task tracking files.

### Session 2 — JWT Authorization Boundary
- Date: July 22, 2026
- Notes: JWT signature verification alone is not authorization when admin and portal sessions share a secret. Admin middleware must require the admin role claim so portal tokens cannot access agency APIs.
