# Podkaap Backend Onboarding Technical Guide

เอกสารนี้เขียนสำหรับคนที่จะรับช่วงโปรเจกต์ต่อและอยากอ่านรอบเดียวแล้วเริ่ม implement feature ใหม่ได้ โดยอธิบายตาม codebase ปัจจุบันเท่านั้น

runtime ของโปรเจกต์ตอนนี้ใช้ model เดียว:

```text
Collection -> Content -> ContentWarp
```

## 1. Mental Model ที่ต้องจำก่อนอ่านโค้ด

### 1.1 Product นี้ทำอะไร

Podkaap เป็น backend สำหรับ product ที่เชื่อม:

- short-form discovery
- long-form playback
- continue watching

เป้าหมายคือให้ผู้ใช้:

1. เจอ short clip ใน feed
2. กดเข้า full content ได้ทันที
3. ถ้าออกจากแอปไปแล้วกลับมา ระบบต้องจำได้ว่าค้างตรงไหน

### 1.2 Domain หลัก

ระบบนี้มี 3 entity สำคัญที่สุด:

#### Collection

container ระดับ story หรือ content package

ตัวอย่างสิ่งที่ collection บอก:

- ชื่อเรื่อง
- คำอธิบาย
- รูปปก
- ว่า full content ข้างในเป็น `SINGLE` หรือ `SERIES`

#### Content

unit ที่เล่นได้จริง

มี 2 role:

- `SHORT`
- `FULL`

คิดง่ายๆ:

- `SHORT` = discovery clip
- `FULL` = content ยาวที่เปิดดู/ฟังจริง

#### ContentWarp

ตัวเชื่อมจาก short ไป full

มันบอกว่า:

- short ตัวไหน
- ต้องพาไป full ตัวไหน
- ควรเริ่มที่เวลาไหน

### 1.3 Single และ Series

ระบบนี้ไม่ได้มี model แยกสำหรับ single กับ series

ใช้ `Collection.fullMode` แทน:

- `SINGLE` = collection มี full content หลัก 1 ชิ้น
- `SERIES` = collection มี full content หลายชิ้น เรียงด้วย `Content.order`

ดังนั้นเวลาเราเห็น `FULL` หลายตัวใน collection เดียวกัน นั่นคือ series

## 2. Tech Stack แบบเข้าใจง่าย

### 2.1 Bun

ใช้เป็น:

- runtime
- package manager
- script runner

สิ่งที่ควรรู้:

- `bun run dev:api` คล้าย `npm run dev:api`
- `bun install` ติดตั้งทั้ง workspace จาก root

### 2.2 Elysia

web framework ของ API

ทำไมใช้:

- syntax สั้น
- plugin model ชัด
- route + schema ผูกกันได้ดี

เวลาเห็น:

- `new Elysia()` = สร้าง app หรือ sub-router
- `.use(...)` = mount plugin หรือ controller
- controller ใน repo นี้คือ Elysia instance ย่อยที่มี prefix ของตัวเอง

### 2.3 Prisma + PostgreSQL

Prisma ใช้เป็น ORM
PostgreSQL ใช้เป็น relational database

ข้อดี:

- relation ชัด
- type-safe query
- schema เป็น source of truth กลาง

### 2.4 BullMQ + Dragonfly

ใช้สำหรับ queue system

หลักคิด:

- API ไม่ควรทำงานหนักทุกอย่างใน request เดียว
- งานอย่าง transcode, extract thumbnail, recompute analytics ควรไป background

### 2.5 FFmpeg

ใช้สำหรับ media processing เช่น:

- extract thumbnail
- generate waveform
- transcode video

## 3. Architecture ภาพรวม

```text
Client
  -> API (Elysia)
      -> Prisma -> PostgreSQL
      -> BullMQ -> Dragonfly
                       -> Worker
                           -> FFmpeg / storage / Prisma
```

แปลเป็นภาษาง่าย:

1. client เรียก API
2. API ตอบข้อมูลหรือสร้าง job
3. ถ้าเป็นงานหนัก API จะ enqueue เข้า queue
4. worker ดึง job ไปทำ
5. worker update DB เมื่อเสร็จ

## 4. Hook to Full ในระบบใหม่ทำงานอย่างไร

ในเอกสาร product อาจยังใช้คำว่า hook
แต่ใน code ปัจจุบัน hook ถูกแทนด้วย `Content(role=SHORT)` แล้ว

flow:

```text
SHORT content
  -> client เห็นใน feed
  -> client กด continue
  -> backend ใช้ ContentWarp หา full target
  -> เปิด FULL content ที่ targetStartSeconds
```

ทำไมต้องแยก warp เป็น model:

- ทำให้ short กับ full ไม่ต้องผูกกันแบบ hard-coded
- เปลี่ยน navigation ได้ด้วย data
- 1 collection มี short หลายตัวที่พาไป full คนละจุดได้

