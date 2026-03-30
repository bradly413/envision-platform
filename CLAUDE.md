# Envision Platform

## Stack
- Frontend: React + Vite (admin at envisiondash.netlify.app, portal at envision-portal.netlify.app)
- Backend: Node/Express on Railway (envision-platform-production.up.railway.app)
- DB: PostgreSQL on Railway (project: lucky-transformation)
- Media: Cloudinary (cloud: djolmpivc)
- AI: Anthropic API for portal generation

## Key Commands
- Admin dev: `cd admin-dashboard && npm run dev`
- Backend dev: `cd backend && node src/index.js`
- Deploy: push to main → Railway/Netlify auto-deploy
- Pre-push check: run safety script before every push

## Architecture Rules
- Backend routes live in backend/src/routes/
- Never wipe portal `content` field on PATCH — always merge
- JWT_SECRET must exist in Railway env vars before touching auth
- SPA routing: netlify.toml handles redirects — don't touch without testing

## Aesthetic Standards (Portal Generator)
- Cinematic dark — no light modes, no generic AI UI
- Three.js/WebGL for hero scenes, GSAP for transitions
- Reference quality: Active Theory, Awwwards top sites
- Portal AI system prompt is in backend/src/prompts/ — edit there, not inline

## What NOT to Do
- Never commit secrets or API keys
- Never use CommonJS require() — ES modules only
- Never add Railway env vars in code — Railway dashboard only
- Don't touch Jazz STL portal WebGL without explicit instruction
