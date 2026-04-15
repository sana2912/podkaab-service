# Podkaap Project Structure Overview

เอกสารนี้อธิบายโครงสร้าง repo ปัจจุบันของ Podkaap Backend โดยยึด runtime model เดียวคือ `Collection -> Content -> ContentWarp`

## 1. ภาพรวมทั้ง repo

repo นี้เป็น Bun monorepo ที่แยกเป็น 2 app และ 4 shared packages

```text
pod-kaab-service/
├── apps/
│   ├── api/
│   └── worker/
├── packages/
│   ├── db/
│   ├── queue/
│   ├── shared/
│   └── eslint-config/
├── docs/
├── scripts/
├── docker-compose.yml
├── package.json
└── .env.*
```

แนวคิดหลัก:

- `apps/api` รับ HTTP request และ expose business API
- `apps/worker` consume queue jobs และทำงาน background
- `packages/db` เป็น source of truth ของ database schema และ Prisma client
- `packages/queue` รวม queue names, payload types, Redis connection และ queue factories
- `packages/shared` รวม DTO และ enum ที่ใช้ร่วมกัน
- `packages/eslint-config` เป็น shared lint config

## 2. Runtime Dependency Map

```text
Client
  -> apps/api
      -> packages/db -> PostgreSQL
      -> packages/queue -> Dragonfly / Redis
      -> packages/shared

apps/worker
  -> packages/db -> PostgreSQL
  -> packages/queue -> Dragonfly / Redis
  -> packages/shared
  -> FFmpeg
  -> storage provider
```

สรุปง่าย:

- API เป็น producer ของ jobs
- Worker เป็น consumer ของ jobs
- API และ worker ใช้ Prisma client ชุดเดียวกัน
- type boundary กลางอยู่ใน `packages/shared`

## 3. Canonical Product Model

ระบบปัจจุบันใช้ model นี้อย่างเดียว

```text
Collection
  -> Content(role=SHORT)*
  -> Content(role=FULL)+
  -> ContentWarp(short -> full @ targetStartSeconds)
```

ความหมาย:

- `Collection` คือ container ระดับ story หรือ content package
- `Content(role=SHORT)` คือ discovery clip สำหรับ feed
- `Content(role=FULL)` คือ content ยาวที่เล่นจริง
- `ContentWarp` คือ mapping จาก short ไป full target พร้อมเวลาเริ่มเล่น

### 3.1 Single และ Series

`Collection.fullMode` รองรับ 2 แบบ

- `SINGLE` หมายถึง collection มี full content หลัก 1 ชิ้น
- `SERIES` หมายถึง collection มี full content หลายชิ้นและเรียงตาม `Content.order`

ดังนั้น model ใหม่รองรับทั้ง:

- single full content พร้อม shorts
- series ของ full contents พร้อม shorts

## 4. Root-Level Files

ไฟล์สำคัญที่ root:

- [package.json](/mnt/d/dev-workspace/podkaap/pod-kaab-service/package.json)
- [README.md](/mnt/d/dev-workspace/podkaap/pod-kaab-service/README.md)
- [docker-compose.yml](/mnt/d/dev-workspace/podkaap/pod-kaab-service/docker-compose.yml)
- [.env.example](/mnt/d/dev-workspace/podkaap/pod-kaab-service/.env.example)
- `.env.development`
- `.env.production`
- [biome.json](/mnt/d/dev-workspace/podkaap/pod-kaab-service/biome.json)
- [eslint.config.js](/mnt/d/dev-workspace/podkaap/pod-kaab-service/eslint.config.js)

หน้าที่:

- root `package.json` เป็น command entrypoint ของทั้ง monorepo
- `docker-compose.yml` ใช้เปิด local PostgreSQL และ Dragonfly
- `.env.*` เก็บ runtime config
- `biome.json` และ `eslint.config.js` เป็น quality gate

## 5. Root Scripts ที่ใช้บ่อย

ใช้จาก root ได้เลย

