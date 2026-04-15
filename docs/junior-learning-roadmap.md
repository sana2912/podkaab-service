# Podkaap Junior Learning Roadmap

เอกสารนี้สรุป roadmap สำหรับคนที่เพิ่งเข้ามารับช่วงโปรเจกต์ Podkaap Backend และยังไม่คุ้นกับ stack อย่าง `Bun`, `Elysia`, `Prisma`, `BullMQ`, `Dragonfly`, `FFmpeg` หรือระบบ streaming/content platform มาก่อน

เป้าหมายของ roadmap นี้ไม่ใช่ทำให้เข้าใจทั้งระบบในวันเดียว แต่ทำให้:

- อ่าน code แล้วไม่หลง
- รู้ว่าควรเริ่มจากตรงไหน
- เริ่มแก้ feature เล็กๆ ได้อย่างมั่นใจ
- ค่อยๆ ขยับไปแตะ feature ที่ยากขึ้นโดยไม่พัง flow หลัก

## 1. ประเมินแบบตรงไปตรงมา

โปรเจกต์นี้:

- ไม่ใช่โปรเจกต์เล็ก
- แต่ยังไม่ใหญ่เกินกว่าจะเรียนรู้ได้
- โครงสร้างค่อนข้างเป็นระเบียบ
- มีหลายชั้นของความเข้าใจที่ต้องค่อยๆ เก็บ

สิ่งที่ทำให้โปรเจกต์นี้ดูยากสำหรับ junior:

- มีทั้ง API และ worker
- มี DB, queue, analytics, media pipeline
- มี domain เฉพาะของ product เช่น short discovery, full playback, progress, continue-watching

สิ่งที่ทำให้ยังเรียนรู้ได้:

- โครงสร้าง folder ชัด
- module pattern สม่ำเสมอ
- Prisma schema อ่านแล้วเห็น domain ชัด
- docs ตอนนี้ถูกจัดให้ยึด model เดียวคือ `Collection / Content / ContentWarp`

สรุปสั้น:

> ยากแบบค่อยๆ เรียนรู้ได้ ไม่ใช่ยากแบบเข้าไม่ถึง

## 2. สิ่งที่ต้องเข้าใจก่อนในหัว

ก่อนแตะ code ให้จำ 3 ประโยคนี้:

1. `Collection` คือ story container
2. `Content` คือ unit ที่เล่นจริง และมีทั้ง `SHORT` กับ `FULL`
3. `ContentWarp` คือทางเชื่อมจาก short ไป full

ถ้ายังจำ 3 อย่างนี้ไม่ได้ อย่าเพิ่งไปอ่าน worker หรือ feed ranking เพราะจะงงเร็วมาก

## 3. ลำดับการอ่าน docs

ถ้าจะเริ่มจาก `/docs` ให้เรียงแบบนี้:

1. [collection-content-direction.md](/mnt/d/dev-workspace/podkaap/pod-kaab-service/docs/collection-content-direction.md)
2. [project-structure-overview.md](/mnt/d/dev-workspace/podkaap/pod-kaab-service/docs/project-structure-overview.md)
3. [onboarding-technical-guide.md](/mnt/d/dev-workspace/podkaap/pod-kaab-service/docs/onboarding-technical-guide.md)
4. [design-review-before-implementation.md](/mnt/d/dev-workspace/podkaap/pod-kaab-service/docs/design-review-before-implementation.md)
5. [technical-debt-priority-guide.md](/mnt/d/dev-workspace/podkaap/pod-kaab-service/docs/technical-debt-priority-guide.md)

วิธีคิด:

- file แรกเอาไว้เข้าใจ domain
- file ที่สองเอาไว้เข้าใจ repo
- file ที่สามเอาไว้เข้าใจ flow
- file ที่สี่เอาไว้ใช้ก่อนเริ่ม implement
- file ที่ห้าเอาไว้รู้ว่าจุดไหนเปราะและยังไม่ควรแตะมั่ว

## 4. 7-Day Learning Roadmap

## Day 1

โฟกัส:

- เข้าใจว่า product นี้ทำอะไร
- เข้าใจว่า data หลักของระบบคืออะไร

อ่านตามนี้:

