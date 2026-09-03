# Contributing to CareLink

Thanks for your interest in improving CareLink.

## Getting set up

Follow the "Run the whole stack locally" section in the root `README.md`. In short:

```bash
cd backend && cp .env.example .env && docker compose up --build -d
docker compose exec api npm run migrate:latest
docker compose exec api npm run seed:run

cd ../frontend && cp .env.example .env && npm install && npm run dev
```

## Before opening a pull request

```bash
cd backend && npm run lint && npm run typecheck && npm test && npm run build
cd frontend && npm run lint && npm run build
```

CI (`.github/workflows/ci.yml`) runs the same checks on every push and pull request against `main`.

## Project structure

See `backend/README.md` and `frontend/README.md` for how each side is organized.

## Commit style

Small, focused commits with a clear summary line are appreciated. No strict format required.