- `bun run dev:api`
- `bun run dev:worker`
- `bun run prisma:generate`
- `bun run db:migrate`
- `bun run db:seed`
- `bun run prisma:studio`
- `bun run lint`
- `bun run typecheck`

หมายเหตุ:

- script ตระกูล `prisma:*` และ `db:*` จะวิ่งเข้า `packages/db`
- script เหล่านี้ใช้ `.env.development` หรือ `.env.production` ผ่าน `dotenvx`

## 6. apps/api

ตำแหน่ง: [apps/api](/mnt/d/dev-workspace/podkaap/pod-kaab-service/apps/api)

หน้าที่:

- เปิด Elysia server
- register routes
- validate request
- inject Prisma / queue / auth context
- เรียก service และ repository
- enqueue background jobs

### 6.1 Core Files

- [apps/api/src/server.ts](/mnt/d/dev-workspace/podkaap/pod-kaab-service/apps/api/src/server.ts)
  เริ่ม HTTP server และ log URL ที่ใช้เปิด API กับ docs
- [apps/api/src/app.ts](/mnt/d/dev-workspace/podkaap/pod-kaab-service/apps/api/src/app.ts)
  สร้าง Elysia app, mount docs, root route, error handling, และ routes
- [apps/api/src/routes/index.ts](/mnt/d/dev-workspace/podkaap/pod-kaab-service/apps/api/src/routes/index.ts)
  รวม route modules ใต้ prefix `/api/v1`

### 6.2 API Config

- [apps/api/src/config/env.ts](/mnt/d/dev-workspace/podkaap/pod-kaab-service/apps/api/src/config/env.ts)
  อ่าน env และ validate ค่า
- [apps/api/src/config/app-config.ts](/mnt/d/dev-workspace/podkaap/pod-kaab-service/apps/api/src/config/app-config.ts)
  แปลง env เป็น object ที่ app ใช้สะดวก
- [apps/api/src/config/constants.ts](/mnt/d/dev-workspace/podkaap/pod-kaab-service/apps/api/src/config/constants.ts)
  business constants เช่น feed, pagination, retention

### 6.3 API Plugins

- [apps/api/src/plugins/prisma.ts](/mnt/d/dev-workspace/podkaap/pod-kaab-service/apps/api/src/plugins/prisma.ts)
  inject Prisma client
- [apps/api/src/plugins/queue.ts](/mnt/d/dev-workspace/podkaap/pod-kaab-service/apps/api/src/plugins/queue.ts)
  inject media/analytics queues
- [apps/api/src/plugins/auth.ts](/mnt/d/dev-workspace/podkaap/pod-kaab-service/apps/api/src/plugins/auth.ts)
  ตรวจ auth token และ derive `userId`
- [apps/api/src/plugins/logger.ts](/mnt/d/dev-workspace/podkaap/pod-kaab-service/apps/api/src/plugins/logger.ts)
  request logging
- [apps/api/src/plugins/storage.ts](/mnt/d/dev-workspace/podkaap/pod-kaab-service/apps/api/src/plugins/storage.ts)
  inject storage abstraction ที่ media module ใช้

### 6.4 API Common Layer

- [apps/api/src/common/errors/index.ts](/mnt/d/dev-workspace/podkaap/pod-kaab-service/apps/api/src/common/errors/index.ts)
  error class และ error factory
- [apps/api/src/common/guards/index.ts](/mnt/d/dev-workspace/podkaap/pod-kaab-service/apps/api/src/common/guards/index.ts)
  reusable guard logic
- [apps/api/src/common/utils/pagination.ts](/mnt/d/dev-workspace/podkaap/pod-kaab-service/apps/api/src/common/utils/pagination.ts)
  cursor pagination helpers
- [apps/api/src/common/dto/index.ts](/mnt/d/dev-workspace/podkaap/pod-kaab-service/apps/api/src/common/dto/index.ts)
  re-export shared DTOs สำหรับ app layer

### 6.5 API Modules

route modules ปัจจุบัน:

- `health`
- `collections`
- `contents`
- `progress`
- `continue-watching`
- `reactions`
- `feed`
- `analytics`
- `media`