1. [collection-content-direction.md](/mnt/d/dev-workspace/podkaap/pod-kaab-service/docs/collection-content-direction.md)
2. [project-structure-overview.md](/mnt/d/dev-workspace/podkaap/pod-kaab-service/docs/project-structure-overview.md)
3. [schema.prisma](/mnt/d/dev-workspace/podkaap/pod-kaab-service/packages/db/prisma/schema.prisma)

สิ่งที่ต้องตอบให้ตัวเองได้:

- `Collection` ใช้แทนอะไรในเชิงธุรกิจ
- `Content(role=SHORT)` กับ `Content(role=FULL)` ต่างกันยังไง
- `ContentWarp` ใช้เชื่อมอะไร
- `UserProgress`, `FeedEvent`, `Media` ทำหน้าที่อะไร
- repo แบ่ง `apps` กับ `packages` ยังไง

## Day 2

โฟกัส:

- เข้าใจ request flow ของ API

อ่านตามนี้:

1. [onboarding-technical-guide.md](/mnt/d/dev-workspace/podkaap/pod-kaab-service/docs/onboarding-technical-guide.md)
2. [app.ts](/mnt/d/dev-workspace/podkaap/pod-kaab-service/apps/api/src/app.ts)
3. [routes/index.ts](/mnt/d/dev-workspace/podkaap/pod-kaab-service/apps/api/src/routes/index.ts)
4. [server.ts](/mnt/d/dev-workspace/podkaap/pod-kaab-service/apps/api/src/server.ts)
5. plugin files:
   - [prisma.ts](/mnt/d/dev-workspace/podkaap/pod-kaab-service/apps/api/src/plugins/prisma.ts)
   - [auth.ts](/mnt/d/dev-workspace/podkaap/pod-kaab-service/apps/api/src/plugins/auth.ts)
   - [queue.ts](/mnt/d/dev-workspace/podkaap/pod-kaab-service/apps/api/src/plugins/queue.ts)

สิ่งที่ต้องตอบให้ตัวเองได้:

- request เข้ามาที่ไหน
- route ถูก mount ที่ไหน
- controller, service, repository แบ่งงานยังไง
- Prisma กับ queue ถูก inject เข้าระบบยังไง

## Day 3

โฟกัส:

- ตาม 2 flow หลักของระบบให้จบ

### Playback Flow

อ่านตามนี้:

1. [progress.controller.ts](/mnt/d/dev-workspace/podkaap/pod-kaab-service/apps/api/src/modules/progress/progress.controller.ts)
2. [progress.service.ts](/mnt/d/dev-workspace/podkaap/pod-kaab-service/apps/api/src/modules/progress/progress.service.ts)
3. [progress.repository.ts](/mnt/d/dev-workspace/podkaap/pod-kaab-service/apps/api/src/modules/progress/progress.repository.ts)
4. [continue-watching.controller.ts](/mnt/d/dev-workspace/podkaap/pod-kaab-service/apps/api/src/modules/continue-watching/continue-watching.controller.ts)
5. [continue-watching.service.ts](/mnt/d/dev-workspace/podkaap/pod-kaab-service/apps/api/src/modules/continue-watching/continue-watching.service.ts)
6. [continue-watching.repository.ts](/mnt/d/dev-workspace/podkaap/pod-kaab-service/apps/api/src/modules/continue-watching/continue-watching.repository.ts)
7. [contents.service.ts](/mnt/d/dev-workspace/podkaap/pod-kaab-service/apps/api/src/modules/contents/contents.service.ts)

### Feed Flow

อ่านตามนี้:

1. [feed.controller.ts](/mnt/d/dev-workspace/podkaap/pod-kaab-service/apps/api/src/modules/feed/feed.controller.ts)
2. [feed.service.ts](/mnt/d/dev-workspace/podkaap/pod-kaab-service/apps/api/src/modules/feed/feed.service.ts)
3. [feed.repository.ts](/mnt/d/dev-workspace/podkaap/pod-kaab-service/apps/api/src/modules/feed/feed.repository.ts)
4. [feed-candidate.service.ts](/mnt/d/dev-workspace/podkaap/pod-kaab-service/apps/api/src/modules/feed/feed-candidate.service.ts)
5. [feed-ranking.service.ts](/mnt/d/dev-workspace/podkaap/pod-kaab-service/apps/api/src/modules/feed/feed-ranking.service.ts)
6. [feed-diversity.service.ts](/mnt/d/dev-workspace/podkaap/pod-kaab-service/apps/api/src/modules/feed/feed-diversity.service.ts)

