# Envision Portal Working Setup

## Live URLs
- Client portal: https://envision-portal.netlify.app
- Backend API: https://envision-platform-production.up.railway.app
- Backend health check: https://envision-platform-production.up.railway.app/health

## Local Repo Paths
- Main repo: /Users/bradnichols/Downloads/envision-platform
- Admin dashboard: /Users/bradnichols/Downloads/envision-platform/admin-dashboard
- Backend: /Users/bradnichols/Downloads/envision-platform/backend

## What's Working Now
- https://envision-portal.netlify.app/ redirects to /login
- Jazz login redirects to /jazz-stl
- Jazz cinematic portal is restored
- Local admin dashboard works at http://localhost:3001
- Local admin can talk to Railway backend because backend CORS now allows http://localhost:3001

## Important Code State
- client-portal/src/App.jsx includes root redirect to /login
- client-portal/src/pages/LoginPage.jsx redirects Jazz to /jazz-stl
- client-portal/public/jazz-stl.html uses restored working cinematic HTML
- backend/src/index.js CORS allows http://localhost:3001

## Run Admin Locally
```bash
cd /Users/bradnichols/Downloads/envision-platform/admin-dashboard
npm run dev -- --host --port 3001
```

## If Admin Login Breaks Again
1. Confirm backend health:
   https://envision-platform-production.up.railway.app/health
2. Confirm admin is running from the real repo path, not the bundle folder.
3. Confirm backend CORS in backend/src/index.js still includes:

```js
origin: [process.env.ADMIN_URL, process.env.PORTAL_URL, 'http://localhost:3001'],
```

## Last Important Backend Commit
- 9b82f412 — allow local admin dashboard origin in CORS
