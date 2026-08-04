# Envision Platform — Lessons Learned

## Session Log
Record what went wrong or unexpected in each Claude Code session so it doesn't repeat.

---

### Session 1 — Initial Setup
- Date: March 30, 2026
- Notes: First Claude Code setup. Created CLAUDE.md, hooks, and task tracking files.

### Session — Critical bug hunt (2026-08-04)
- **FIXED:** Truncated builder AI JSON was accepted as a complete structured build. `extractStructuredJson` / frontend `extractJSON` returned the longest balanced nested object (e.g. `{"title":"..."}` from inside `hero`) when the outer payload was cut off, so repair never ran and the builder published a fragment.
  - Fix: mode-aware contract validation (`hero`+sibling sections / `presentation.slides` / `cinematicFlow.scenes`); repair now uses `max(maxTokens, 8192)` instead of a hard `2200` cap.
- Still open: provider helpers ignore `stop_reason`/`finish_reason`; unbounded builder media `readAsDataURL`; `plain_password` used in routes but missing from `schema.sql` (prod may already have the column); other bugs covered by open draft PRs #6–#22.
- Shell hook: keep `scripts/pre-push-check.js` emitting JSON on stdout / logs on stderr locally until PR #21 merges.
- Do not re-open bugs already covered by open draft PRs #6–#22.