สิ่งที่ต้องตอบให้ตัวเองได้:

- progress ถูกเขียนและอ่านยังไง
- continue-watching ใช้ data อะไร
- next content หาอย่างไร
- short กับ long ต่างกันยังไงใน feed
- feed ผ่าน candidate, ranking, diversity ยังไง

## Day 4

โฟกัส:

- เข้าใจ worker และ queue system

อ่านตามนี้:

1. [worker.ts](/mnt/d/dev-workspace/podkaap/pod-kaab-service/apps/worker/src/worker.ts)
2. [job-types.ts](/mnt/d/dev-workspace/podkaap/pod-kaab-service/packages/queue/src/job-types.ts)
3. [queues.ts](/mnt/d/dev-workspace/podkaap/pod-kaab-service/packages/queue/src/queues.ts)
4. [connection.ts](/mnt/d/dev-workspace/podkaap/pod-kaab-service/packages/queue/src/connection.ts)
5. [prisma.service.ts](/mnt/d/dev-workspace/podkaap/pod-kaab-service/apps/worker/src/services/prisma.service.ts)

สิ่งที่ต้องตอบให้ตัวเองได้:

- API ส่งงานเข้า queue ยังไง
- worker รู้ได้ยังไงว่า job ไหนต้องเรียก handler ไหน
- payload ของแต่ละ job อยู่ตรงไหน

## Day 5

โฟกัส:

- เข้าใจ media processing pipeline

อ่านตามนี้:

1. [media.controller.ts](/mnt/d/dev-workspace/podkaap/pod-kaab-service/apps/api/src/modules/media/media.controller.ts)
2. [media.service.ts](/mnt/d/dev-workspace/podkaap/pod-kaab-service/apps/api/src/modules/media/media.service.ts)
3. [media.repository.ts](/mnt/d/dev-workspace/podkaap/pod-kaab-service/apps/api/src/modules/media/media.repository.ts)
4. [process-video.ts](/mnt/d/dev-workspace/podkaap/pod-kaab-service/apps/worker/src/jobs/process-video.ts)
5. [extract-thumbnail.ts](/mnt/d/dev-workspace/podkaap/pod-kaab-service/apps/worker/src/jobs/extract-thumbnail.ts)
6. [generate-waveform.ts](/mnt/d/dev-workspace/podkaap/pod-kaab-service/apps/worker/src/jobs/generate-waveform.ts)
7. [transcode-video.ts](/mnt/d/dev-workspace/podkaap/pod-kaab-service/apps/worker/src/jobs/transcode-video.ts)
8. [ffmpeg-runner.ts](/mnt/d/dev-workspace/podkaap/pod-kaab-service/apps/worker/src/services/ffmpeg-runner.ts)
9. [storage.service.ts](/mnt/d/dev-workspace/podkaap/pod-kaab-service/apps/worker/src/services/storage.service.ts)

สิ่งที่ต้องตอบให้ตัวเองได้:

- media row ถูกสร้างเมื่อไร
- status `PENDING/PROCESSING/READY/FAILED` ถูกเปลี่ยนตรงไหน
- worker ใช้ FFmpeg และ storage ยังไง

## Day 6

โฟกัส:

- เข้าใจ analytics และ score flow

อ่านตามนี้:

1. [analytics.controller.ts](/mnt/d/dev-workspace/podkaap/pod-kaab-service/apps/api/src/modules/analytics/analytics.controller.ts)
2. [analytics.service.ts](/mnt/d/dev-workspace/podkaap/pod-kaab-service/apps/api/src/modules/analytics/analytics.service.ts)
3. [analytics.repository.ts](/mnt/d/dev-workspace/podkaap/pod-kaab-service/apps/api/src/modules/analytics/analytics.repository.ts)
4. [analytics.schema.ts](/mnt/d/dev-workspace/podkaap/pod-kaab-service/apps/api/src/modules/analytics/analytics.schema.ts)
5. [analytics.ts](/mnt/d/dev-workspace/podkaap/pod-kaab-service/apps/worker/src/jobs/analytics.ts)
6. [recompute-hook-scores.ts](/mnt/d/dev-workspace/podkaap/pod-kaab-service/apps/api/src/jobs/recompute-hook-scores.ts)
7. [update-trending.ts](/mnt/d/dev-workspace/podkaap/pod-kaab-service/apps/api/src/jobs/update-trending.ts)

