# Collection / Content Direction

เอกสารนี้สรุป direction ปัจจุบันของ Podkaap Backend แบบสั้นและตรงที่สุด

## 1. Canonical Domain

ระบบปัจจุบันใช้ domain model นี้

```text
Collection
  -> Content(role=SHORT)
  -> Content(role=FULL)
  -> ContentWarp(short -> full @ targetStartSeconds)
```

หลักคิด:

- `Collection` คือ container ระดับ story
- `Content` คือ unit ที่เล่นได้จริง
- `ContentWarp` คือทางเชื่อมจาก short ไป full

## 2. รองรับทั้ง Single และ Series

`Collection.fullMode` มี 2 แบบ:

- `SINGLE`
- `SERIES`

พฤติกรรม:

- `SINGLE` มี full content หลัก 1 ชิ้น
- `SERIES` มี full content หลายชิ้น และเรียงด้วย `Content.order`

ดังนั้น model นี้แทนได้ทั้ง:

- short หลายตัว + full เดียว
- short หลายตัว + full หลายตอน

## 3. Short Part

shorts อยู่ใน `Content(role=SHORT)`

คุณสมบัติหลัก:

- ขึ้น feed ได้
- ใช้เล่น discovery experience
- ควรมี warp ไปยัง full target
- short หลายตัวใน collection เดียวกันพาไป full คนละตัวได้

## 4. Full Part

full contents อยู่ใน `Content(role=FULL)`

คุณสมบัติหลัก:

- ใช้เป็น playback target จริง
- ใช้เก็บ progress
- ใช้เป็น continue-watching source
- ถ้าอยู่ใน `SERIES` จะเรียงด้วย `order`

## 5. Warp Semantics

`ContentWarp` ระบุว่า:

- short ตัวไหน
- พาไป full ตัวไหน
- เริ่มที่วินาทีไหน

ตัวอย่าง:

```text
short A -> full B @ 0s
short C -> full B @ 90s
short D -> full E @ 15s
```

หลักคิด:

- short ไม่ต้องผูก hard-coded กับ full ใน logic ชั้นอื่น
- mapping ถูกเก็บเป็น data
- ปรับ navigation ได้โดยไม่ต้องเปลี่ยนโค้ดทุกจุด

## 6. API Shape ที่สอดคล้องกับ Domain

route หลักปัจจุบัน:

- `GET /api/v1/collections`
- `GET /api/v1/collections/:id`
- `GET /api/v1/collections/:id/contents`
- `GET /api/v1/contents/:id`
- `GET /api/v1/contents/:id/warps`
- `GET /api/v1/contents/:id/next`
- `POST /api/v1/progress/:contentId`
- `GET /api/v1/continue-watching`
- `GET /api/v1/feed`

## 7. Feed Direction

feed รองรับ 2 item types:

- `SHORT`
- `LONG`

ความหมาย:

- `SHORT` คือ short content พร้อม warp target
- `LONG` คือ full content ที่ขึ้น feed ได้ตรงๆ

## 8. Playback Direction

playback logic ปัจจุบันยึด:

- progress ผูกกับ `contentId`
- continue watching ดึงจาก `Content(role=FULL)`
- next-content behavior ใช้ `Collection.fullMode` และ `Content.order`

## 9. Implementation Rule of Thumb

เวลาเพิ่ม feature ใหม่:

- ถ้าเป็น discovery หรือ teaser ให้เริ่มคิดจาก `SHORT`
- ถ้าเป็น playback หรือ resume ให้เริ่มคิดจาก `FULL`
- ถ้าต้องพาผู้ใช้จาก short ไป full ให้คิดถึง `ContentWarp`
- ถ้าต้องแสดงภาพรวมของเรื่อง ให้เริ่มที่ `Collection`