module pattern:

```text
module/
├── *.controller.ts
├── *.service.ts
├── *.repository.ts
├── *.schema.ts
├── *.mapper.ts
└── index.ts
```

หน้าที่แต่ละชั้น:

- `controller` รับ request, validate, set status, เรียก service
- `service` รวม business logic
- `repository` คุย Prisma
- `schema` นิยาม params/body/query
- `mapper` แปลง DB rows เป็น DTO

## 7. apps/worker

ตำแหน่ง: [apps/worker](/mnt/d/dev-workspace/podkaap/pod-kaab-service/apps/worker)

หน้าที่:

- เปิด BullMQ workers
- consume jobs จาก Dragonfly/Redis
- ประมวลผลงาน media
- ประมวลผลงาน analytics maintenance

ไฟล์สำคัญ:

- [apps/worker/src/worker.ts](/mnt/d/dev-workspace/podkaap/pod-kaab-service/apps/worker/src/worker.ts)
  entrypoint ของ worker ทั้งหมด
- [apps/worker/src/config/env.ts](/mnt/d/dev-workspace/podkaap/pod-kaab-service/apps/worker/src/config/env.ts)
  worker env config
- `apps/worker/src/jobs/*`
  job handlers
- `apps/worker/src/services/*`
  helpers สำหรับ Prisma, FFmpeg และ storage

job groups:

- media jobs
  - process video
  - extract thumbnail
  - generate waveform
  - transcode video
- analytics jobs
  - recompute content scores
  - update trending

## 8. packages/db

ตำแหน่ง: [packages/db](/mnt/d/dev-workspace/podkaap/pod-kaab-service/packages/db)

หน้าที่:

- เก็บ Prisma schema
- เก็บ Prisma config ของ Prisma 7
- สร้าง Prisma client
- seed data

ไฟล์สำคัญ:

- [packages/db/prisma/schema.prisma](/mnt/d/dev-workspace/podkaap/pod-kaab-service/packages/db/prisma/schema.prisma)
  schema หลักของระบบ
- [packages/db/prisma.config.ts](/mnt/d/dev-workspace/podkaap/pod-kaab-service/packages/db/prisma.config.ts)
  Prisma 7 config และ datasource URL
- [packages/db/src/client.ts](/mnt/d/dev-workspace/podkaap/pod-kaab-service/packages/db/src/client.ts)
  shared Prisma client พร้อม `@prisma/adapter-pg`
- [packages/db/prisma/seed.ts](/mnt/d/dev-workspace/podkaap/pod-kaab-service/packages/db/prisma/seed.ts)
  seed canonical collections/contents/warps/progress data

## 9. packages/queue

ตำแหน่ง: [packages/queue](/mnt/d/dev-workspace/podkaap/pod-kaab-service/packages/queue)

หน้าที่:

- รวม queue names
- รวม job payload types
- สร้าง queue instances
- สร้าง Redis connection ที่แชร์ได้

ไฟล์สำคัญ:

- [packages/queue/src/job-types.ts](/mnt/d/dev-workspace/podkaap/pod-kaab-service/packages/queue/src/job-types.ts)
- [packages/queue/src/queues.ts](/mnt/d/dev-workspace/podkaap/pod-kaab-service/packages/queue/src/queues.ts)
- [packages/queue/src/connection.ts](/mnt/d/dev-workspace/podkaap/pod-kaab-service/packages/queue/src/connection.ts)

## 10. packages/shared

ตำแหน่ง: [packages/shared](/mnt/d/dev-workspace/podkaap/pod-kaab-service/packages/shared)

หน้าที่:

- เก็บ enum กลาง
- เก็บ DTO กลาง
- export type surface ที่ API และ worker ใช้ร่วมกัน

ไฟล์สำคัญ:

- [packages/shared/src/enums/index.ts](/mnt/d/dev-workspace/podkaap/pod-kaab-service/packages/shared/src/enums/index.ts)
- [packages/shared/src/types/index.ts](/mnt/d/dev-workspace/podkaap/pod-kaab-service/packages/shared/src/types/index.ts)
- [packages/shared/src/index.ts](/mnt/d/dev-workspace/podkaap/pod-kaab-service/packages/shared/src/index.ts)

