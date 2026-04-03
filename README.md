# Sublead

Turbo monorepo with a Vite + React frontend, Hono API, and a Python service for Reddit lead scraping.

## Stack

| Layer | Tech |
|-------|------|
| Frontend | Vite, React 19, TanStack Router, TanStack Query, Tailwind 4, shadcn/ui |
| API | Hono, better-auth (email/password), Drizzle ORM, Postgres, OpenAPI + Scalar docs |
| Python | FastAPI, PRAW (Reddit) |
| Infra | Turbo, pnpm workspaces, Docker Compose |

## Structure

```
├── apps/
│   ├── web/          Vite SPA (port 3000 in dev)
│   ├── api/          Hono API (port 3001 in dev)
│   └── python/       FastAPI service (port 3002)
├── server.ts         Production server (serves built frontend + API on one port)
├── docker-compose.yml
└── Dockerfile
```

## Local dev

```bash
cp .env.example .env   # fill in values
pnpm install
pnpm dev               # starts web + api via turbo
```

Python service (separate terminal):

```bash
pnpm python:setup
pnpm python:dev
```

Database:

```bash
pnpm db:push           # push schema to Postgres
pnpm db:studio         # open Drizzle Studio
```

API docs available at `http://localhost:3001/api/docs`.

## Deploy (VPS)

```bash
cp .env.example .env   # fill in real values
docker compose up -d
```

Runs Postgres, the Node app, and the Python service. Put a reverse proxy (Caddy, nginx) in front of port 3000.

## Environment variables

| Variable | Description |
|----------|-------------|
| `POSTGRES_PASSWORD` | Postgres password (compose wires the DATABASE_URL internally) |
| `BETTER_AUTH_SECRET` | Auth session signing secret |
| `APP_URL` | Public URL (e.g. `https://sublead.io`) |
| `APP_PORT` | Host port for the Node app (default 3000) |
| `PYTHON_PORT` | Host port for the Python service (default 3002) |
| `REDDIT_CLIENT_ID` | Reddit API client ID |
| `REDDIT_CLIENT_SECRET` | Reddit API client secret |
| `REDDIT_USER_AGENT` | Reddit API user agent (default `sublead/1.0`) |
