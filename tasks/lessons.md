# Envision Platform — Lessons Learned

## Session Log
Record what went wrong or unexpected in each Claude Code session so it doesn't repeat.

---

### Session 1 — Initial Setup
- Date: March 30, 2026
- Notes: First Claude Code setup. Created CLAUDE.md, hooks, and task tracking files.

### Portal session refresh regression
- Date: June 14, 2026
- Notes: If portal content is omitted from persisted Zustand state to avoid localStorage overflow, the client must rehydrate it from a reachable portal-authenticated API before rendering. Register static Express routes like `/session/current` before dynamic `/:id` routes so they are not shadowed.
