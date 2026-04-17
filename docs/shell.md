# Shell Scripts Guide

ไฟล์นี้สรุป script สำคัญที่ใช้จาก shell ใน repo นี้ ว่าแต่ละตัวเอาไว้ทำอะไร และควรใช้ตอนไหน

## Root Scripts

### Development

- `bun run dev:api`
  เปิด API หลักของระบบด้วย `.env.development`

- `bun run dev:worker`
  เปิด background worker สำหรับ media และ analytics jobs

- `bun run dev:feed-service`
  เปิด Python gRPC feed service ด้วย `.env.development`

### Database / Prisma

- `bun run prisma:generate`
  generate Prisma client จาก schema ปัจจุบัน

- `bun run db:migrate`
  apply Prisma migration ใน environment development

- `bun run db:seed`
  seed demo data ลง database

- `bun run prisma:studio`
  เปิด Prisma Studio

### General Quality Checks

- `bun run lint`
  รัน Biome + ESLint + workspace typechecks

- `bun run lint:biome`
  รัน Biome checks สำหรับโลก TS/JS/JSON/MD

- `bun run lint:eslint`
  รัน ESLint สำหรับ JS config files

- `bun run lint:python`
  รัน `pylint` ของ Python feed service

- `bun run lint:fix`
  รัน Biome write + ESLint fix สำหรับไฟล์ที่เกี่ยวข้อง

- `bun run format`
  format code/docs ที่ Biome ดูแล

- `bun run typecheck`
  รัน root typecheck + workspace typechecks

### Python-Specific Convenience Scripts

- `bun run python:venv:create`
  สร้าง `.venv` ใน `apps/feed-service-python`

- `bun run python:venv:setup`
  สร้าง `.venv` และติดตั้ง dependencies จาก `apps/feed-service-python/requirements.txt`

- `bun run python:install`
  ติดตั้ง Python dependencies ลงใน `.venv` ของ `apps/feed-service-python`

- `bun run python:proto:generate`
  generate Python gRPC stubs จาก `proto/feed.proto` ไปที่ `apps/feed-service-python/generated`

- `bun run python:lint`
  รัน `pylint` ของ Python feed service

- `bun run python:format`
  format Python feed service ด้วย `black`

- `bun run python:format:check`
  เช็กว่า Python feed service ผ่าน `black` โดยไม่เขียนทับ

- `bun run python:lint:fix`
  alias ของ `python:format`
  ใช้แก้ format ฝั่ง Python ให้เร็ว

- `bun run python:check`
  รัน `black --check` และ `pylint` สำหรับ Python feed service

### Manual Activation

ถ้าต้องการ activate venv เองใน shell ปัจจุบัน:

```bash
source apps/feed-service-python/.venv/Scripts/activate
```

ถ้าเป็น Linux/macOS:

```bash
source apps/feed-service-python/.venv/bin/activate
```

หมายเหตุ:

- root scripts จะ activate `.venv` ให้อัตโนมัติอยู่แล้ว
- การรัน `bun run ...` ไม่สามารถทำให้ parent shell ถูก activate ค้างไว้ได้
- ถ้าต้องการ session แบบ interactive ให้ `source` path ของ venv ตรงๆ ตามด้านบน

## แนะนำการใช้งานจริง

### ถ้าเพิ่ง clone repo

```bash
bun install
bun run python:venv:setup
bun run prisma:generate
bun run db:migrate
bun run db:seed
```

### ถ้าจะเปิดครบทุก service

```bash
bun run dev:api
bun run dev:worker
bun run dev:feed-service
```

### ถ้าจะเช็กคุณภาพก่อน commit

```bash
bun run lint
bun run python:check
```

## หมายเหตุ

- pre-commit จะรัน `pylint` กับ staged `*.py` ให้อัตโนมัติ
- ก่อน lint Python ระบบจะ generate proto stubs ให้อัตโนมัติ
- `Biome` ไม่ดูไฟล์ Python
- `black` ใช้สำหรับ format Python
- `pylint` ใช้สำหรับ lint Python