## 5. Feed ทำงานอย่างไร

feed ปัจจุบันรองรับ 2 item types:

- `SHORT`
- `LONG`

### SHORT item

- มาจาก `Content(role=SHORT)`
- ต้องมี warp อย่างน้อยหนึ่งตัว
- response จะมี `targetContentId` และ `targetStartSeconds`

### LONG item

- มาจาก `Content(role=FULL)`
- ขึ้น feed ได้ตรงๆ
- ถ้า collection เป็น `SERIES` item นี้เป็น full ตอนหนึ่งในลำดับนั้น

### Feed Pipeline

flow หลัก:

1. candidate generation
2. ranking
3. diversity
4. impression tracking

candidate generation:

- query content ที่ขึ้น feed ได้
- short ต้องมี outgoing warp
- ตัด full content ที่ผู้ใช้ดูจบแล้วออกบางส่วนได้

ranking:

- ใช้ scores บน `Content`
- ดู continue conversion, completion, recency และ context ที่เกี่ยวข้อง

diversity:

- กันไม่ให้ collection เดียวขึ้นติดกันเยอะเกิน
- พยายามรักษาสมดุลระหว่าง short กับ long

tracking:

- เมื่อส่ง feed response แล้ว อาจเขียน `FeedEvent` ประเภท impression

## 6. Playback, Progress, Continue Watching

### 6.1 Playback Target

progress ของระบบนี้เก็บบน `Content(role=FULL)` เท่านั้น

นี่เป็นกติกาสำคัญ:

- short ใช้สำหรับ discovery
- full ใช้สำหรับ playback จริง

### 6.2 Progress

model:

- `UserProgress`

field สำคัญ:

- `userId`
- `contentId`
- `progressSeconds`
- `isComplete`
- `lastWatchedAt`

ใช้สำหรับ:

- resume playback
- continue watching rail
- filtering บางส่วนใน feed

### 6.3 Continue Watching

continue-watching จะอ่าน:

- progress ที่ยังไม่ complete
- full content ที่เกี่ยวข้อง
- collection ที่ content นั้นอยู่

response ที่ client ต้องใช้มักมี:

- content title
- collection title
- cover
- current progress
- duration
- percent complete

### 6.4 Next Content

สำหรับ series:

- ใช้ `Collection.fullMode === SERIES`
- ใช้ `Content.order` หา full ตอนถัดไป

route ที่ใช้คือ:

- `GET /api/v1/contents/:id/next`

## 7. Analytics ทำงานอย่างไร

analytics event หลักอยู่ใน model:

- `FeedEvent`

field สำคัญ:

- `userId`
- `contentId`
- `targetContentId`
- `eventType`

แนวคิด:

- `contentId` คือ content ที่เป็น subject ของ event
- `targetContentId` ใช้เมื่อ action มีปลายทาง เช่น short พาไป full

ตัวอย่าง event:

- `IMPRESSION`
- `VIEW_START`
- `WATCH_PROGRESS`
- `VIEW_COMPLETE`
- `CONTINUE_CLICK`
- `FULL_START`
- `FULL_COMPLETE`
- `SKIP`
- `REACTION`

analytics worker jobs ใช้ข้อมูลพวกนี้เพื่อ:

- recompute content scores
- update trending signals

## 8. Media Pipeline

media model:

- `Media`

field สำคัญ:

- `originalUrl`
- `processedUrl`
- `thumbnailUrl`
- `waveformUrl`
- `status`
- `errorMessage`

status หลัก:

- `PENDING`
- `PROCESSING`
- `READY`
- `FAILED`

flow:

1. API สร้าง media row
2. API enqueue media job
3. worker consume job
4. FFmpeg/process/storage ทำงาน
5. worker update media row ตามผลลัพธ์

## 9. Registry ของ apps และ packages

### 9.1 apps/api

#### `apps/api/src/server.ts`

เริ่ม server และ log:

- API base URL
- docs URL
- current environment

#### `apps/api/src/app.ts`

ไฟล์แกนของ API

ทำหน้าที่:

- สร้าง Elysia app
- mount Swagger docs
- mount root route `/`
- ติด logger plugin
- register global error handling
- mount route registry

#### `apps/api/src/routes/index.ts`

รวม route modules ใต้ `/api/v1`

ปัจจุบัน mount:

- `health`
- `collections`
- `contents`
- `progress`
- `continue-watching`
- `reactions`
- `feed`
- `analytics`
- `media`

#### `apps/api/src/config/*`

- `env.ts` อ่านและ validate env
- `app-config.ts` สร้าง config object สำหรับ runtime
- `constants.ts` เก็บ business constants

#### `apps/api/src/common/*`