สิ่งที่ต้องตอบให้ตัวเองได้:

- client ส่ง event แบบไหนเข้ามา
- `FeedEvent` ถูกเขียนอย่างไร
- score ถูก recompute อย่างไร
- analytics มีผลกับ feed ยังไง

## Day 7

โฟกัส:

- เริ่มคิดแบบคน implement feature

อ่านตามนี้:

1. [design-review-before-implementation.md](/mnt/d/dev-workspace/podkaap/pod-kaab-service/docs/design-review-before-implementation.md)
2. [technical-debt-priority-guide.md](/mnt/d/dev-workspace/podkaap/pod-kaab-service/docs/technical-debt-priority-guide.md)
3. [types/index.ts](/mnt/d/dev-workspace/podkaap/pod-kaab-service/packages/shared/src/types/index.ts)
4. [enums/index.ts](/mnt/d/dev-workspace/podkaap/pod-kaab-service/packages/shared/src/enums/index.ts)

แบบฝึกหัดที่แนะนำ:

- ลองออกแบบ feature `Favorite Content` ในกระดาษหรือ note สั้นๆ
- ตอบให้ได้ว่า:
  - ใช้ `contentId` หรือ `collectionId`
  - ต้องเพิ่ม schema ไหม
  - route ควรอยู่ module ไหน
  - response shape ต้องมีอะไร

## 5. Feature Roadmap สำหรับ Junior

## งานแรกที่เหมาะสุด

ควรเป็นงานที่:

- read-only หรือ mutation น้อย
- ไม่แตะ queue/worker
- ไม่แตะ ranking ลึก
- ไม่ต้องแก้ schema ใหญ่

### ตัวเลือกที่ดี

#### 1. เพิ่ม field ใน collection/content response

ตัวอย่าง:

- `shortCount`
- `fullCount`
- `hasMoreInSeries`
- `primaryFullContentId`

เหตุผลที่เหมาะ:

- ได้ฝึก `schema -> repository -> mapper -> DTO`
- ไม่เสี่ยงพัง flow หลัก
- เห็น pattern การส่ง response ของระบบ

ไฟล์ที่มักต้องแตะ:

- [collections.repository.ts](/mnt/d/dev-workspace/podkaap/pod-kaab-service/apps/api/src/modules/collections/collections.repository.ts)
- [collections.mapper.ts](/mnt/d/dev-workspace/podkaap/pod-kaab-service/apps/api/src/modules/collections/collections.mapper.ts)
- [types/index.ts](/mnt/d/dev-workspace/podkaap/pod-kaab-service/packages/shared/src/types/index.ts)

#### 2. เพิ่ม endpoint read-only เล็กๆ

ตัวอย่าง:

- `GET /collections/:id/shorts`
- `GET /collections/:id/fulls`
- `GET /contents/:id/collection`
- `GET /contents/:id/related`

เหตุผลที่เหมาะ:

- ได้ฝึก route/module pattern
- ได้ฝึก schema validation
- risk ต่ำ

#### 3. เพิ่ม reaction summary ให้ละเอียดขึ้น

ตัวอย่าง:

- คืน counts แยกตาม emotion
- คืน `viewerReaction` ถ้ามี user context

เหตุผลที่เหมาะ:

- ได้ฝึก business logic ระดับกลาง
- ได้แตะ aggregation และ DTO โดยไม่หนักเกินไป

## งานที่สองที่เหมาะ

หลังจากเริ่มจับ pattern ได้แล้ว ค่อยขยับไปงานที่มี state มากขึ้น

### 1. Favorite Content

นี่คือ feature ที่เหมาะมากสำหรับงานที่สอง

เหตุผล:

- มี value จริง
- ได้ฝึก schema design
- ได้ฝึก CRUD
- ได้ฝึก auth + DTO + API design
- ยังไม่ต้องแตะ queue หรือ feed core มากเกินไป

สิ่งที่ต้องคิด:

