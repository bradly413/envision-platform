# Envision Platform — Lessons Learned

## Session Log
Record what went wrong or unexpected in each Claude Code session so it doesn't repeat.

---

### Session 1 — Initial Setup
- Date: March 30, 2026
- Notes: First Claude Code setup. Created CLAUDE.md, hooks, and task tracking files.

### 2026-07-31 — Critical bug hunt
- Admin dashboard had no `public/_redirects` / `netlify.toml` while using `BrowserRouter`. Live production returned 404 for `/login`, `/pipeline`, `/portals`, `/portal-editor`. Client portal already had SPA fallback — keep both sites in parity.
- Vite copies `public/` into `dist/`; Netlify SPA rule must ship as `/* /index.html 200`.
- Do not treat Jazz STL static `/jazz-stl` as an ungated bug without explicit instruction — `_redirects` comment marks it intentional deliverable routing.
