# Envision Platform — Lessons Learned

## Session Log
Record what went wrong or unexpected in each Claude Code session so it doesn't repeat.

---

### Session 1 — Initial Setup
- Date: March 30, 2026
- Notes: First Claude Code setup. Created CLAUDE.md, hooks, and task tracking files.

### Session — Critical bug hunt (2026-08-02)
- **FIXED:** Portal `POST /` omitted `status` (schema default `draft`) while login requires `active`; builder Publish inherited draft via `deployStatus || 'active'` and still claimed “sent live”. Deploy-form effect also reset Active/password on every `plan`/`normalizedPreview` change.
  - Fix: INSERT `status='active'`; `resolvePublishStatus` / `defaultDeployStatus`; narrow deploy-form effect deps to portal/client only.
- Still open (not fixed this PR): `extractStructuredJson` accepts nested fragments when outer JSON is truncated; `repairStructuredResponse` hardcodes `maxTokens: 2200`; provider helpers ignore `stop_reason`/`finish_reason`; unbounded builder media `readAsDataURL`.
- Do not re-open bugs already covered by open draft PRs #6–#21.
