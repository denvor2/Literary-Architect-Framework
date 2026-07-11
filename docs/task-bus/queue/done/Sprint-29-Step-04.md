id: Sprint-29-Step-04
name: "API endpoints: GET/POST/PUT/DELETE /api/series"
type: implementation

## Контекст

Step-03 создала repository-слой (loadSeriesForUser, saveSeriesToUser). Step-04 оборачивает это
в HTTP API-endpoints, следуя контракту ADR-0012's Decision 3 (coarse endpoints):

- GET /api/series — читать все series для текущего пользователя
- POST /api/series — создать новую series
- PUT /api/series/{id} — обновить series (название, описание, order)
- DELETE /api/series/{id} — удалить series

Step-04 импортирует ТОЛЬКО из seriesRepository (через экспорт из repositories/index.ts).
Не трогает Workspace controller — это Step-05.

## Scope

Allowed paths (ТОЛЬКО):
- apps/studio/src/app/api/series/route.ts (новый файл с GET/POST/PUT/DELETE)

Forbidden paths (НИКОГДА не трогать):
- apps/studio/src/repositories/** (это был Step-03)
- apps/studio/src/domain/model.ts (это Step-03-update, не этот шаг)
- apps/studio/src/workspace/useWorkspaceController.ts (это Step-05)
- Любые UI-компоненты (это Step-06)
- apps/studio/src/app/api/workspace/route.ts (существующий endpoint, не меняется)

## Rules

1. **Route-слой — thin wrapper:**
   ```typescript
   import { loadSeriesForUser, saveSeriesToUser } from "@/repositories";

   export async function GET(request: Request) {
     // 1. Получить текущего пользователя (getOrCreateDefaultUser(), как в workspace)
     // 2. loadSeriesForUser(user.id)
     // 3. Вернуть { ok: true, series: [...] } или { ok: false, error: "..." }
   }

   export async function POST(request: Request) {
     // 1. Парсить { title, description } из тела
     // 2. Получить текущего пользователя
     // 3. Создать новый Series объект (domain-форма, с новым UUID для id)
     // 4. Прочитать текущие series, добавить новый, saveSeriesToUser()
     // 5. Вернуть { ok: true, series: newSeries }
   }

   export async function PUT(request: Request) {
     // 1. Парсить { id, title, description, order } из тела
     // 2. Получить текущего пользователя
     // 3. Прочитать текущие series, найти по id, обновить поля, saveSeriesToUser()
     // 4. Вернуть { ok: true, series: updatedSeries }
   }

   export async function DELETE(request: Request) {
     // 1. Парсить { id } из URL или тела
     // 2. Получить текущего пользователя
     // 3. Прочитать текущие series, отфильтровать по id, saveSeriesToUser()
     // 4. Вернуть { ok: true }
   }
   ```

2. **Ошибки и статус-коды:**
   - GET успех: 200 OK, `{ ok: true, series: [...] }`
   - GET ошибка: 500 Server Error, `{ ok: false, error: "..." }`
   - POST успех: 201 Created (или 200), `{ ok: true, series: newSeries }`
   - PUT успех: 200 OK, `{ ok: true, series: updatedSeries }`
   - DELETE успех: 200 OK, `{ ok: true }`
   - Любая ошибка БД: 500, `{ ok: false, error: "..." }`

3. **Валидация входных данных (POST/PUT):**
   - title: не пусто, строка, не более N символов (рекомендация: как Book.title, см. контроллер)
   - description: строка или пусто, не более M символов
   - order: число >= 0 (или опциональное, тогда игнорируется)

4. **Структура ответа:**
   - Series в ответе — в domain-форме (строки ISO для createdAt/updatedAt, не Date объекты)

## Validation

Все команды из apps/studio/:

1. **`npx tsc --noEmit`**
   - Ошибки в domain/model.ts и useWorkspaceController.ts ожидаемы
   - В самом route.ts НЕ должно быть ошибок

2. **`npx eslint src/app/api/series/route.ts`** — чисто

3. **`npx prettier --check src/app/api/series/route.ts`** — чисто

4. **Live-проверка (curl или Playwright) против scratch-сервера:**
   - `npm run build && npx next start --port 3001` (на scratch-порту, не трогая 3000)
   - `curl http://localhost:3001/api/series` — вернёт { ok: true, series: [...] }
   - `curl -X POST http://localhost:3001/api/series \
     -H "Content-Type: application/json" \
     -d '{"title":"My Series"}' ` — вернёт { ok: true, series: {...} }
   - Проверить, что series в БД перечитывается и round-trips

5. **`git status --short`**:
   ```
   ?? apps/studio/src/app/api/series/route.ts
   ```

## Output

ARP файл в docs/task-bus/queue/active/, указать:
1. Полный текст route.ts (все четыре метода)
2. Результаты curl-тестов (вывод каждого запроса)
3. Скриншот или текстовый лог npm run build (успех)
4. git status --short

## Stop Condition

Не коммитить без подтверждения Product Owner.
