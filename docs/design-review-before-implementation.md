# Podkaap Design Review Before Implementation

เอกสารนี้เป็น checklist ก่อนเริ่มเขียน feature ใหม่ โดยยึด model ปัจจุบันของระบบคือ `Collection / Content / ContentWarp`

เป้าหมาย:

- ลดโอกาสเขียน feature ลงผิดชั้น
- ทำให้ API, DB, queue และ response shape คิดครบก่อนลงมือ
- ช่วยให้ implement แล้วไม่ต้องย้อนมารื้อ model ทีหลัง

## 1. One-Page Feature Summary

ก่อนเขียน code ให้ตอบสั้นๆ ให้ได้ก่อน:

```md
Feature:
User goal:
Primary entity:
Is it sync or async:
Routes involved:
Schema changes:
Queue jobs involved:
Frontend response shape:
Risks:
```

ถ้ายังตอบ `Primary entity` ไม่ได้ ให้หยุดก่อนและกลับไปอ่าน schema

## 2. Domain Review

Podkaap ตอนนี้มี entity หลักดังนี้:

- `Collection`
- `Content`
- `ContentWarp`
- `UserProgress`
- `UserReaction`
- `FeedEvent`
- `Media`

คำถามที่ควรตอบ:

- feature นี้แตะ `Collection` หรือ `Content` เป็นหลัก
- ถ้าเกี่ยวกับ discovery ใช้ `Content(role=SHORT)` หรือไม่
- ถ้าเกี่ยวกับ playback ใช้ `Content(role=FULL)` หรือไม่
- ถ้าต้องพาผู้ใช้จาก short ไป full ต้องมี `ContentWarp` หรือไม่
- ถ้าเกี่ยวกับ next episode behavior ต้องอิง `Collection.fullMode` และ `Content.order` หรือไม่

หลักคิด:

- story container = `Collection`
- playable unit = `Content`
- navigation จาก short ไป full = `ContentWarp`

## 3. API Design Review

### 3.1 Endpoint Shape

ถามก่อน:

- path สื่อ intent ชัดไหม
- ใช้ resource-oriented route ได้หรือไม่
- feature นี้ควรอยู่ใน module ไหน

ตัวอย่างที่ดี:

- `GET /collections/:id`
- `GET /collections/:id/contents`
- `GET /contents/:id`
- `GET /contents/:id/next`
- `POST /progress/:contentId`

### 3.2 Request Contract

ก่อน implement ให้ตอบ:

- params คืออะไร
- query คืออะไร
- body คืออะไร
- field ไหน required
- field ไหน optional
- validation จะเขียนใน `*.schema.ts` อย่างไร

### 3.3 Response Contract

ก่อนเขียน controller ให้ตอบ:

- client ต้องใช้ field อะไรทันที
- response ควรเป็น DTO ไหน
- field ไหนไม่ควร expose ออกไป

### 3.4 Error Contract

อย่างน้อยต้องคิด:

- ถ้า resource ไม่เจอ ตอบอะไร
- ถ้า input ผิด ตอบอะไร
- ถ้า user ไม่มีสิทธิ์ ตอบอะไร
- ถ้าข้อมูล conflict ตอบอะไร

## 4. Data Model Review

### 4.1 Feature นี้ต้องเพิ่ม table จริงไหม

บางครั้งไม่ต้องสร้าง model ใหม่ แค่เพิ่ม field หรือ relation ก็พอ

ถามก่อน:

- data นี้เป็น entity ใหม่จริงหรือแค่ metadata ของ entity เดิม
- ต้อง query แยกบ่อยไหม
- มี lifecycle แยกจาก entity เดิมไหม

### 4.2 Relation Review

คิดให้ครบ:

- relation เป็น one-to-many หรือ many-to-many
- query จะเริ่มจากฝั่งไหนบ่อยกว่า
- index ที่ต้องใช้มีหรือยัง
- naming อ่านแล้วตรงกับ business language ไหม

### 4.3 Canonical ID

สำหรับ feature ใหม่ในระบบนี้ คำถามหลักมักเป็น:

- ใช้ `collectionId`
- ใช้ `contentId`
- ใช้ `mediaId`
- ใช้ `targetContentId`

พยายามอย่าใช้ field ที่ต้อง map อ้อมหลายชั้นโดยไม่จำเป็น

## 5. Module Design Review

repo นี้ใช้ pattern:

```text
controller -> service -> repository -> mapper
```

### Controller ควรทำอะไร

- รับ request
- validate input
- ดึงค่า auth/context
- เรียก service
- set status code

### Service ควรทำอะไร

- orchestrate business flow
- combine หลาย repository หรือหลาย step
- enforce business rules

### Repository ควรทำอะไร

- query/insert/update ผ่าน Prisma
- รวม where/include/orderBy ที่ซับซ้อน
- ไม่แบก HTTP concerns

### Mapper ควรทำอะไร

- แปลง Prisma result เป็น DTO
- ทำให้ response shape สม่ำเสมอ

