# Envision Platform — Lessons Learned

## Session Log
Record what went wrong or unexpected in each Claude Code session so it doesn't repeat.

---

### Session 1 — Initial Setup
- Date: March 30, 2026
- Notes: First Claude Code setup. Created CLAUDE.md, hooks, and task tracking files.

### 2026-08-05 — Provider truncation must hard-fail
- Provider helpers previously returned only text and discarded `stop_reason` / `finish_reason` / `finishReason`.
- With frontend `maxTokens` overrides of 1800–2600 (still on main until PR #18 merges), Approve & Build frequently hit the ceiling and still returned `structured` success from a partial reply.
- Always surface truncation before JSON/code extraction; never publish truncated provider output as a completed build.
- `scripts/pre-push-check.js` must emit JSON on stdout (human logs on stderr) or Cursor shell hooks block every command.
