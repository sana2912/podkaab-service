# Podkaap Backend

Podkaap backend ตอนนี้ประกอบด้วย 3 ส่วนหลัก:

- API หลักบน `Bun + Elysia`
- background worker บน `BullMQ + Dragonfly`
- optional Python feed service ผ่าน `gRPC`

## Stack

| Layer | Choice |
|---|---|
| Runtime | Bun |
| Framework | ElysiaJS |
| Language | TypeScript |
| ORM | Prisma |
| Database | PostgreSQL |
| Queue | BullMQ + Dragonfly |
| Feed Decision Engine | Local TypeScript engine + optional Python gRPC service |
| Media | FFmpeg |
| Storage | Cloudinary / S3-compatible |

## Quick Start

```bash
# 1. Install dependencies
bun install

# 2. Copy env
cp .env.example .env.development

# 3. Generate Prisma client & run migrations
bun run prisma:generate
bun run db:migrate

# 4. Seed demo data
bun run db:seed

# 5. Start API
bun run dev:api

# 6. (Optional) Start worker
bun run dev:worker
```

ถ้าจะใช้ Python feed service เพิ่ม:

```bash
python -m pip install -r apps/feed-service-python/requirements.txt
bun run dev:feed-service
```

แล้วเปิดใน env:

```env
FEED_SERVICE_ENABLED="true"
FEED_SERVICE_URL="localhost:50051"
```

API is available at `http://localhost:3000`  
Swagger docs at `http://localhost:3000/docs`

## Project Structure

```text
podkaap-backend/
├── apps/
│   ├── api/                 # ElysiaJS HTTP server
│   ├── worker/              # Background media/analytics worker
│   └── feed-service-python/ # Optional gRPC feed engine
├── packages/
│   ├── db/                  # Prisma schema + client
│   ├── queue/               # BullMQ/Dragonfly helpers
│   ├── shared/              # Shared enums & types
│   └── eslint-config/
├── proto/                   # gRPC contracts
└── scripts/
```

## Content Model

canonical model ของระบบคือ:

- `Collection` = story container
- `Content(role=SHORT)` = short discovery clips
- `Content(role=FULL)` = full content หนึ่งชิ้นหรือหลายตอน
- `ContentWarp` = jump จาก short ไป full target พร้อม timeframe

รองรับทั้ง:

- `SINGLE` collections
- `SERIES` collections

## API Endpoints

all routes are prefixed with `/api/v1`

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

## Feed Architecture

`GET /feed` ทำงานแบบนี้:

1. API query candidates จาก PostgreSQL
2. API สร้าง user context เช่น emotion preferences
3. API เลือก decision engine
   - local TypeScript engine
   - หรือ Python gRPC feed service ถ้าเปิด `FEED_SERVICE_ENABLED`
4. API record impressions
5. API map final response DTO ให้ frontend

สิ่งสำคัญ:

- Python feed service **ไม่ query DB**
- Python feed service รับผิดชอบแค่:
  - candidate filtering
  - scoring
  - ranking
  - diversity
- ถ้า Python service ล่ม API จะ fallback กลับ local TypeScript engine

ดูรายละเอียดเพิ่มได้ที่ [apps/feed-service-python/README.md](apps/feed-service-python/README.md)

## Background Jobs

| Job | Purpose |
|---|---|
| `process-video` | main media processing flow |
| `extract-thumbnail` | generate thumbnail |
| `generate-waveform` | generate waveform asset |
| `transcode-video` | transcode video |
| `recompute-content-scores` | recompute content scores from analytics |
| `update-trending` | refresh recency/trending scores |
| `cleanup` | purge old analytics events |

## Tooling

- `Biome` ดู TS/JS/JSON/MD
- `ESLint` ดู JS config
- `pylint` ดู Python feed service
- `Husky + lint-staged` รัน pre-commit checks

หมายเหตุ:

- Biome ถูกกันไม่ให้สแกน `*.py`, `venv`, `__pycache__`, และ generated Python stubs
- pre-commit จะรัน `pylint` กับ staged `*.py`

## Out of Scope

- Python feed service query DB โดยตรง
- microservices อื่นเพิ่มโดยยังไม่มี boundary ชัด
- AI/ML personalization เต็มรูปแบบ