- `dto/index.ts` re-export DTOs
- `errors/index.ts` shared error helpers
- `guards/index.ts` reusable guards
- `types/index.ts` local shared types
- `utils/pagination.ts` pagination helpers

#### `apps/api/src/plugins/*`

- `prisma.ts` inject Prisma client
- `queue.ts` inject queues
- `auth.ts` inject auth context
- `logger.ts` request logging
- `storage.ts` inject storage abstraction

#### `apps/api/src/jobs/*`

maintenance jobs ที่รันจาก API side ได้:

- cleanup analytics events
- recompute content scores
- update trending

### 9.2 apps/api modules

#### `health`

ใช้เช็กว่า API และ DB พร้อมหรือไม่

#### `collections`

ใช้สำหรับ:

- list collections
- get collection detail
- list contents ภายใต้ collection

#### `contents`

ใช้สำหรับ:

- get content detail
- get content warps
- get next full content ใน collection

#### `progress`

ใช้สำหรับ:

- create/update progress
- get progress ของ user ต่อ full content
- mark complete

#### `continue-watching`

ใช้คืน rail ของ full contents ที่ user ดูค้างไว้

#### `reactions`

ใช้บันทึก reaction และสรุป reactions ของ content target

#### `feed`

โมดูลที่ซับซ้อนที่สุดใน API

ประกอบด้วย:

- repository สำหรับ query candidates
- candidate service สำหรับ normalize data
- ranking service สำหรับคำนวณลำดับ
- diversity service สำหรับกระจายผลลัพธ์
- controller สำหรับ response และ tracking

#### `analytics`

รับ analytics events จาก client แล้วเขียนลง DB หรือส่งต่อเข้า queue ตาม flow ที่กำหนด

#### `media`

สร้าง media record และ kick off processing jobs

### 9.3 apps/worker

#### `apps/worker/src/worker.ts`

entrypoint ของ worker

ทำหน้าที่:

- เปิด media worker
- เปิด analytics worker
- route job ตาม `QueueName` และ `JobName`
- handle graceful shutdown

#### `apps/worker/src/config/env.ts`

อ่าน worker env เช่น:

- `DATABASE_URL`
- `DRAGONFLY_URL`
- `WORKER_CONCURRENCY`
- `FFMPEG_PATH`

#### `apps/worker/src/jobs/*`

- `process-video.ts`
- `extract-thumbnail.ts`
- `generate-waveform.ts`
- `transcode-video.ts`
- `analytics.ts`

#### `apps/worker/src/services/*`

- `prisma.service.ts` shared Prisma access
- `ffmpeg-runner.ts` wrapper สำหรับ FFmpeg
- `storage.service.ts` upload abstraction

### 9.4 packages/db

#### `prisma/schema.prisma`

source of truth ของ data model

#### `prisma.config.ts`

Prisma 7 config

#### `src/client.ts`

สร้าง Prisma client ด้วย `@prisma/adapter-pg`

#### `prisma/seed.ts`

seed canonical data สำหรับ local dev

### 9.5 packages/queue

#### `src/job-types.ts`

นิยาม payload ของ jobs ทั้งหมด

#### `src/queues.ts`

queue factories

#### `src/connection.ts`

shared Dragonfly/Redis connection

### 9.6 packages/shared

#### `src/enums/index.ts`

enum กลาง เช่น:

- `Emotion`
- `TargetType`
- `FeedEventType`
- `MediaStatus`
- `CollectionFullMode`
- `ContentRole`
- `PlaybackKind`

#### `src/types/index.ts`

DTOs กลางที่ API ใช้ตอบ client

## 10. Core Files แบบอธิบายทีละบล็อก

### 10.1 `apps/api/src/app.ts`

ไฟล์นี้สำคัญมาก เพราะเป็นจุดที่ app ถูกประกอบขึ้นจริง

ลำดับที่ไฟล์นี้ทำงาน:

1. import framework และ plugin ที่จำเป็น
2. สร้าง Elysia app
3. mount Swagger docs
4. mount root route `/`
5. mount logger
6. ตั้ง global error handling
7. mount API routes ใต้ `/api/v1`

เหตุผลที่ไฟล์นี้สำคัญ:

- ถ้าจะรู้ว่า request วิ่งเข้าระบบอย่างไร ต้องเริ่มที่นี่
- ถ้าจะเพิ่ม global behavior เช่น docs, root response, error policy ต้องเริ่มที่นี่

### 10.2 `apps/api/src/routes/index.ts`

หน้าที่คือรวมทุก controller ย่อยเข้าด้วยกัน

ลำดับการอ่าน:

1. ดู imports เพื่อรู้ว่ามี module อะไรบ้าง
2. ดู prefix `/api/v1`
3. ดู `.use(...)` เพื่อรู้ route ที่ mount จริง

ถ้าคุณเพิ่ม module ใหม่:

- ต้อง export controller จาก module
- แล้วมา `.use(...)` ที่ไฟล์นี้

