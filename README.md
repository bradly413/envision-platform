# Envision x Bradley Robert Creative — Platform

Full-stack platform with two apps: an internal admin dashboard and an exclusive client presentation portal.

## Structure

```
envision-platform/
├── backend/              Node.js + Express API
│   ├── src/
│   │   ├── routes/       auth, clients, portals, tasks, agents, analytics
│   │   ├── middleware/   JWT auth (admin + portal)
│   │   └── config/       PostgreSQL, schema.sql
│   └── .env.example
├── admin-dashboard/      React app (internal, port 3001)
│   └── src/
│       ├── pages/        Login, Dashboard, Pipeline, ClientDetail, Tasks, Agents, Portals
│       ├── components/   Layout, per-section components
│       └── lib/          Zustand store, Axios API client
├── client-portal/        React app (public, port 3002)
│   └── src/
│       ├── pages/        Login, Presentation
│       ├── components/   Hero, BrandSection, LogoSection, ColorSection, Typography, Approval
│       └── lib/          Store, API, analytics tracker
└── shared/types/         TypeScript types used across apps
```

## Tech stack

- **Backend**: Node.js · Express · PostgreSQL · JWT · Bcrypt
- **Admin**: React 18 · React Router v6 · React Query · Zustand · Framer Motion · Vite
- **Portal**: React 18 · Framer Motion · GSAP · react-intersection-observer · Swiper · Vite
- **AI**: Claude API (claude-sonnet-4-20250514) via backend agents route
- **Finance**: Plaid (reuse Cornell Hub serverless functions pattern)
- **Calendar/Gmail**: Google OAuth (same flow as Cornell Hub)

## Quick start

```bash
# 1. Clone and install
npm install --workspaces

# 2. Set up backend env
cp backend/.env.example backend/.env
# Fill in DATABASE_URL, JWT_SECRET, ANTHROPIC_API_KEY, etc.

# 3. Create the database
createdb envision_db
psql envision_db < backend/src/config/schema.sql

# 4. Run everything
npm run dev
# Backend: http://localhost:3000
# Admin:   http://localhost:3001
# Portal:  http://localhost:3002
```

## Key flows

### Creating a client portal
1. Admin creates a client in the pipeline
2. Go to Portals → Generate portal → pick client + set password
3. Backend creates a unique slug + hashed password in DB
4. Share the portal URL + password with the client
5. Analytics are tracked automatically as the client scrolls

### Portal content
All portal content is stored as JSONB in the `portals.content` column:
```json
{
  "hero": { "headline": "Acme, meet your brand." },
  "brand": { "positioning": "...", "pillars": [...] },
  "logo": { "logoUrl": "https://..." },
  "colors": { "palette": [{ "name": "Primary", "hex": "#1A1A2E", "role": "..." }] },
  "typography": { "fonts": [...] }
}
```
Update via `PATCH /api/portals/:id` from the admin dashboard.

### AI agents
Add new agents in `backend/src/routes/agents.js` by adding to the `PROMPTS` object.
Run from admin via `POST /api/agents/run` with `{ agent: 'agent-id', context: {} }`.

## What's stubbed (next to build)
- `routes/calendar.js` — Google Calendar OAuth + event sync
- `routes/finance.js` — Plaid link token + transaction fetch
- `CalendarPage.jsx` — calendar UI (copy from Cornell Hub)
- `FinancePage.jsx` — finance UI (copy from Cornell Hub)
- Portal content editor in admin — UI to edit JSONB content visually
- Email notifications — send portal link to client via SendGrid/Resend