### Checklist

- controller บางพอหรือยัง
- service แบก logic ที่เป็น business จริงไหม
- repository ยังเป็น data-access layer จริงไหม
- mapper ทำหน้าที่ map จริง ไม่แอบซ่อน business rule

## 6. Queue / Worker Review

ถ้า feature นี้เกี่ยวกับงานหนัก ให้ถามก่อนว่า:

- user ต้องได้ผลลัพธ์ทันทีไหม
- งานนี้ใช้เวลานานไหม
- งานนี้ retry ได้ไหม
- งานนี้ idempotent ได้ไหม

เหมาะกับ queue ถ้า:

- เป็น media processing
- เป็น analytics maintenance
- เป็นงานที่ล้มแล้ว retry ได้

สิ่งที่ต้องออกแบบก่อนเขียน:

- job name
- payload shape
- success state
- fail state
- deduplication strategy เช่น `jobId`

## 7. Feed Review

ถ้า feature แตะ feed ให้ตอบเพิ่ม:

- กระทบ `candidate generation`, `ranking`, `diversity` หรือ `tracking`
- กระทบ `SHORT`, `LONG` หรือทั้งคู่
- ถ้าเป็น short item ต้องมี warp หรือมี fallback อย่างไร
- ถ้าปรับ ranking ต้องมี analytics รองรับหรือไม่
- ถ้าเป็น series ต้องรู้หรือไม่ว่ามี next full content

หลักคิด:

- short feed item = discovery + warp target
- long feed item = full content ขึ้น feed ได้ตรงๆ
- ranking ต้องยังรักษาสมดุล short/long

## 8. Progress / Continue Watching Review

ถ้า feature แตะ playback ให้ตอบ:

- feature นี้ใช้กับ `Content(role=FULL)` เท่านั้นหรือไม่
- จะอ่าน/เขียน `UserProgress` ตอนไหน
- complete criteria คืออะไร
- rail หรือ player ต้องใช้ `progressSeconds`, `durationSeconds`, `percentComplete` อะไรบ้าง
- ถ้า collection เป็น `SERIES` จะหา next content จาก `Content.order` หรือไม่

## 9. Analytics Review

ถ้า feature สร้างหรือใช้ event:

- event นี้ผูกกับ `contentId` ตัวไหน
- ต้องมี `targetContentId` หรือไม่
- event นี้ช่วย ranking หรือ reporting ส่วนไหน
- event นี้มาจาก short interaction หรือ full playback

หลักคิด:

- analytics ปัจจุบันอิง `FeedEvent`
- event names ควรสื่อ user behavior จริง
- อย่าเพิ่ม event ที่ซ้ำความหมายกับ event เดิมโดยไม่จำเป็น

## 10. Media Review

ถ้า feature แตะ upload หรือ processing:

- media row ถูกสร้างเมื่อไร
- status เริ่มต้นคืออะไร
- API จะ enqueue job อะไร
- worker ตัวไหน handle
- เมื่อสำเร็จต้อง update field ไหน
- เมื่อ fail ต้อง trace ได้จาก field ไหน

หลักคิด:

- media state ต้องอ่านจาก DB ได้
- worker ไม่ควรทำงานแบบเงียบ
- API ไม่ควรรอ FFmpeg เสร็จใน request path

## 11. Docs and Contract Review

ก่อน merge feature:

- README หรือ docs ที่เกี่ยวข้องต้องอัปเดตไหม
- DTO กลางใน `packages/shared` ต้องเปลี่ยนไหม
- Swagger shape สอดคล้องกับของจริงไหม
- seed data ต้องอัปเดตไหม

## 12. Practical Best Practices

แนวทางที่ควรยึด:

- เริ่มจาก schema และ response shape ก่อน
- ถ้า feature แตะหลายชั้น ให้เขียน flow สั้นๆ ก่อนลงมือ
- ถ้างานยาว ให้ทำเป็น vertical slice ที่รันได้ก่อน
- ถ้ามี queue ให้ define payload type ก่อนเขียน handler
- ถ้าต้องเพิ่ม endpoint ให้เริ่มจาก schema และ controller signature
- ถ้าต้องเพิ่ม query ซับซ้อน ให้เขียน repository ก่อน mapper

## 13. Fast Checklist ก่อนลงมือจริง

เช็กให้ครบ:

- รู้แล้วว่า feature นี้แตะ entity ไหน
- รู้แล้วว่า sync หรือ async
- รู้แล้วว่า route หรือ module ควรอยู่ตรงไหน
- รู้แล้วว่า DB schema ต้องเปลี่ยนหรือไม่
- รู้แล้วว่า response shape สำหรับ frontend คืออะไร
- รู้แล้วว่า success/failure path คืออะไร
- รู้แล้วว่าต้องอัปเดต docs หรือ seed หรือไม่

ถ้าตอบครบทุกข้อแล้ว ค่อยเริ่ม implement
