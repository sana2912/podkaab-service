# Podkaap Project Structure Overview

เอกสารนี้สรุปโครงสร้าง repo ปัจจุบันของ Podkaap Backend โดยยึด domain model เดียวคือ `Collection -> Content -> ContentWarp` และ architecture ปัจจุบันที่มี Python feed service เป็น optional decision engine

## 1. High-Level Shape

```text
pod-kaab-service/
├── apps/
│   ├── api/
│   ├── worker/
│   └── feed-service-python/
├── packages/
│   ├── db/
│   ├── queue/
│   ├── shared/
│   └── eslint-config/
├── proto/
├── docs/
├── scripts/
├── package.json
└── .env.*
```

แนวคิดหลัก:

- `apps/api` เป็น owner ของ HTTP API, auth, DB access, และ response contract
- `apps/worker` เป็น owner ของ async jobs
- `apps/feed-service-python` เป็น owner ของ feed decision logic เมื่อเปิดใช้งาน
- `packages/db` คือ source of truth ของ schema และ Prisma client
- `packages/queue` คือ queue helpers
- `packages/shared` คือ shared enums และ DTOs
- `proto` คือ gRPC contract ระหว่าง API กับ Python feed service

## 2. Runtime Dependency Map

```text
Client
  -> API
      -> PostgreSQL via Prisma
      -> Dragonfly via BullMQ
      -> gRPC -> Python Feed Service
      -> shared DTOs

Worker
  -> PostgreSQL via Prisma
  -> Dragonfly via BullMQ
  -> FFmpeg / storage
```

สรุปง่าย:

- API query data เอง
- worker ทำ async jobs
- Python feed service ไม่ query DB เอง

## 3. Canonical Product Model

```text
Collection
  -> Content(role=SHORT)*
  -> Content(role=FULL)+
  -> ContentWarp(short -> full @ targetStartSeconds)
```

ความหมาย:

- `Collection` = story container
- `Content(role=SHORT)` = discovery clips
- `Content(role=FULL)` = playable full content
- `ContentWarp` = jump จาก short ไป full

รองรับทั้ง:

- `Collection.fullMode = SINGLE`
- `Collection.fullMode = SERIES`

## 4. Root Files

ไฟล์สำคัญ:

- [package.json](/mnt/d/dev-workspace/podkaap/pod-kaab-service/package.json)
- [README.md](/mnt/d/dev-workspace/podkaap/pod-kaab-service/README.md)
- [docker-compose.yml](/mnt/d/dev-workspace/podkaap/pod-kaab-service/docker-compose.yml)
- [.env.example](/mnt/d/dev-workspace/podkaap/pod-kaab-service/.env.example)
- [biome.json](/mnt/d/dev-workspace/podkaap/pod-kaab-service/biome.json)
- [eslint.config.js](/mnt/d/dev-workspace/podkaap/pod-kaab-service/eslint.config.js)

script สำคัญ:

- `bun run dev:api`
- `bun run dev:worker`
- `bun run dev:feed-service`
- `bun run prisma:generate`
- `bun run db:migrate`
- `bun run db:seed`
- `bun run lint`

## 5. apps/api

หน้าที่:

- เปิด Elysia server
- inject Prisma / queue / auth
- query DB
- call local feed engine หรือ remote Python feed service
- compose frontend DTO
- record analytics

ไฟล์หลัก:

- [apps/api/src/server.ts](/mnt/d/dev-workspace/podkaap/pod-kaab-service/apps/api/src/server.ts)
- [apps/api/src/app.ts](/mnt/d/dev-workspace/podkaap/pod-kaab-service/apps/api/src/app.ts)
- [apps/api/src/routes/index.ts](/mnt/d/dev-workspace/podkaap/pod-kaab-service/apps/api/src/routes/index.ts)

feed files ที่ควรรู้:

