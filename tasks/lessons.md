# Envision Platform — Lessons Learned

## Session Log
Record what went wrong or unexpected in each Claude Code session so it doesn't repeat.

---

### Session 1 — Initial Setup
- Date: March 30, 2026
- Notes: First Claude Code setup. Created CLAUDE.md, hooks, and task tracking files.

### Session — Critical bug hunt 2026-07-29
- `track.event` must not `.catch(() => {})` for approve/revision — silent failures fake client decisions.
- Portal create must reject blank passwords; bcrypt happily hashes `''`.
- Admin task forms send `due_date: ''`; normalize to `null` before PG DATE insert.
- Builder `approveAndBuild` must not pass low `maxTokens` — backend MODE_TOKEN_DEFAULTS are mode-aware (up to 24k for cinematic-code).
- Portal analytics must use latest approve/revision, not first-ever approval.
- Always attach `pool.on('error')` for Railway Postgres idle disconnects.