## 11. Config และ Env Strategy

env หลักที่ใช้บ่อย:

- `DATABASE_URL`
- `DRAGONFLY_URL`
- `REDIS_URL`
- `JWT_SECRET`
- `PORT`
- `NODE_ENV`
- `WORKER_CONCURRENCY`
- `FFMPEG_PATH`
- `STORAGE_PROVIDER`
- `CLOUDINARY_*`
- `S3_*`

แนวทางใช้งาน:

- local dev ใช้ `.env.development`
- production script ใช้ `.env.production`
- API, worker, Prisma และ queue ใช้ env ชุดเดียวกันเท่าที่จำเป็น

## 12. Request Flow

```text
Client request
  -> Elysia route
  -> schema validation
  -> plugin context (prisma/auth/queue)
  -> service
  -> repository
  -> PostgreSQL
  -> mapper / response DTO
  -> client
```

ตัวอย่าง:

- `GET /api/v1/collections`
  - controller รับ query
  - service เรียก repository
  - repository query `collection`
  - mapper แปลง row เป็น DTO
  - client ได้ list ของ collections

## 13. Media Pipeline

```text
Client uploads or creates media
  -> API creates Media row with PENDING
  -> API enqueues media job
  -> Worker consumes job
  -> FFmpeg / storage processing
  -> Worker updates Media row to READY or FAILED
```

หลักคิด:

- request ที่ช้าไม่ควรบล็อก user
- status ต้องอยู่ใน DB
- worker ต้อง idempotent พอสมควร

## 14. Feed Pipeline

```text
Content(role=SHORT|FULL)
  -> candidate generation
  -> ranking
  -> diversity pass
  -> impression tracking
  -> response to client
```

กติกาหลัก:

- short item ต้องมี warp ไป full target
- long item คือ full content ที่ขึ้น feed ได้ตรงๆ
- series ใช้ `Content.order` และ `Collection.fullMode`

## 15. Local Development Flow

1. เปิด infra

```bash
docker compose up -d postgres dragonfly
```

2. ติดตั้ง packages

```bash
bun install
```

3. generate Prisma client

```bash
bun run prisma:generate
```

4. migrate database

```bash
bun run db:migrate
```

5. seed data

```bash
bun run db:seed
```

6. เปิด API และ worker

```bash
bun run dev:api
bun run dev:worker
```

## 16. Dockerfile Guidance

แนวทางสำหรับ repo นี้:

- แยก `Dockerfile.api` และ `Dockerfile.worker`
- ใช้ multi-stage build
- install dependencies ที่ root ครั้งเดียว แล้วค่อย build target app
- copy เฉพาะไฟล์ที่ runtime ต้องใช้เข้า final image

ควร pack เข้า image:

- source ของ app เป้าหมาย
- shared packages ที่ app ใช้
- production dependencies
- Prisma client ที่ generate แล้ว
- Prisma schema และ migrations ถ้าต้องใช้ runtime/migrate

ควร prune ออก:

- `.git`
- `docs`
- test fixtures ที่ไม่ใช้ runtime
- local env files
- caches
- `node_modules` ที่เป็น dev-only หลัง build ถ้าใช้แยก stage

ควรวางไฟล์ประมาณนี้:

```text
/
├── Dockerfile.api
├── Dockerfile.worker
├── .dockerignore
├── apps/
├── packages/
└── package.json
```

## 17. สรุปสั้นที่สุด

ถ้าจะ onboard ตัวเองให้เร็ว ให้จำ 4 ประโยคนี้:

1. domain ปัจจุบันมีแค่ `Collection`, `Content`, `ContentWarp`
2. API รับ request และโยนงานหนักเข้า queue
3. worker ทำ media/analytics maintenance แยกจาก request path
4. Prisma schema ใน `packages/db` คือ source of truth ของ backend ทั้งหมด