### 10.3 `packages/db/prisma/schema.prisma`

นี่คือ source of truth ที่แท้จริงของ backend

สิ่งที่ควรอ่านเรียง:

1. enums
2. `Collection`
3. `Content`
4. `ContentWarp`
5. `UserProgress`
6. `FeedEvent`
7. `Media`

วิธีอ่าน:

- อ่าน field names ก่อน
- อ่าน relations ต่อ
- ดูว่า model ไหนเป็น owner ของ foreign key
- ดูว่าธุรกิจใช้ model นี้ทำอะไร

### 10.4 `apps/worker/src/worker.ts`

ไฟล์นี้ประกอบ worker ทั้งระบบ

ลำดับที่ทำงาน:

1. โหลด env
2. สร้าง Redis connection
3. สร้าง worker สำหรับแต่ละ queue
4. map job name ไป handler
5. ตั้ง shutdown flow

ถ้าคุณจะเพิ่ม job ใหม่:

1. เพิ่ม payload type ใน `packages/queue`
2. เพิ่ม queue/job name ถ้ายังไม่มี
3. เขียน handler ใน `apps/worker/src/jobs`
4. ผูก handler ใน `worker.ts`
5. enqueue จาก API

## 11. Request Lifecycle

```text
Request
  -> Elysia route
  -> schema validation
  -> plugin context
  -> controller
  -> service
  -> repository
  -> Prisma
  -> PostgreSQL
  -> mapper / DTO
  -> response
```

หลักคิด:

- controller ไม่ควรแบก business logic เยอะ
- repository ไม่ควรรู้เรื่อง HTTP
- DTO ไม่ควร expose raw Prisma internals แบบไม่จำเป็น

## 12. Quality Control Pipeline

ตอน develop และ commit ระบบตรวจหลักๆ แบบนี้:

### Biome

ใช้สำหรับ:

- lint
- format
- import/order/style checks หลักของ codebase

### ESLint

ตอนนี้ใช้ตรวจ JS config เป็นหลัก

### typecheck

`typecheck:workspaces` ใช้เช็กทุก workspace ที่มี TypeScript

### husky + lint-staged

ก่อน commit:

1. lint เฉพาะ staged files
2. run typecheck

จุดประสงค์คือกันของพังเข้าประวัติเร็วที่สุด

## 13. ถ้าจะเพิ่ม feature ใหม่ ควรอ่านอะไรก่อน

### ถ้าจะเพิ่ม feature ด้าน collection/story page

อ่านก่อน:

1. `schema.prisma`
2. `collections/*`
3. `contents/*`
4. `packages/shared/src/types/index.ts`

### ถ้าจะเพิ่ม feature ด้าน feed

อ่านก่อน:

1. `feed.repository.ts`
2. `feed-candidate.service.ts`
3. `feed-ranking.service.ts`
4. `feed-diversity.service.ts`
5. `analytics/*`

### ถ้าจะเพิ่ม feature ด้าน playback / continue watching

อ่านก่อน:

1. `progress/*`
2. `continue-watching/*`
3. `contents.service.ts`
4. `schema.prisma` ส่วน `UserProgress`

### ถ้าจะเพิ่ม feature ด้าน media

อ่านก่อน:

1. `media/*`
2. `packages/queue/src/job-types.ts`
3. `apps/worker/src/worker.ts`
4. `apps/worker/src/jobs/*`
5. `Media` model ใน schema

## 14. Best Practices สำหรับโปรเจกต์นี้

แนวทางที่ควรยึด:

- เริ่มจาก schema และ response shape ก่อน
- อย่ากระโดดเขียน controller ก่อนคิด use case
- ถ้าฟีเจอร์แตะ queue ให้ define payload type ก่อน
- ถ้าต้องเพิ่ม route ให้เพิ่ม schema validation พร้อมกัน
- ถ้าต้องเพิ่ม data shape ให้คิด DTO กลางก่อน
- ถ้าต้องเพิ่ม feed logic ให้คิด analytics impact ด้วย

## 15. สรุปสั้นที่สุดสำหรับการเริ่มงาน

ถ้าวันนี้คุณเพิ่งกลับมาอ่าน repo นี้อีกครั้ง ให้ทำตามนี้:

1. เปิด `packages/db/prisma/schema.prisma`
2. เปิด `apps/api/src/routes/index.ts`
3. เลือก module ที่เกี่ยวกับ feature ที่จะทำ
4. ไล่จาก controller -> service -> repository
5. ถ้าเป็น async flow ให้ตามต่อถึง `packages/queue` และ `apps/worker`

ถ้าจำได้แค่อย่างเดียว ให้จำว่า:

> `Collection` คือ story container, `Content` คือ unit ที่เล่นจริง, และ `ContentWarp` คือทางเชื่อมจาก short ไป full
