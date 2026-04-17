# Python Feed Service

service นี้รับผิดชอบแค่ feed decision logic:

- candidate filtering
- scoring
- ranking
- diversity

service นี้ **ไม่ query database เอง**

flow ที่ออกแบบไว้:

```text
API
  -> query candidates จาก PostgreSQL
  -> ส่ง candidate list + user context เข้า gRPC
Python feed service
  -> filter
  -> score
  -> rank
  -> diversify
  -> ส่ง ranked content ids + score กลับ
API
  -> map เป็น frontend DTO
  -> record analytics
  -> return response
```

## Local run

สร้าง venv และติดตั้ง requirements:

```bash
bun run python:venv:setup
```

เช็ก `pylint` เองจาก root:

```bash
bun run lint:python
```

รันจาก root:

```bash
bun run dev:feed-service
```

หรือรันตรง:

```bash
source apps/feed-service-python/.venv/Scripts/activate
python apps/feed-service-python/app.py
```

ถ้าเป็น Linux/macOS:

```bash
source apps/feed-service-python/.venv/bin/activate
python apps/feed-service-python/app.py
```

## Notes

- root scripts จะ activate `.venv` ให้อัตโนมัติ
- ถ้าจะ activate shell เอง ให้ `source` path ของ venv ตรงๆ
- protobuf stubs จะถูก generate ตอน startup อัตโนมัติ
- API จะ fallback กลับไปใช้ local TypeScript feed engine ถ้า service นี้ไม่พร้อม
- pre-commit จะรัน `pylint` กับ staged `*.py` files อัตโนมัติ
