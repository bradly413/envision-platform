# Envision Platform — Lessons Learned

## Session Log
Record what went wrong or unexpected in each Claude Code session so it doesn't repeat.

---

### Session 1 — Initial Setup
- Date: March 30, 2026
- Notes: First Claude Code setup. Created CLAUDE.md, hooks, and task tracking files.

### Session — Critical bug investigation (2026-07-24)
- Portal and admin JWTs share `JWT_SECRET`; `requireAdmin` must require `role === 'admin'` or portal tokens can call admin APIs.
- Persisting portal auth with `content: null` requires a `/session/current` restore before `/present`, or returning clients render empty.
- Uploaded HTML iframes must never combine `allow-scripts` with `allow-same-origin` on the authenticated portal origin.
- Builder must not auto-select the first portal; silent targeting can overwrite the wrong live record.
