# Envision Platform — Lessons Learned

## Session Log
Record what went wrong or unexpected in each Claude Code session so it doesn't repeat.

---

### Session 1 — Initial Setup
- Date: March 30, 2026
- Notes: First Claude Code setup. Created CLAUDE.md, hooks, and task tracking files.

### Automation hook compatibility
- Date: June 24, 2026
- Notes: Do not register `scripts/pre-push-check.js` as a global `PreToolUse` Bash hook. Its normal CLI output blocks shell tools that expect hook JSON; run it manually before pushes instead.
