# Reinstall Latest Dependencies

เอกสารนี้รวบรวมคำสั่งสำหรับติดตั้ง dependencies ใหม่ให้เป็นเวอร์ชันล่าสุดของแต่ละ package หลังจากลบ entries ที่ pin version ออกจาก `package.json`

หมายเหตุ:

- workspace dependencies เช่น `workspace:*` ยังถูกเก็บไว้ตามเดิม
- คำสั่งด้านล่างยังไม่ได้ถูกรันใน repo นี้
- ให้รันจาก root ของ repo เว้นแต่บรรทัดนั้นจะระบุ `cd` ไว้แล้ว

## Root

```bash
bun add -d @biomejs/biome @dotenvx/dotenvx @types/bun eslint husky lint-staged typescript ultracite
```

## apps/api

```bash
cd apps/api
bun add @elysiajs/jwt @elysiajs/swagger bullmq elysia
bun add -d @types/bun typescript
```

## apps/worker

```bash
cd apps/worker
bun add bullmq
bun add -d @types/bun typescript
```

## packages/db

```bash
cd packages/db
bun add @prisma/client
bun add -d prisma typescript
```

## packages/queue

```bash
cd packages/queue
bun add bullmq ioredis
bun add -d @types/node typescript
```

## packages/shared

```bash
cd packages/shared
bun add -d typescript
```

## packages/eslint-config

```bash
cd packages/eslint-config
bun add ultracite
bun add -d eslint typescript
```

ถ้าต้องการ restore `peerDependencies` ของ `packages/eslint-config` หลังติดตั้งแล้ว ให้ตั้งค่ากลับเอง เช่น:

```bash
cd packages/eslint-config
npm pkg set peerDependencies.eslint='*'
npm pkg set peerDependencies.typescript='*'
```

## Recommended Order

```bash
bun add -d @biomejs/biome @dotenvx/dotenvx @types/bun eslint husky lint-staged typescript ultracite
cd packages/db && bun add @prisma/client && bun add -d prisma typescript
cd ../queue && bun add bullmq ioredis && bun add -d @types/node typescript
cd ../shared && bun add -d typescript
cd ../eslint-config && bun add ultracite && bun add -d eslint typescript
cd ../../apps/api && bun add @elysiajs/jwt @elysiajs/swagger bullmq elysia && bun add -d @types/bun typescript
cd ../worker && bun add bullmq && bun add -d @types/bun typescript
cd ../..
```