- [apps/api/src/modules/feed/feed.repository.ts](/mnt/d/dev-workspace/podkaap/pod-kaab-service/apps/api/src/modules/feed/feed.repository.ts)
- [apps/api/src/modules/feed/feed.service.ts](/mnt/d/dev-workspace/podkaap/pod-kaab-service/apps/api/src/modules/feed/feed.service.ts)
- [apps/api/src/modules/feed/feed-local-engine.service.ts](/mnt/d/dev-workspace/podkaap/pod-kaab-service/apps/api/src/modules/feed/feed-local-engine.service.ts)
- [apps/api/src/modules/feed/feed-remote-engine.service.ts](/mnt/d/dev-workspace/podkaap/pod-kaab-service/apps/api/src/modules/feed/feed-remote-engine.service.ts)

## 6. apps/worker

หน้าที่:

- consume jobs จาก BullMQ
- ทำ media processing
- ทำ analytics maintenance

ไฟล์หลัก:

- [apps/worker/src/worker.ts](/mnt/d/dev-workspace/podkaap/pod-kaab-service/apps/worker/src/worker.ts)
- `apps/worker/src/jobs/*`
- `apps/worker/src/services/*`

## 7. apps/feed-service-python

หน้าที่:

- รับ candidate list ผ่าน gRPC
- filter candidates
- score
- rank
- apply diversity

สิ่งที่ service นี้ไม่ทำ:

- ไม่ query PostgreSQL
- ไม่เขียน analytics ลง DB
- ไม่ compose frontend DTO
- ไม่ทำ auth

ไฟล์หลัก:

- [apps/feed-service-python/app.py](/mnt/d/dev-workspace/podkaap/pod-kaab-service/apps/feed-service-python/app.py)
- [apps/feed-service-python/feed_engine.py](/mnt/d/dev-workspace/podkaap/pod-kaab-service/apps/feed-service-python/feed_engine.py)
- [apps/feed-service-python/requirements.txt](/mnt/d/dev-workspace/podkaap/pod-kaab-service/apps/feed-service-python/requirements.txt)
- [apps/feed-service-python/.pylintrc](/mnt/d/dev-workspace/podkaap/pod-kaab-service/apps/feed-service-python/.pylintrc)
- [proto/feed.proto](/mnt/d/dev-workspace/podkaap/pod-kaab-service/proto/feed.proto)

## 8. packages/db

หน้าที่:

- เก็บ Prisma schema
- เก็บ Prisma config
- สร้าง Prisma client
- seed demo data

ไฟล์หลัก:

- [packages/db/prisma/schema.prisma](/mnt/d/dev-workspace/podkaap/pod-kaab-service/packages/db/prisma/schema.prisma)
- [packages/db/prisma.config.ts](/mnt/d/dev-workspace/podkaap/pod-kaab-service/packages/db/prisma.config.ts)
- [packages/db/src/client.ts](/mnt/d/dev-workspace/podkaap/pod-kaab-service/packages/db/src/client.ts)

## 9. packages/queue

หน้าที่:

- queue names
- job payload types
- queue factories
- Redis/Dragonfly connection

## 10. packages/shared

หน้าที่:

- shared enums
- shared DTOs

## 11. Feed Decision Flow

```text
Client
  -> GET /feed
  -> API queries candidates from DB
  -> API builds user context
  -> API chooses engine
      -> local TypeScript engine
      -> or Python gRPC engine
  -> API records impressions
  -> API returns final response
```

หลักคิด:

- API owns candidate retrieval
- Python owns decision logic only
- remote path มี fallback เป็น local path

## 12. Tooling Notes

- `Biome` ดู TS/JS/JSON/MD
- `pylint` ดู Python feed service
- `Biome` ไม่สแกน `*.py`, `venv`, `__pycache__`, หรือ generated Python stubs
- pre-commit จะรัน `pylint` กับ staged Python files

## 13. Local Dev Flow

```bash
docker compose up -d postgres dragonfly
bun install
bun run prisma:generate
bun run db:migrate
bun run db:seed
bun run dev:api
bun run dev:worker
```

ถ้าจะใช้ Python feed service:

```bash
python -m pip install -r apps/feed-service-python/requirements.txt
bun run dev:feed-service
```

แล้วเปิด env:

```env
FEED_SERVICE_ENABLED="true"
FEED_SERVICE_URL="localhost:50051"
```
