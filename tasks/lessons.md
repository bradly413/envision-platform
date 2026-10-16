# Envision Platform — Lessons Learned

## Session Log
Record what went wrong or unexpected in each Claude Code session so it doesn't repeat.

---

### Session 1 — Initial Setup
- Date: March 30, 2026
- Notes: First Claude Code setup. Created CLAUDE.md, hooks, and task tracking files.

### Session 2 — Cloud agent environment
- Date: October 16, 2026
- The Bash hook in `.claude/settings.json` runs `scripts/pre-push-check.js` before every shell command. Cursor permission hooks fail closed unless stdout is JSON. Emit `{"permission":"allow"}` for ordinary commands, and run the syntax check only when the command is `git push`.
- `admin-dashboard` imports `html-to-image` from `PortalEditorV2Page.jsx`. Keep that package in `admin-dashboard/package.json` or `vite build` fails.
- Local Cloud Agent dev uses PostgreSQL on localhost, `backend/.env`, and `admin-dashboard/.env.local` so the admin app talks to the local API. The committed `admin-dashboard/.env` points at production.
