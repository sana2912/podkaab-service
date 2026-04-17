# Podkaap Technical Debt Priority Guide

เอกสารนี้สรุป technical debt ที่สำคัญจริงกับ architecture ปัจจุบัน

## P0

### 1. Feed contract และ fallback ยังต้องมี safety net

ตอนนี้ feed มี 2 paths:

- local TypeScript engine
- optional Python gRPC engine

สิ่งที่ควรทำก่อน:

- contract tests สำหรับ `proto/feed.proto`
- fallback tests ว่า remote พังแล้ว local ยังตอบได้
- smoke test สำหรับ Python feed service

### 2. Feed pipeline ยังควรมี targeted tests

ควรมี tests สำหรับ:

- candidate generation
- ranking ordering
- diversity limit
- short items ต้องมี warp target

### 3. Progress / Continue Watching ยังควรมี behavioral tests

ควรมี tests สำหรับ:

- progress ใช้ได้เฉพาะ FULL content
- continue-watching ดึงเฉพาะ incomplete FULL content
- `/contents/:id/next` ทำงานถูกกับ `SINGLE` และ `SERIES`

## P1

### 4. Logging และ observability ข้าม service ยังบาง

ควรเพิ่ม:

- request ids
- correlation ids ระหว่าง API กับ worker
- correlation ids ระหว่าง API กับ Python feed service

### 5. Python feed service readiness checks

ถ้าเปิด remote engine จริง ควรมี:

- readiness/health signal
- timeout policy
- error logging ที่ trace ได้

### 6. Media state machine ยังเปราะ

ยังควรเก็บ:

- clearer status transitions
- better logs
- retry semantics ที่ชัด

## P2

- metrics dashboard
- integration tests เต็มชุด
- deployment hardening

## Rule of Thumb

ถ้าจะเลือก debt ที่คุ้มสุดก่อน:

1. test feed contract
2. test fallback
3. test playback flow
4. ค่อยทำ observability และ platform debt