- favorite ผูกกับ `contentId` หรือ `collectionId`
- ใช้ create/delete แยก หรือ toggle endpoint
- จะมี list favorites ไหม

### 2. Improve continue-watching response

ตัวอย่าง:

- เพิ่ม `nextContentId`
- เพิ่ม `canResume`
- เพิ่ม `isNearCompletion`

เหตุผล:

- ได้แตะ core flow ของ product
- แต่ยังควบคุมขอบเขตได้

### 3. Improve content detail API

ตัวอย่าง:

- เพิ่ม collection context
- เพิ่ม warp summary
- เพิ่ม next/previous navigation info

เหตุผล:

- ฝึกออกแบบ response สำหรับ frontend
- ยังไม่แตะ worker หรือ analytics ลึก

## งานที่ยังไม่ควรแตะก่อน

### 1. Feed ranking logic

เช่น:

- ปรับ score formula
- เปลี่ยน diversity strategy
- เปลี่ยน candidate filtering

เหตุผลที่ยังไม่ควร:

- subtle มาก
- เปลี่ยนนิดเดียว behavior เปลี่ยนเยอะ
- debug ยาก

### 2. Media processing pipeline

เช่น:

- เปลี่ยน FFmpeg flow
- เปลี่ยน transcode strategy
- เปลี่ยน storage integration

เหตุผลที่ยังไม่ควร:

- มีหลาย moving parts
- พึ่ง external tools
- มี state transitions และ queue

### 3. Analytics semantics หรือ scoring jobs

เช่น:

- เพิ่ม event ใหม่ที่มีผลกับ ranking
- เปลี่ยน recompute logic
- เปลี่ยน trending calculation

เหตุผลที่ยังไม่ควร:

- กระทบ data pipeline หลายชั้น
- ถ้าคิด semantics ไม่ชัด จะสร้างหนี้ระยะยาว

## 6. ถ้าจะให้เลือก feature แรกจริงๆ

ผมแนะนำ 2 ตัวเลือกนี้มากที่สุด:

1. เพิ่ม field summary ให้ collection/content response
2. เพิ่ม `GET /collections/:id/shorts`

เพราะ:

- ปลอดภัย
- เรียนรู้ pattern ของ repo ได้เร็ว
- ไม่ทำให้เสียความมั่นใจจาก bug ยากๆ เร็วเกินไป

## 7. ถ้าจะให้เลือก feature ที่สอง

ผมแนะนำ:

- `Favorite Content`

เพราะเป็นงานที่ดีมากสำหรับการโตใน codebase นี้:

- ต้องคิด schema
- ต้องคิด relation
- ต้องคิด route
- ต้องคิด auth
- ต้องคิด response shape

แต่ยังไม่ลากคุณไปสู่ area ที่เปราะที่สุดของระบบ

## 8. วิธีใช้ roadmap นี้ให้คุ้มที่สุด

อย่าพยายามอ่านทุกไฟล์รวดเดียว

ให้ใช้หลักนี้:

- อ่านเป็น flow ไม่ใช่อ่านตามชื่อ folder อย่างเดียว
- ถ้าจะเข้าใจ module ให้ไล่ `controller -> service -> repository`
- ถ้าเริ่มสับสน ให้กลับไปดู [schema.prisma](/mnt/d/dev-workspace/podkaap/pod-kaab-service/packages/db/prisma/schema.prisma)
- ถ้าจะเริ่ม feature ใหม่ ให้เปิด [design-review-before-implementation.md](/mnt/d/dev-workspace/podkaap/pod-kaab-service/docs/design-review-before-implementation.md) ควบคู่เสมอ

## 9. สรุปสั้นที่สุด

ถ้าคุณเป็น junior และกำลังจะรับช่วงโปรเจกต์นี้ต่อ:

- เริ่มจาก domain ก่อน
- ค่อยอ่าน request flow
- ค่อยตาม playback กับ feed
- ค่อยไป worker/media/analytics
- เริ่ม feature แรกจากงาน read-only หรือ summary field
- อย่าเพิ่งแตะ ranking, worker pipeline, หรือ analytics semantics ถ้ายังไม่มั่นใจ

แค่นี้ก็พอจะเริ่ม dev ต่อได้แบบไม่เจ็บตัวเกินไปแล้ว
