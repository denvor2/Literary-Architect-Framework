id: Sprint-34-Step-04
name: "API endpoints: /api/series/{id}/bible, /api/book/{id}/bible"
type: implementation

## Контекст

Domain Model готова (Step 03). Теперь нужны API endpoints для GET/PUT Story Bible данных.

## Scope

### Allowed paths (ТОЛЬКО):
- apps/studio/src/app/api/series/{id}/route.ts (обновить PUT)
- apps/studio/src/app/api/book/{id}/route.ts (обновить PUT)
- Или новые routes: /api/series/{id}/bible и /api/book/{id}/bible

### Forbidden paths:
- apps/studio/src/app/page.tsx (UI идёт в Step 05)
- Domain Model (уже done)

## Objective

### 1. Endpoints для Series Story Bible

**PUT /api/series/{id}** (обновить Story Bible полностью)

```
Request:
{
  targetAudience?: "Adult" | "YA" | "Teen";
  genre?: ["Fantasy", "Sci-Fi"];
  estimatedTotalWordCount?: 500000;
  status?: "outline" | "in-progress" | "complete" | "published";
  decisions?: "Серия строится вокруг...";
  throughlineElements?: ["WildMind", "Jordan"];
  seriesConstraints?: ["No absolute villains"];
  notes?: "Internal notes...";
  firstPublishedDate?: "2026-03-15";
  author?: "Denis Vorobyev";
}

Response (201):
{
  id: "...",
  title: "Terralia",
  ...все поля Series...
}
```

**GET /api/series/{id}**

```
Response (200):
{
  id: "...",
  title: "Terralia",
  ...все Story Bible поля...
}
```

### 2. Endpoints для Book Story Bible

**PUT /api/book/{id}** (обновить Story Bible полностью)

```
Request:
{
  workingTitle?: "приквел";
  targetAudience?: "Adult";
  genre?: ["Fantasy", "Sci-Fi"];
  estimatedWordCount?: 80000;
  estimatedChapters?: 5;
  status?: "draft" | "editing";
  mainPlotlines?: ["Jordan", "Professor"];
  principle?: "Контраст. Переключение POV.";
  escalation?: "Палки → Дельфины → Медведи";
  themes?: ["Что такое разум?"];
  bookConstraints?: ["No scientific jargon"];
  notes?: "...";
  publishedDate?: "2026-03-15";
  isbn?: "978-1-234567-89-0";
}

Response (200):
{
  id: "...",
  title: "Terralia: Начало",
  ...все Story Bible поля...
}
```

**GET /api/book/{id}**

```
Response (200):
{
  id: "...",
  title: "...",
  ...все Story Bible поля...
  inherited?: {
    targetAudience?: "из Series если Book не override";
    genre?: ["из Series если Book не override"];
  }
}
```

### 3. Error Handling

```
GET /api/series/invalid-id → 404 Not Found
PUT /api/series/{id} (unauthorized user) → 403 Forbidden
PUT /api/series/{id} (malformed request) → 400 Bad Request
```

### 4. Validation

- `targetAudience` один из: "Adult", "YA", "Teen"
- `status` соответствует enum
- `genre[]` не пуста если задана
- `estimatedWordCount` > 0
- `genre`, `mainPlotlines`, `themes`, `constraints` — массивы строк

## Validation

1. `npx tsc --noEmit` — TypeScript errors?
2. `npm run build` — production build успешен?
3. **Live-verify против scratch-порта (3417):**
   - PUT /api/series/[id] с Story Bible данными → 200 OK
   - GET /api/series/[id] → возвращает все поля
   - PUT /api/book/[id] с Story Bible данными → 200 OK
   - GET /api/book/[id] → возвращает inherited данные если applicable

## Output

ARP файлом в docs/task-bus/queue/active/:
1. Скриншот route handlers (series/{id}/route.ts, book/{id}/route.ts)
2. Результат `npm run build`
3. curl примеры:
   ```bash
   curl -X PUT http://localhost:3417/api/series/[id] \
     -H "Content-Type: application/json" \
     -d '{"decisions":"...", "genre":["Fantasy"]}'
   
   curl http://localhost:3417/api/series/[id]
   ```
4. Скриншот ответов

## Stop Condition

Не коммитить без подтверждения Product Owner.
