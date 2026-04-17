# Podkaap Backend Onboarding Technical Guide

เอกสารนี้ตั้งใจเขียนให้คนที่รับช่วงโปรเจกต์ต่อเข้าใจ codebase ปัจจุบันได้เร็ว โดยอธิบายตาม architecture ล่าสุดเท่านั้น

## 1. สิ่งที่ต้องจำก่อนอ่านโค้ด

domain หลักของระบบมี 3 ตัว:

- `Collection`
- `Content`
- `ContentWarp`

และ runtime หลักมี 3 service roles:

- API
- worker
- optional Python feed service

## 2. Mental Model ของระบบ

Podkaap เชื่อม 3 ประสบการณ์เข้าด้วยกัน:

- discovery ผ่าน `SHORT`
- playback ผ่าน `FULL`
- resume ผ่าน `UserProgress`

สิ่งที่ควรจำ:

- `Collection` คือ container ของเรื่อง
- `Content(role=SHORT)` คือ discovery clip
- `Content(role=FULL)` คือ content ที่เล่นจริง
- `ContentWarp` คือ jump จาก short ไป full target

## 3. Tech Stack แบบสั้นและตรง

- `Bun` = runtime + package manager
- `Elysia` = API framework
- `Prisma + PostgreSQL` = database layer
- `BullMQ + Dragonfly` = async job queue
- `FFmpeg` = media processing
- `Python gRPC feed service` = optional feed decision engine

## 4. Architecture ภาพรวม

```text
Client
  -> API
      -> PostgreSQL via Prisma
      -> BullMQ -> Dragonfly -> Worker
      -> gRPC -> Python Feed Service
```

คำอธิบาย:

- API เป็น owner ของ DB access และ frontend contract
- worker ทำ async jobs
- Python feed service รับ candidate list จาก API แล้วทำ decision logic

## 5. Feed ทำงานอย่างไรตอนนี้

feed มี 2 lanes:

- `SHORT`
- `LONG`

flow:

1. API query candidates จาก `Content`
2. API query user context เช่น emotion preferences
3. API เลือก engine
   - local TypeScript engine
   - หรือ Python gRPC engine
4. engine คืนลำดับ `contentId` + score
5. API map เป็น final response
6. API record impressions

### สิ่งสำคัญ

Python feed service:

- ทำ filtering
- ทำ scoring
- ทำ ranking
- ทำ diversity

แต่:

- ไม่ query DB
- ไม่ทำ auth
- ไม่คืน frontend DTO โดยตรง

## 6. Playback และ Continue Watching

- progress เก็บบน `Content(role=FULL)` เท่านั้น
- continue-watching อ่านจาก `UserProgress`
- next content ใน series หาโดย `Collection.fullMode` และ `Content.order`

## 7. Media Pipeline

flow:

1. API สร้าง `Media` row
2. API enqueue media job
3. worker ดึง job ไปทำ
4. FFmpeg / storage ทำงาน
5. worker update status เป็น `READY` หรือ `FAILED`

## 8. Registry ของส่วนสำคัญ

### API

- [apps/api/src/app.ts](/mnt/d/dev-workspace/podkaap/pod-kaab-service/apps/api/src/app.ts)
- [apps/api/src/server.ts](/mnt/d/dev-workspace/podkaap/pod-kaab-service/apps/api/src/server.ts)
- [apps/api/src/routes/index.ts](/mnt/d/dev-workspace/podkaap/pod-kaab-service/apps/api/src/routes/index.ts)

feed files:

- [apps/api/src/modules/feed/feed.repository.ts](/mnt/d/dev-workspace/podkaap/pod-kaab-service/apps/api/src/modules/feed/feed.repository.ts)
- [apps/api/src/modules/feed/feed.service.ts](/mnt/d/dev-workspace/podkaap/pod-kaab-service/apps/api/src/modules/feed/feed.service.ts)
- [apps/api/src/modules/feed/feed-local-engine.service.ts](/mnt/d/dev-workspace/podkaap/pod-kaab-service/apps/api/src/modules/feed/feed-local-engine.service.ts)
- [apps/api/src/modules/feed/feed-remote-engine.service.ts](/mnt/d/dev-workspace/podkaap/pod-kaab-service/apps/api/src/modules/feed/feed-remote-engine.service.ts)

### Worker

- [apps/worker/src/worker.ts](/mnt/d/dev-workspace/podkaap/pod-kaab-service/apps/worker/src/worker.ts)
- `apps/worker/src/jobs/*`

### Python Feed Service

- [apps/feed-service-python/app.py](/mnt/d/dev-workspace/podkaap/pod-kaab-service/apps/feed-service-python/app.py)
- [apps/feed-service-python/feed_engine.py](/mnt/d/dev-workspace/podkaap/pod-kaab-service/apps/feed-service-python/feed_engine.py)
- [proto/feed.proto](/mnt/d/dev-workspace/podkaap/pod-kaab-service/proto/feed.proto)

### DB

- [packages/db/prisma/schema.prisma](/mnt/d/dev-workspace/podkaap/pod-kaab-service/packages/db/prisma/schema.prisma)

## 9. ถ้าจะเริ่มอ่าน feed ให้เปิดอะไรบ้าง

อ่านตามนี้:

1. `schema.prisma`
2. `feed.repository.ts`
3. `feed.service.ts`
4. `feed-local-engine.service.ts`
5. `feed-remote-engine.service.ts`
6. `proto/feed.proto`
7. `apps/feed-service-python/feed_engine.py`

## 10. ถ้าจะเพิ่ม feature ใหม่ควรระวังอะไร

- ถ้า feature แตะ feed ต้องถามก่อนว่าอยู่ฝั่ง API หรือ Python service
- ถ้าเปลี่ยน cross-service shape ต้องเริ่มจาก `proto/feed.proto`
- อย่าให้ Python service query DB เอง
- อย่าให้ worker รับงาน synchronous path ของ feed

## 11. Tooling ที่เกี่ยวกับ Python

- `pylint` ใช้ lint Python service
- `Biome` ไม่อ่าน `*.py`
- pre-commit จะรัน `pylint` กับ staged Python files

## 12. สรุปสั้นที่สุด

ถ้าจะจำแค่ไม่กี่อย่าง:

1. API เป็น owner ของ data access
2. worker เป็น owner ของ async jobs
3. Python feed service เป็น owner ของ feed decision logic แบบ optional
4. source of truth ของ domain ยังอยู่ที่ Prisma schema
