# Envision Platform — Lessons Learned

## Session Log
Record what went wrong or unexpected in each Claude Code session so it doesn't repeat.

---

### Session 1 — Initial Setup
- Date: March 30, 2026
- Notes: First Claude Code setup. Created CLAUDE.md, hooks, and task tracking files.

### Critical portal regression audit
- Date: July 21, 2026
- Static Express routes such as `/session/current` must be registered before `/:id`, or the dynamic admin route shadows them.
- Persisted portal sessions intentionally omit large `content`; protected client routes must restore content from the authenticated session endpoint before rendering.
- Never combine `allow-scripts` and `allow-same-origin` on uploaded `srcDoc` HTML because it exposes the parent origin and persisted portal token.
