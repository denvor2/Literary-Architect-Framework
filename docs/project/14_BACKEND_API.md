# 14_BACKEND_API

## Назначение

Документ описывает все серверные API Literary Studio.

---

# Текущее API

## POST /api/line-editor

### Назначение

Литературное улучшение текста без изменения смысла.

### Request

```json
{
  "text":"..."
}
```

### Response

```json
{
  "ok": true,
  "result":"..."
}
```

или

```json
{
  "ok": false,
  "error":"..."
}
```

---

## Правила

- endpoint stateless
- памяти нет
- история не хранится
- один запрос = один ответ

---

# Будущие API

POST /api/critic

POST /api/readers

POST /api/coauthor

POST /api/editor

POST /api/books

POST /api/auth

POST /api/users

POST /api/characters

---

# Общие правила

Все AI endpoint используют единый AI Bus.

UI никогда не вызывает endpoint напрямую.

Backend не знает про React.

---

# Эволюция

Phase 1:
localStorage

Phase 2:
PostgreSQL

Phase 3:
Cloud deployment

Phase 4:
Multi-user
