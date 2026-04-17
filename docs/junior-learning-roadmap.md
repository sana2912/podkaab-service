# Podkaap Junior Learning Roadmap

roadmap นี้สรุปลำดับการอ่านสำหรับคนที่เพิ่งรับช่วงโปรเจกต์และยังไม่คุ้นกับ stack นี้

## 1. สิ่งที่ทำให้โปรเจกต์นี้ยากขึ้นตอนนี้

- มีทั้ง API
- มี worker
- มี queue/media pipeline
- มี Python feed service เพิ่มอีกตัว

ดังนั้นต้องอ่านเป็น “boundary” ไม่ใช่อ่านทีละไฟล์มั่วๆ

## 2. ลำดับการอ่าน docs

1. [collection-content-direction.md](/mnt/d/dev-workspace/podkaap/pod-kaab-service/docs/collection-content-direction.md)
2. [project-structure-overview.md](/mnt/d/dev-workspace/podkaap/pod-kaab-service/docs/project-structure-overview.md)
3. [onboarding-technical-guide.md](/mnt/d/dev-workspace/podkaap/pod-kaab-service/docs/onboarding-technical-guide.md)
4. [design-review-before-implementation.md](/mnt/d/dev-workspace/podkaap/pod-kaab-service/docs/design-review-before-implementation.md)
5. [technical-debt-priority-guide.md](/mnt/d/dev-workspace/podkaap/pod-kaab-service/docs/technical-debt-priority-guide.md)

## 3. 8-Day Reading Plan

### Day 1

- domain model
- `schema.prisma`

### Day 2

- API flow
- `app.ts`
- `routes/index.ts`

### Day 3

- playback flow
- progress
- continue-watching

### Day 4

- feed flow ใน API
- `feed.repository.ts`
- `feed.service.ts`
- `feed-local-engine.service.ts`
- `feed-remote-engine.service.ts`

### Day 5

- Python feed service
- `proto/feed.proto`
- `apps/feed-service-python/app.py`
- `apps/feed-service-python/feed_engine.py`

### Day 6

- worker
- queue
- analytics jobs

### Day 7

- media pipeline

### Day 8

- design-review guide
- technical debt guide
- ลองออกแบบ feature เล็กๆ บนกระดาษ

## 4. งานแรกที่เหมาะ

- เพิ่ม field ใน collection/content response
- เพิ่ม read-only endpoint เล็กๆ
- ปรับ reaction summary

## 5. งานที่สองที่เหมาะ

- `Favorite Content`
- improve content detail API
- improve continue-watching response

## 6. งานที่ยังไม่ควรแตะก่อน

- feed scoring logic แบบลึก
- Python feed contract ใหญ่ๆ โดยยังไม่เข้าใจ boundary
- media processing pipeline
- analytics semantics

## 7. สิ่งที่ต้องจำให้ขึ้นใจ

- API owns DB access
- worker owns async jobs
- Python feed service owns feed decision logic only
- ถ้าจะเปลี่ยน cross-service shape ให้เริ่มที่ `proto/feed.proto`
