# Envision Platform — Lessons Learned

## Session Log
Record what went wrong or unexpected in each Claude Code session so it doesn't repeat.

---

### Session 1 — Initial Setup
- Date: March 30, 2026
- Notes: First Claude Code setup. Created CLAUDE.md, hooks, and task tracking files.

### Critical bug investigation — Builder portal targeting
- Date: July 20, 2026
- A prompt-first builder redesign removed the portal selector while leaving automatic first-portal selection and destructive publish behavior in place.
- Any workflow that writes portal content must expose the exact target and invalidate generated output when that client or portal target changes.
