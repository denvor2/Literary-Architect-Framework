id: Sprint-29-Step-05
name: "Workspace Controller: методы Series CRUD (createSeries, updateSeries, deleteSeries, addBookToSeries, removeBookFromSeries)"
type: implementation

## Контекст

Step-04 завершила API endpoints. Step-05 интегрирует Series в useWorkspaceController.ts —
единственный управляемый слой state'а между UI и repository. Добавляются методы:

- createSeries(title: string, description?: string): Series
- updateSeries(seriesId: string, title: string, description: string): Series
- deleteSeries(seriesId: string): void
- addBookToSeries(bookId: string, seriesId: string): Book
- removeBookFromSeries(bookId: string): Book

Контроллер вызывает API endpoints, вычитанные из Step-04, и обновляет локальное state.

## Scope

Allowed paths (ТОЛЬКО):
- apps/studio/src/workspace/useWorkspaceController.ts (добавить методы Series + вызовы API)
- apps/studio/src/domain/model.ts (обновить Workspace тип, добавить series поле)

Forbidden paths (НИКОГДА не трогать):
- apps/studio/src/app/api/series/route.ts (это был Step-04)
- apps/studio/src/repositories/** (это был Step-03)
- apps/studio/prisma/schema.prisma (это был Step-02)
- Любые UI-компоненты (это Step-06)

## Rules

1. **domain/model.ts — обновить Workspace:**
   ```typescript
   export type Workspace = {
     // существующие поля...
     readonly activeBookId?: string;
     readonly selectedChapterId?: string;
     // ...
     readonly series: readonly Series[];  // ← добавить
   };
   ```

2. **useWorkspaceController.ts — добавить методы:**

   **createSeries(title, description):**
   - Валидация: title не пусто
   - Создать новый Series с новым UUID
   - PUT /api/series { title, description }
   - Обновить локальное state: workspace.series.push(newSeries)
   - Вернуть newSeries
   - На ошибку: логировать, выбросить исключение (как существующие методы createBook)

   **updateSeries(seriesId, title, description):**
   - Валидация: seriesId должен существовать в workspace.series
   - PUT /api/series { id: seriesId, title, description, order: (текущий) }
   - Обновить локальное state
   - Вернуть updatedSeries

   **deleteSeries(seriesId):**
   - Валидация: серия существует
   - DELETE /api/series с id из URL или тела (согласно Step-04)
   - Обновить локальное state: отфильтровать series
   - Отсоединить все books, которые были в этой series (setSeriesId(bookId, null))

   **addBookToSeries(bookId, seriesId):**
   - Найти book в workspace.books, найти series в workspace.series
   - Обновить book: seriesId = seriesId
   - PUT /api/workspace с обновлённым book
   - Вернуть updatedBook

   **removeBookFromSeries(bookId):**
   - Найти book в workspace.books
   - Обновить book: seriesId = null
   - PUT /api/workspace с обновлённым book
   - Вернуть updatedBook

3. **Сохранение в БД:**
   - Все методы вызывают соответствующие API endpoints (GET/POST/PUT/DELETE /api/series)
   - После успешного API-вызова обновляется локальное workspace state
   - Используется существующий паттерн: `await saveWorkspace(updatedWorkspace)`
   - На ошибку API: не молчать (ADR-0012 Decision 5), выбросить исключение (не silent fallback)

4. **State-синхронизация:**
   - После каждого create/update/delete вызывать saveWorkspace(), как существующие методы
   - Series загружается при load (вместе с books), читается из API

5. **Ephemeral vs. Persistent:**
   - Series data (title, description, id) — persistent, идут в БД через /api/series
   - Сами Book-объекты (из workspace.books) также persistent
   - Выбор активной series (selectedSeriesId?) — вне scope этого шага (может быть в Step-06)

## Validation

Все команды из apps/studio/:

1. **`npx tsc --noEmit`**
   - После обновления domain/model.ts — no errors в самом файле
   - useWorkspaceController.ts должен скомпилироваться без ошибок в новых методах
   - Могут быть ошибки в page.tsx (не вызывает новые методы ещё, это Step-06)

2. **`npx eslint src/workspace/useWorkspaceController.ts src/domain/model.ts`** — чисто

3. **`npx prettier --check src/workspace/useWorkspaceController.ts src/domain/model.ts`** — чисто

4. **`npm run build`**
   - Ожидается падение на page.tsx (не обновлена для вызовов новых методов)
   - useWorkspaceController.ts должна скомпилироваться

5. **Unit-стиль проверка (без живого браузера):**
   - Синтаксис TypeScript корректен
   - Методы имеют правильные сигнатуры (return types, params)
   - Экспортируются из контроллера

6. **`git status --short`**:
   ```
   M  apps/studio/src/domain/model.ts
   M  apps/studio/src/workspace/useWorkspaceController.ts
   ```

## Output

ARP файл в docs/task-bus/queue/active/, указать:
1. Все добавленные методы (сигнатуры + реализация)
2. Обновления domain/model.ts (Workspace.series поле)
3. Результаты tsc/eslint/prettier
4. Результат npm run build (ожидаемое падение на page.tsx)
5. git status --short

## Stop Condition

Не коммитить без подтверждения Product Owner.
