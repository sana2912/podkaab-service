# Podkaap Technical Debt Priority Guide

เอกสารนี้สรุป technical debt ที่ยังสำคัญจริงสำหรับ codebase ปัจจุบัน โดยไม่อ้างโลกเก่าแล้ว และเน้นเฉพาะสิ่งที่กระทบการส่ง feature ได้จริง

## 1. Executive Summary

ถ้าต้องเลือกทำ debt ก่อนภายใต้เวลาจำกัด ให้เรียงแบบนี้:

1. ทำให้ `feed`, `progress`, `continue-watching`, `analytics` มี test เฉพาะจุด
2. ทำ media pipeline ให้ trace ง่ายและ retry แล้วไม่พัง state
3. ทำ health / logging ให้พอ debug environment จริงได้
4. ทำ docs และ DTO ให้ตรงกับ runtime เสมอ
5. ค่อยเก็บ platform debt ที่ไม่ block feature

สรุปสั้น:

- debt ใหญ่ตอนนี้ไม่ใช่ migration debt แล้ว
- debt ใหญ่ตอนนี้คือ `confidence debt`
- ถ้าไม่มี test และ observability พอ ทุกการเปลี่ยน feed หรือ playback จะเสี่ยง

## 2. Current Reality ของ Codebase

runtime ปัจจุบันมีแกนหลักดังนี้:

- `Collection`
- `Content(role=SHORT | FULL)`
- `ContentWarp`
- `UserProgress(contentId)`
- `FeedEvent(contentId, targetContentId?)`
- `Media`

ดังนั้น debt ที่ควรสนใจคือ debt ที่ทำให้ model นี้ใช้งานยากหรือพังเงียบ

## 3. Priority Framework

### P0

ต้องทำก่อนหรือระหว่าง feature ถัดไป เพราะถ้าไม่ทำจะเสี่ยงพังใน flow หลัก

### P1

ยังไม่ต้องหยิบเดี่ยวๆ ทันที แต่ถ้าเข้าไปแตะ area นั้นอยู่แล้วควรเก็บพร้อมกัน

### P2

ดีต่อความเรียบร้อยระยะยาว แต่ยังไม่ควรแย่งเวลาจาก feature delivery

## 4. P0 Debt

### 4.1 Feed Pipeline ยังไม่มี Safety Net พอ

อาการ:

- feed มีหลายชั้น: candidate -> ranking -> diversity -> impression tracking
- เปลี่ยน score หรือ filter นิดเดียว behavior อาจเปลี่ยนทั้งระบบ

ความเสี่ยง:

- mixed feed balance พัง
- short item ไม่มี warp หลุดขึ้น feed
- long item จาก series เรียงหรือกระจายผิด

สิ่งที่ควรทำ:

1. เพิ่ม tests สำหรับ candidate generation
2. เพิ่ม tests สำหรับ ranking ordering
3. เพิ่ม tests สำหรับ diversity limit
4. เพิ่ม tests ว่า short item ต้องมี warp target

### 4.2 Progress และ Continue Watching ยังควรมี Test เชิงพฤติกรรม

อาการ:

- flow นี้เป็นแกนของ product experience
- เปลี่ยน logic `isComplete`, `percentComplete`, หรือ next-content แล้วพังง่าย

ความเสี่ยง:

- resume ผิดชิ้น
- continue rail คืนข้อมูลไม่ครบ
- auto-next ใน series เพี้ยน

สิ่งที่ควรทำ:

1. test ว่า progress เขียนได้เฉพาะ FULL content
2. test ว่า continue-watching ดึงเฉพาะ FULL content ที่ค้างอยู่
3. test ว่า `/contents/:id/next` ทำงานถูกกับ `SINGLE` และ `SERIES`

### 4.3 Media State Machine ยังเปราะ

อาการ:

- media flow มีหลายสถานะและพึ่ง external tools เช่น FFmpeg กับ storage
- ถ้าพังระหว่างทาง ต้องตามให้เจอว่า fail ตรงไหน

ความเสี่ยง:

- media row ค้าง `PROCESSING`
- job rerun แล้ว state ชนกัน
- upload/processing success แต่ metadata ไม่ครบ

สิ่งที่ควรทำ:

1. review ว่า status transitions ครบ `PENDING -> PROCESSING -> READY/FAILED`
2. เพิ่ม structured logs ใน worker jobs
3. เขียนกติกา idempotency ให้ชัดสำหรับแต่ละ job

### 4.4 Analytics Contract ยังบาง

อาการ:

- `FeedEvent` เป็นฐานของ ranking ในอนาคต
- ถ้า event semantics หลวม จะทำให้ score เพี้ยน

ความเสี่ยง:

- event ชื่อซ้ำความหมาย
- ยิง event ผิด `contentId`
- short/full actions ถูกนับปนกันโดยไม่ได้ตั้งใจ

สิ่งที่ควรทำ:

1. เขียน event contract ให้ชัดใน docs
2. เพิ่ม tests หรือ contract checks สำหรับ analytics input
3. review ว่า controller/service/repository map event ตรงกัน

## 5. P1 Debt

### 5.1 Logging ยังใช้ console เป็นหลัก

ผลกระทบ:

- local ใช้ง่าย
- แต่ production-like debugging จะค้นและ filter ยาก

ควรทำเมื่อ:

- เริ่ม deploy จริง
- เริ่มตาม bug ข้าม API และ worker บ่อย

### 5.2 Health Endpoint ยังลึกได้อีก

ตอนนี้ดีพอสำหรับ local แต่ยังเพิ่มได้อีก:

- DB latency
- Redis/Dragonfly health
- queue readiness
- worker heartbeat

### 5.3 Storage Provider Integration ยังเป็น MVP

อาการ:

- abstraction มีแล้ว
- แต่ provider integration บางส่วนยังเป็น mock หรือ minimal path

ควรทำเมื่อ:

- เริ่มเชื่อม provider จริงเต็มรูปแบบ
- media flow ต้องใช้จริงใน demo หรือ production-like env

### 5.4 Seed Data ยังเป็นสาย demo มากกว่าสาย test fixture

ความเสี่ยง:

- บาง edge case ของ feed หรือ series ยังไม่มีใน seed

ควรทำเมื่อ:

- เริ่มทำ integration tests
- ต้อง demo หลาย user flow ที่ต่างกัน

## 6. P2 Debt

### 6.1 Structured Observability

- request ids
- correlation ids ระหว่าง API กับ worker
- metrics dashboard

### 6.2 Full Test Pyramid

- unit tests
- integration tests
- queue/job tests
- API smoke tests

### 6.3 Deployment Hardening

- hardened Dockerfiles
- migration automation
- rollout/rollback notes

## 7. Debt ที่ไม่ควรทำก่อนเวลา

ภายใต้เวลาจำกัด อย่าเพิ่งรีบทำสิ่งเหล่านี้ถ้ายังไม่ block feature:

- refactor naming ทั้ง repo เพื่อความสวย
- เปลี่ยน logger ใหม่ทั้งระบบทันที
- ทำ generic abstraction เพิ่มโดยยังไม่มี use case ชัด
- optimize query ทุกจุดก่อนมี profiling

## 8. คำแนะนำเวลาเริ่ม feature ใหม่

ถ้าจะทำ feature ใหม่ ให้ใช้ debt guide นี้แบบ practical:

1. เช็กก่อนว่า feature แตะ `feed`, `progress`, `continue-watching`, `analytics`, หรือ `media` ไหม
2. ถ้าแตะ area พวกนี้ ให้เก็บ P0 ของ area นั้นพร้อมกันเท่าที่จำเป็น
3. ถ้าไม่แตะ อย่าดึง debt ที่ไม่เกี่ยวเข้ามาเพิ่ม scope

## 9. สรุปแบบลงมือได้เลย

ถ้าพรุ่งนี้ต้องเริ่มงานใหม่:

- ให้ยึด model ปัจจุบันเป็นจริงเสมอ
- ถ้าแตะ feed ให้เพิ่ม test
- ถ้าแตะ playback ให้เพิ่ม test
- ถ้าแตะ media ให้เพิ่ม status + logs
- ถ้าแตะ analytics ให้ทำ contract ให้ชัด

นี่คือ debt ที่คุ้มสุดต่อเวลาสำหรับ repo นี้
