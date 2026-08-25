# Envision Platform — Lessons Learned

## Session Log
Record what went wrong or unexpected in each Claude Code session so it doesn't repeat.

---

### Session 1 — Initial Setup
- Date: March 30, 2026
- Notes: First Claude Code setup. Created CLAUDE.md, hooks, and task tracking files.

### Session — 2026-08-25 critical bug hunt
- Builder file attach used unbounded `readAsDataURL` (including videos) and the reference library persisted those data URLs into localStorage. That OOMs the tab on a typical client video and fills the origin quota so Zustand cannot persist `envision-admin-auth`.
- Fix: inline only images ≤1MB; strip `data:` URLs on library save/load; cap persisted library JSON at 1MB. Do not re-open PRs #7–#25 for bugs they already cover.
