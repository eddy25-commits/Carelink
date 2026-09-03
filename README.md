# CareLink, Community Health Reporting and Triage

Full stack application: Node.js/Express/TypeScript/PostgreSQL+PostGIS backend,
React (JavaScript, Vite) frontend. Blue and white glass design throughout.

```
backend/     API, database migrations, cron jobs        (see backend/README.md)
frontend/    React app, connects to the API via one env var  (see frontend/README.md)
```

## Run the whole stack locally

**1. Start the backend and its database**

```bash
cd backend
cp .env.example .env
docker compose up --build -d
docker compose exec api npm run migrate:latest
docker compose exec api npm run seed:run
```

The API is now live at `http://localhost:4000`. Confirm with:

```bash
curl http://localhost:4000/health
```

**2. Start the frontend**

```bash
cd frontend
cp .env.example .env    # VITE_API_BASE_URL already points at localhost:4000/api/v1
npm install
npm run dev
```

Open `http://localhost:5173`.

**3. Sign in as a health worker**

Use one of the seeded demo accounts (see `backend/README.md`), for example:

```
Email:    admin@healthtriage.local
Password: ChangeMe123!
```

Change these credentials before any real deployment.

## What each side owns

- **Backend**: severity scoring, SLA policies and monitoring, the triage state
  machine and audit trail, PostGIS based incident clustering, multilingual
  notifications, auth. Fully documented in `backend/README.md`, including the
  full endpoint table.
- **Frontend**: the public report and status flows (no login required), and
  the health worker triage dashboard, report detail, and incidents views
  (behind sign in). Installable as a Progressive Web App with offline app
  shell support. Fully documented in `frontend/README.md`, including the
  design system.

## Deploying

Both sides read their configuration from environment variables (`.env` files,
never committed). For a hosted deployment, set `VITE_API_BASE_URL` on the
frontend to the backend's public URL, and set `CORS_ORIGIN` on the backend to
the frontend's public URL, then build each independently:

```bash
cd backend && npm run build && npm start
cd frontend && npm run build   # serve the resulting dist/ folder as static files
```
