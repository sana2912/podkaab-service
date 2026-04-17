# Podkaap Design Review Before Implementation

เอกสารนี้เป็น checklist ก่อนเริ่มเขียน feature ใหม่ใน architecture ปัจจุบัน

## 1. One-Page Summary

ก่อนเขียน ให้ตอบ:

```md
Feature:
User goal:
Primary entity:
Execution path:
Routes involved:
Schema changes:
Service boundary touched:
Risks:
```

`Execution path` มักเป็นหนึ่งในนี้:

- API only
- API + worker
- API + Python feed service

## 2. Domain Check

entity หลักของระบบ:

- `Collection`
- `Content`
- `ContentWarp`
- `UserProgress`
- `UserReaction`
- `FeedEvent`
- `Media`

## 3. Feed-Specific Review

ถ้า feature แตะ feed ให้ตอบ:

- API ยังเป็น owner ของ candidate retrieval อยู่หรือไม่
- feature นี้ต้องแตะ local TypeScript engine หรือ Python feed service หรือทั้งคู่
- ถ้าต้องเปลี่ยน cross-service contract ต้องแก้ `proto/feed.proto` หรือไม่
- short item ยังต้องมี warp เสมอหรือไม่
- fallback path ยังทำงานได้หรือไม่

หลักคิด:

- API query data
- Python service ตัดสินใจเรื่อง ranking/diversity
- Python service ไม่ query DB

## 4. Queue / Worker Review

ใช้ queue เมื่อ:

- งานไม่ต้องตอบ user ทันที
- งานใช้เวลานาน
- งาน retry ได้

feed request ปกติไม่ควรเข้า queue เพราะเป็น synchronous path

## 5. Docs / Contract Review

ก่อน merge ถ้าแตะ feed service:

- `proto/feed.proto` ต้องอัปเดตไหม
- `apps/feed-service-python/README.md` ต้องอัปเดตไหม
- `README.md` และ docs ใน `/docs` ต้องตามไหม

## 6. Rule of Thumb

- ถ้า feature คือ data retrieval หรือ frontend contract ให้เริ่มที่ API
- ถ้า feature คือ media/analytics async work ให้เริ่มที่ worker
- ถ้า feature คือ scoring/ranking/diversity ให้พิจารณา Python feed service
