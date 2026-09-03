# Community Health Reporting & Triage — Backend

Backend service for the *Community Health Reporting and Triage Web Application for Low-Resource Settings*.
Built with **Node.js, Express, TypeScript**, and **PostgreSQL + PostGIS**, following a
service-oriented architecture as specified in the project proposal.

## Architecture

```
src/
  config/          env validation, logger, database connection
  types/           shared domain types (Report, Incident, HealthWorker, ...)
  middleware/      auth (JWT), validation (zod), error handling, rate limiting
  utils/           errors, async handler, report-token generator
  modules/
    auth/                login / health-worker registration
    health-workers/       health worker accounts, used for assignment
    reports/               report submission, status lookup, listing
    triage/                triage workflow state machine + audit trail
    severity-scoring/      rule-based automated severity scorer
    sla-policies/          configurable SLA thresholds + due-date calculation
    incidents/              PostGIS-based outbreak/cluster detection
    notifications/          multilingual, pluggable notification dispatch
  jobs/            SLA monitor + incident clustering cron jobs
  db/
    migrations/    Knex migrations (schema, including PostGIS columns)
    seeds/         demo health worker accounts
  app.ts           Express app assembly
  server.ts        entry point: DB check, cron start, graceful shutdown
```

### Core workflow

1. **Community member submits a report** (`POST /api/v1/reports`, public, rate-limited).
   The **severity-scoring service** computes a 0–100 score and priority level
   (critical/high/medium/low) from category, symptoms, free-text keywords, and
   affected-person count. The **SLA service** computes response/resolution due
   dates from the resulting priority. A report token is generated so an
   anonymous reporter can check status later without an account.
2. **Health worker triages the queue** (`GET /api/v1/triage/queue`) — sorted by
   priority then SLA due date, so the most urgent, most at-risk reports surface
   first.
3. **Assignment / escalation / resolution / closure** are enforced as an explicit
   state machine (`triage.service.ts`) — invalid transitions (e.g. closing an
   unresolved report) are rejected with a 409. Every transition is written to
   `triage_actions` as an immutable audit trail, and (non-blocking) triggers a
   multilingual notification to the reporter if they left contact info.
4. **SLA monitor job** (cron, default every 5 min) flags reports that breach
   their SLA and auto-escalates ones still awaiting first response.
5. **Incident clustering job** (cron, default every 15 min) uses PostGIS
   `ST_ClusterDBSCAN` to group nearby, recent reports into `Incident` records —
   surfacing potential outbreaks from otherwise-disconnected individual reports.

### Abuse-prevention & anonymity

- Anonymous reports (`isAnonymous: true`) never store reporter contact info.
- Public report submission is rate-limited per IP.
- Status lookup for anonymous reporters requires the unguessable report token,
  not a sequential ID.

## Getting started

### Option A — Docker (recommended, one command)

```bash
docker compose up --build
```

This starts PostgreSQL+PostGIS and the API, runs migrations are **not** run
automatically — run them once the DB is healthy:

```bash
docker compose exec api npm run migrate:latest
docker compose exec api npm run seed:run   # optional demo accounts
```

API is then available at `http://localhost:4000`.

### Option B — Local Node

```bash
cp .env.example .env      # edit DATABASE_URL, JWT_SECRET, etc.
npm install
npm run migrate:latest
npm run seed:run          # optional demo accounts
npm run dev                # starts on http://localhost:4000
```

Requires a running PostgreSQL instance with the `postgis` extension
installable (the first migration runs `CREATE EXTENSION postgis`).

### Demo accounts (after `npm run seed:run`)

| Email | Password | Role |
|---|---|---|
| admin@healthtriage.local | ChangeMe123! | admin |
| triage.officer@healthtriage.local | ChangeMe123! | triage_officer |
| field.worker@healthtriage.local | ChangeMe123! | field_worker |

**Change these before any real deployment.**

## API overview

All authenticated routes require `Authorization: Bearer <token>` from `POST /api/v1/auth/login`.

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/v1/auth/login` | Public | Health worker login |
| POST | `/api/v1/auth/register` | Admin | Create a health worker account |
| POST | `/api/v1/reports` | Public (rate-limited) | Submit a health report |
| GET | `/api/v1/reports/status/:token` | Public | Check report status by token |
| GET | `/api/v1/reports` | Auth | List/filter reports |
| GET | `/api/v1/reports/:id` | Auth | Get a single report |
| GET | `/api/v1/triage/queue` | Auth | Prioritized triage queue |
| GET | `/api/v1/triage/:reportId/history` | Auth | Full audit trail for a report |
| POST | `/api/v1/triage/:reportId/triage` | Auth | Mark reviewed/triaged |
| POST | `/api/v1/triage/:reportId/assign` | Auth | Assign/reassign to a worker |
| POST | `/api/v1/triage/:reportId/escalate` | Auth | Escalate |
| POST | `/api/v1/triage/:reportId/resolve` | Auth | Mark resolved |
| POST | `/api/v1/triage/:reportId/close` | Auth | Close |
| POST | `/api/v1/triage/:reportId/reopen` | Auth | Reopen a closed/resolved report |
| POST | `/api/v1/triage/:reportId/comment` | Auth | Add a note without changing status |
| GET | `/api/v1/incidents` | Auth | List detected incidents/clusters |
| GET | `/api/v1/incidents/:id` | Auth | Incident detail + member reports |
| PATCH | `/api/v1/incidents/:id/status` | Auth | Update incident status |
| POST | `/api/v1/incidents/run-clustering` | Supervisor/Admin | Manually trigger clustering (demo/testing) |
| GET | `/api/v1/health-workers` | Auth | List workers (for assignment UI) |
| GET | `/health` | Public | Liveness check |

## Scripts

```bash
npm run dev              # start with hot reload
npm run build             # compile to dist/
npm run start              # run compiled build
npm run migrate:latest    # apply DB migrations
npm run migrate:rollback  # roll back last migration batch
npm run seed:run           # load demo data
npm run test                # run unit tests (vitest)
npm run lint                 # eslint
```

## Notes for the frontend team (React, next phase)

- All list/queue responses are shaped `{ data, meta? }`; errors are `{ error: { message, details? } }`.
- Report submission and status lookup need **no auth** — build the community-facing
  flow against those two endpoints only.
- The triage dashboard should poll or re-fetch `GET /triage/queue` — it's already
  sorted by urgency, no client-side sorting needed.
- SLA countdown timers can be built directly from `sla_response_due_at` /
  `sla_resolution_due_at` on each report.
