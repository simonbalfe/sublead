# Sublead

Reddit lead generation SaaS. Monitors subreddits for posts that match your ideal customer profile, scores them with AI, and generates founder-voiced replies you can post in one click.

## How it works

**Setup:** Create a product (ICP) by pasting your website URL. AI analyzes the page to generate a customer description, pain points, and a ranked list of relevant subreddits. Pick up to 5 subreddits to monitor.

**Scraping (every 30 min):** For each product, for each subreddit, the scraper polls new posts and runs a 3-stage filtering pipeline:

1. Deduplication check (skip already-processed posts)
2. Embeddings prefilter (cosine similarity gate, cheap, blocks obvious mismatches before LLM)
3. Two-stage LLM scoring (fast model pre-filters, stronger model scores survivors)

Each post is scored on three factors (1-100): **Product Fit**, **Intent**, and **Decision Authority**. Posts above threshold are saved as qualified leads with full score breakdowns and justifications.

**Lead management:** Browse leads sorted by quality, filtered by product and status (New / Seen / Responded). Click "Generate Reply" to get a natural, founder-voiced Reddit comment. Copy and go to Reddit.

## Architecture

All AI logic (scoring, ICP analysis, reply generation, subreddit discovery) lives in the Hono API (TypeScript). The Python service is a thin wrapper that only handles Reddit API calls via PRAW.

```
apps/
├── web/          Vite SPA (React 19, TanStack Router, TanStack Query, Tailwind 4, shadcn/ui)
├── api/          Hono API (better-auth, Drizzle ORM, Postgres, OpenAPI + Scalar docs)
│                 AI scoring, ICP analysis, reply generation, subreddit discovery
└── python/       FastAPI (PRAW only: fetch posts, search subreddits, test connectivity)
server.ts         Production server (serves built frontend + API on one port)
```

## AI Pipeline

| Agent | Purpose | Model |
|-------|---------|-------|
| ICP + Pain Points | Analyze website HTML, extract customer profile and pain points | Gemini Flash |
| Keyword Generation | Generate 25-35 search terms across 6 categories for subreddit discovery | Gemini Flash |
| Subreddit Relevance | Filter candidate subreddits by business fit, return top 20 | Gemini Flash |
| Lead Scoring (weak) | Fast pre-filter, scores Product Fit + Intent + Authority | Gemini Flash Lite |
| Lead Scoring (strong) | Detailed scoring on posts that pass the weak filter | Gemini Flash |
| Reply Generation | Founder-voiced Reddit comment, max 90 words, subtle product mention | Gemini Flash |

Scoring is conservative by design. Most posts score below 40. Only posts that clear both the embeddings gate and the two-stage LLM pipeline become leads.

## Local dev

```bash
cp .env.example .env
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

API docs at `http://localhost:3001/api/docs`.

## Deploy (VPS)

```bash
cp .env.example .env   # fill in real values
docker compose up -d
```

Runs Postgres, the Node app, and the Python service. Put a reverse proxy (Caddy, nginx) in front of port 3000.

## Environment variables

| Variable | Description |
|----------|-------------|
| `POSTGRES_PASSWORD` | Postgres password (compose wires DATABASE_URL internally) |
| `BETTER_AUTH_SECRET` | Auth session signing secret |
| `APP_URL` | Public URL (e.g. `https://sublead.io`) |
| `APP_PORT` | Host port for the Node app (default 3000) |
| `PYTHON_PORT` | Host port for the Python service (default 3002) |
| `REDDIT_CLIENT_ID` | Reddit API client ID |
| `REDDIT_CLIENT_SECRET` | Reddit API client secret |
| `REDDIT_USER_AGENT` | Reddit API user agent (default `sublead/1.0`) |
| `GEMINI_API_KEY` | Google Gemini API key for AI scoring and generation |
| `OPENAI_API_KEY` | OpenAI API key for embeddings prefilter |
