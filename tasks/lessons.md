# Envision Platform — Lessons Learned

## Session Log
Record what went wrong or unexpected in each Claude Code session so it doesn't repeat.

---

### Session 1 — Initial Setup
- Date: March 30, 2026
- Notes: First Claude Code setup. Created CLAUDE.md, hooks, and task tracking files.

### Session — Critical bug hunt 2026-07-30
- Builder workspace cache must never persist `plain_password` / `password_hash` / full `content` — strip on write and read; clear on logout.
- Frontend `maxTokens` overrides on builder **patch** (not only approveAndBuild) truncate full-JSON revisions and can publish incomplete portals — omit so backend MODE_TOKEN_DEFAULTS apply.
- Cursor PreToolUse hook running `pre-push-check.js` requires JSON stdout; human-readable check output blocks all shell — keep real check as separate script for push validation.
