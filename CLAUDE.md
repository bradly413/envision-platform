# Envision Platform — Claude Code Context

## Project Overview
Solo-operated creative agency platform built by Brad Nichols (Bradley Robert Creative / Envision Creative).
Two-pillar product: Agency OS (admin dashboard) + cinematic client portal deliverable.
Highest-priority product. Treat every decision at senior developer standard.

## Repo Structure
```
envision-platform/
├── admin-dashboard/        # React + Vite — Agency OS frontend
├── backend/                # Node/Express API
│   ├── src/
│   │   ├── routes/         # All Express routes live here
│   │   ├── config/         # DB config, schema, migrations
│   │   └── prompts/        # Portal AI system prompts — edit here only
├── client-portal/          # Separate React app — client-facing portal viewer
├── tasks/
│   ├── todo.md             # Active task list — read this at session start
│   └── lessons.md          # Accumulated corrections — read before making decisions
└── scripts/
    └── pre-push-check.js   # Safety script — run before every push
```

## Live Infrastructure
- **Admin dashboard:** `envisiondash.netlify.app`
- **Client portal:** `envision-portal.netlify.app`
- **Backend API:** `envision-platform-production.up.railway.app`
- **Railway project:** `lucky-transformation`
- **Database:** PostgreSQL on Railway
- **Media/Video:** Cloudinary — cloud name `djolmpivc`
- **AI:** Anthropic API — portal generation feature
- **GitHub:** `github.com/bradly413/envision-platform`

## Key Commands
```bash
# Admin frontend
cd admin-dashboard && npm run dev

# Backend
cd backend && node src/index.js

# Pre-push safety check (ALWAYS run before pushing)
node scripts/pre-push-check.js

# Deploy: push to main — Railway and Netlify auto-deploy
git push origin main
```

## Stack
- **Frontend:** React + Vite — ES modules (`import/export`) only
- **Backend:** Node/Express — CommonJS (`require()`) only
- **Database:** PostgreSQL (Railway-managed)
- **Hosting:** Netlify (frontend SPAs) + Railway (backend + DB)
- **Motion/3D:** Three.js, WebGL, GSAP ScrollTrigger
- **State:** Zustand (watch for localStorage overflow — known failure mode)
- **Auth:** JWT — secret must exist in Railway env vars before touching auth code

## Architecture Rules — READ BEFORE EDITING
- All backend routes live in `backend/src/routes/` — register new routes in `backend/src/index.js`
- **NEVER wipe the portal `content` field on PATCH** — always merge, never replace wholesale
- SPA routing handled by `netlify.toml` redirects — do not remove or modify without testing login/portal flows
- JWT_SECRET and all secrets live in Railway dashboard only — never in code or committed files
- Cloudinary uploads go through the backend — never expose API keys to the client
- Portal AI system prompt lives in `backend/src/prompts/` — edit there, never inline in route handlers
- **Backend uses CommonJS (`require()`)** — Frontend (admin-dashboard, client-portal) uses ES modules (`import/export`) only. Never mix them within the same app.
- bcrypt hash mismatches have caused silent auth failures before — always verify hash rounds match on password changes

## Known Failure Modes (Read Before Debugging)
1. **Zustand + localStorage overflow** → silent login failures on admin dashboard. Clear localStorage and check store size if auth mysteriously breaks.
2. **bcrypt hash mismatch** → password changes must re-hash with matching rounds. Check `backend/src/config/` for the bcrypt round constant.
3. **Express route registration gaps** → new route files must be explicitly registered in `src/index.js`. Claude Code will miss this if not reminded.
4. **SPA routing on Netlify** → `netlify.toml` must have `[[redirects]] from="/*" to="/index.html" status=200` for both admin and portal sites.
5. **CORS misconfiguration** → backend CORS must whitelist both Netlify URLs. Check `backend/src/index.js` CORS config when adding new frontend origins.
6. **Railway env var sync** → Railway and Netlify env vars can drift. Verify parity when deploy succeeds but runtime fails.

## Portal Generation — Aesthetic Standards (CRITICAL)
Envision portals are cinematic, high-craft WebGL experiences. Hold every generated portal to this bar:

- **Dark background always** — no light modes, no white/grey UI defaults
- **Three.js/WebGL** for hero and immersive scenes
- **GSAP ScrollTrigger** for scroll-driven motion
- **Custom cursor** — standard browser cursor is not acceptable
- **Particle systems** where atmospherically appropriate
- **Editorial typography** — large, confident type with motion reveals
- **Reference quality:** Active Theory, Awwwards top sites, not generic SaaS templates
- **Video:** hosted on Cloudinary, embedded via HLS or direct MP4 — never YouTube embeds

When generating or modifying portal AI output, read `backend/src/prompts/` first. Never soften the cinematic standard to make something "easier."

## Jazz STL Portal — Special Handling
The Jazz St. Louis portal (`jazz_portal_bundle`) is a live client deliverable:
- 7MB Three.js/WebGL experience with particle effects, scroll scenes, embedded Cloudinary video
- **Do not touch the WebGL scene code without explicit instruction**
- Real client photography is embedded as 3D planes — do not remove or replace assets
- Portal is deployed and client-visible — treat as production

## Task Management Protocol
At the start of every session:
1. Read `tasks/todo.md` — pick up where we left off
2. Read `tasks/lessons.md` — avoid repeating past mistakes
3. Confirm the active task before writing any code

At the end of every session:
1. Mark completed items in `tasks/todo.md`
2. Add any corrections or new lessons to `tasks/lessons.md`
3. Write a brief summary of what changed and why

## Core Principles
- **Simplicity first** — make every change as minimal as possible. Delete lines over adding them when possible.
- **Root causes only** — no band-aids, no temporary fixes. Find why something broke.
- **Minimal impact** — only touch what's necessary. Do not introduce side effects or refactor adjacent code unless asked.
- **Pre-push check always** — run `scripts/pre-push-check.js` before every push. This catches backend syntax errors before Railway sees them.
- **Never commit secrets** — API keys, JWT secrets, DB URLs stay in Railway/Netlify dashboards only.

## What NOT to Do
- Do not use `require()` in the frontend — ES modules only in admin-dashboard and client-portal
- Do not add secrets or API keys to any committed file
- Do not modify Railway environment variables in code — Railway dashboard only
- Do not touch Jazz STL WebGL code without explicit instruction
- Do not replace entire files when a targeted edit will do
- Do not start implementing before confirming the plan
- Do not run the full test suite when a single targeted test will do
