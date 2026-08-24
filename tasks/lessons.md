# Envision Platform — Lessons Learned

## Session Log
Record what went wrong or unexpected in each Claude Code session so it doesn't repeat.

---

### Session 1 — Initial Setup
- Date: March 30, 2026
- Notes: First Claude Code setup. Created CLAUDE.md, hooks, and task tracking files.

### Session — Critical bug hunt 2026-08-24
- `portals.plain_password` is written on every create/password PATCH but was missing from `schema.sql`. Fresh DBs 500 on portal create. Runtime `ADD COLUMN IF NOT EXISTS` is required because editing CREATE TABLE does not migrate Railway.
- Client create UI treats email as optional (`name` only required) while `clients.email` was `UNIQUE NOT NULL`. Empty string hits UNIQUE on the second lead; `null` from PortalsPage hits NOT NULL on the first. Normalize blanks to SQL NULL and drop NOT NULL.
- `ensureSchema()` must be awaited before `app.listen` so the first request cannot race the ALTER.
- `pre-push-check.js` must emit JSON on stdout (human logs on stderr) or Cursor shell hooks block every command.
