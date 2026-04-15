# Podkaap Backend

MVP streaming platform backend — modular monolith + background worker.

## Stack

| Layer | Choice |
|---|---|
| Runtime | Bun |
| Framework | ElysiaJS |
| Language | TypeScript |
| ORM | Prisma |
| Database | PostgreSQL |
| Media | FFmpeg |
| Storage | Cloudinary / S3-compatible |

## Quick Start

```bash
# 1. Copy env
cp .env.example .env
# Fill in DATABASE_URL, JWT_SECRET

# 2. Install dependencies
bun install

# 3. Generate Prisma client & run migrations
bun run db:generate
bun run db:migrate

# 4. Seed demo data
bun run db:seed

# 5. Start API
bun run dev:api

# 6. (Optional) Start background worker
bun run dev:worker
```

API is available at `http://localhost:3000`
Swagger docs at `http://localhost:3000/docs`

## Project Structure

```
podkaap-backend/
├── apps/
│   ├── api/         # ElysiaJS HTTP server
│   └── worker/      # Background media processing worker
├── packages/
│   ├── db/          # Prisma schema + client
│   ├── shared/      # Shared enums & types
│   └── eslint-config/
└── scripts/         # Dev helpers
```

## Content Model

The canonical content model is:

- `Collection` = one story container per creation flow
- `Content(role=SHORT)` = many short discovery clips
- `Content(role=FULL)` = one long-form content or an ordered full-content series
- `ContentWarp` = jump from a short clip into a specific full content and timeframe

This single model supports both:

- `SINGLE` collections with one full content item
- `SERIES` collections with multiple ordered full content items

See [docs/collection-content-direction.md](docs/collection-content-direction.md) for the canonical layout.

## API Endpoints

All routes are prefixed with `/api/v1`.

| Module | Method | Path |
|---|---|---|
| Health | GET | `/health` |
| Collections | GET | `/collections` `/collections/:id` `/collections/:id/contents` |
| Contents | GET | `/contents/:id` `/contents/:id/warps` `/contents/:id/next` |
| Progress | POST/GET | `/progress` `/progress/:contentId` `/progress/:contentId/complete` |
| Continue Watching | GET | `/continue-watching` |
| Reactions | POST/GET | `/reactions` `/contents/:id/reactions-summary` |
| Feed | GET | `/feed` |
| Analytics | POST | `/analytics/events` |
| Media | POST/GET | `/media` `/media/:id/process` `/media/:id/status` |

## Feed Engine

`GET /feed` runs a 3-step pipeline:

1. **Candidate generation** — pulls up to 200 mixed content items from `Content`, including:
   - `SHORT` items with warp targets
   - `FULL` items that can appear directly in feed
2. **Ranking** — weighted score: `continueConversion(0.35) + completion(0.25) + recency(0.20) + emotionMatch(0.10) + freshness(0.10)` plus light boosts for active collections and format balancing
3. **Diversity pass** — max 2 consecutive items from the same collection, preserves both `SHORT` and `LONG` feed lanes when possible, and reserves 20% exploration slots

## Background Jobs

| Job | Trigger | Purpose |
|---|---|---|
| `recompute-content-scores` | Scheduled / manual | Recompute conversion & completion scores from analytics |
| `update-trending` | Scheduled / manual | Refresh time-decay recency scores |
| `cleanup` | Daily | Purge analytics events older than 90 days |

Run manually:
```bash
bun run apps/api/src/jobs/recompute-hook-scores.ts
bun run apps/api/src/jobs/update-trending.ts
bun run apps/api/src/jobs/cleanup.ts
```

## Database

Uses PostgreSQL via Prisma. Prefer Prisma migrations for schema changes:

```bash
bun run db:migrate  # create/apply development migration
bun run db:seed     # load demo data
bun run db:generate # regenerate client after schema changes
```

## Authentication

Routes under `/progress`, `/continue-watching`, `/reactions`, and `/feed` require a `Bearer` token.

Token format: `Authorization: Bearer <jwt>`

JWT payload: `{ userId: string, email: string }`

> For MVP testing, you can disable the auth guard in the controller or issue tokens manually.

## Out of Scope (v1)

- AI/ML personalization
- Multi-quality transcoding pipeline
- Distributed job queue
- Microservices / Go integration
