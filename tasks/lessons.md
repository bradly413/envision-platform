# Envision Platform — Lessons Learned

## Session Log
Record what went wrong or unexpected in each Claude Code session so it doesn't repeat.

---

### Session 1 — Initial Setup
- Date: March 30, 2026
- Notes: First Claude Code setup. Created CLAUDE.md, hooks, and task tracking files.

### Session — Critical bug hunt (2026-08-02)
- `extractStructuredJson` / frontend `extractJSON` accept any balanced nested object when the outer JSON is truncated — can return a `brand`/`hero` fragment as the full structured build.
- Backend `repairStructuredResponse` hardcodes `maxTokens: 2200` even when mode defaults are 12k–24k; repair after a near-complete failure systematically truncates.
- Provider helpers never check `stop_reason` / `finish_reason`, so truncated model output is treated as success and fed into the fragment parser.
- Portal `POST /` never sets `status`, so creates stay `draft` while login requires `active` — Send/Open can hand clients a 403 portal.

### Session — Frontend critical bug hunt (2026-08-02)
- Builder publish can keep `status: draft` while UI claims “sent live”; deploy-panel effect also resets Active/password/slug whenever `plan`/`normalizedPreview` changes.
- Builder attachment path reads full image/video files as data URLs with no size cap → tab memory bomb.
- Do not re-report exclusion-list items (session restore, sandbox XSS, portals[0], maxTokens truncation, etc.).
