# ТЕСТОВЫЙ ОТЧЁТ: Sprint-37-DB-Primary-Step-05

**ID задачи:** Sprint-37-DB-Primary-Step-05 (Live Verification: Database Primary Storage)  
**Дата тестирования:** 2026-07-15  
**Тестировщик:** QA Role (Independent Verification)  
**Версия инструмента:** Claude Code (Haiku 4.5)

---

## STATUS: FAIL

Verification **не пройдена**. Реализация Steps 01-04 содержит архитектурно-правильный код на уровне статического анализа, однако **невозможно подтвердить работоспособность на свежей БД** из-за критических инфраструктурных блокировок.

---

## РЕЗЮМЕ РЕЗУЛЬТАТОВ

| Проверка | Статус | Деталь |
|---|---|---|
| **Код: database-primary load** | ✓ PASS | loadWorkspace() вызывает БД первой |
| **Код: database-primary save** | ✓ PASS | saveWorkspace() вызывает БД первой |
| **Код: fallback strategy** | ✓ PASS | readLocalWorkspaceForFallback() реализована |
| **Код: ephemeral state** | ✓ PASS | readLocalEphemeralState(), writeLocalEphemeralState() |
| **Код: SYNC_PENDING_KEY** | ✓ PASS | Полностью удалена из кода |
| **Инфра: PostgreSQL** | ✓ PASS | Запущена, миграции применены |
| **Инфра: Dev server** | ✓ PASS | Запускается после исправления Prisma |
| **Инфра: Prisma connection** | ⚠ PARTIAL | Требовалось NODE_OPTIONS для IPv4 |
| **Функциональность: Создание книг** | ✗ FAIL | API требует аутентификации, E2E тесты не настроены |
| **Функциональность: Persistence** | ✗ FAIL | Невозможно протестировать (нет аутентификации в тестах) |
| **Функциональность: Offline fallback** | ✗ FAIL | Невозможно протестировать (API не работает без auth) |
| **Build: npm run build** | ✗ FAIL | TypeScript error в billing/route.ts (План schema) |
| **Build: npm run dev** | ⚠ PARTIAL | Работает с NODE_OPTIONS=--dns-result-order=ipv4first |
| **E2E: 19 tests** | ✗ FAIL | 4 passed, 15 failed (timeout, auth required) |

---

## ДЕТАЛЬНЫЕ РЕЗУЛЬТАТЫ

### ✓ TEST 1: Static Code Analysis (workspaceStorage.ts)

**Проверка:** Реализация database-primary архитектуры на уровне кода

**loadWorkspace():**
```typescript
export async function loadWorkspace(): Promise<Workspace> {
  const ephemeralState = readLocalEphemeralState();
  const dbBooks = await fetchBooksFromApi();  // ✓ Database first
  
  if (dbBooks === null) {
    return readLocalWorkspaceForFallback();  // ✓ Fallback to localStorage
  }
  
  // Return books from database
}
```
**Статус:** ✓ PASS  
**Вывод:** loadWorkspace() правильно реализована как database-first с fallback

**saveWorkspace():**
```typescript
export async function saveWorkspace(workspace: Workspace): Promise<void> {
  const pushed = await pushBooksToApi(workspace.books);  // ✓ Database first
  
  if (pushed) {
    writeLocalEphemeralState(workspace);  // ✓ Ephemeral only
  } else {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(workspace));  // ✓ Fallback
  }
}
```
**Статус:** ✓ PASS  
**Вывод:** saveWorkspace() правильно реализована как database-first с fallback

**Fallback Strategy (Option B):**
```typescript
function readLocalWorkspaceForFallback(): Workspace {
  // Читает из localStorage при недоступности БД
  // ADR-0017 Decision 2: hybrid fallback
}

function readLocalEphemeralState(): EphemeralState {
  // ТОЛЬКО activeBookId, selectedChapterId, selectedSceneId
}

function writeLocalEphemeralState(workspace: Workspace): void {
  // ТОЛЬКО ephemeral fields, никогда не пишет books
}
```
**Статус:** ✓ PASS  
**Вывод:** Fallback стратегия правильно отделяет ephemeral state от данных книг

---

### ✓ TEST 2: SYNC_PENDING_KEY Removal

**Проверка:** Полное удаление логики SYNC_PENDING_KEY из Step-03

```bash
$ grep -n "SYNC_PENDING_KEY" apps/studio/src/storage/workspaceStorage.ts
19:// and sets syncStatus='offline' for UI signaling. SYNC_PENDING_KEY workaround
```

**Результат:** 
- ✓ Нет константы `const SYNC_PENDING_KEY`
- ✓ Нет функции `readSyncPendingFlag()`
- ✓ Нет функции `writeSyncPendingFlag()`
- ✓ Найдено только в комментарии (документация о том, что было удалено)

**Статус:** ✓ PASS  
**Вывод:** SYNC_PENDING_KEY полностью удалена из активного кода

---

### ✓ TEST 3: useWorkspaceController Integration (Step-04)

**Проверка:** Адаптация контроллера для async load/save

```typescript
// Restore Effect - ждёт async loadWorkspace()
useEffect(() => {
  let cancelled = false;
  void (async () => {
    const restored = await loadWorkspace();  // ✓ async
    if (cancelled) return;
    setWorkspace(restored);
    setSyncWarning(getSyncWarning());  // ✓ Sync with modular signal
  })();
  return () => { cancelled = true; };
}, []);

// Persist Effect - ждёт async saveWorkspace()
useEffect(() => {
  if (!isLoaded) return;
  saveWorkspace(workspace)  // ✓ async
    .catch(() => {})
    .finally(() => setSyncWarning(getSyncWarning()));  // ✓ Update warning
}, [workspace, isLoaded]);
```

**Статус:** ✓ PASS  
**Вывод:** Контроллер правильно адаптирован для database-primary архитектуры

---

### ✗ TEST 4: Fresh Database Persistence

**Проверка:** Создание данных → перезагрузка → данные вернулись из БД

**Сценарий:**
1. Fresh PostgreSQL: ✓ setup via docker-compose
2. Миграции: ✓ npx prisma migrate deploy (7 migrations)
3. Dev server: ✓ запущен на localhost:3000
4. Создать книгу: ✗ **BLOCKED** — требуется аутентификация

**Проблема:**
```
GET /api/workspace
401 Unauthorized: Missing authentication token
```

**Почему не может быть протестировано:**
- API требует JWT token
- E2E тесты не настроены на login
- Нет test user с валидным паролем для автоматизации

**Статус:** ✗ FAIL  
**Вывод:** Функциональное тестирование невозможно без фиксинга E2E тестов

---

### ✗ TEST 5: Offline Fallback Mode

**Проверка:** При отключении БД → fallback на localStorage, синхронизация на reconnection

**Предусловие:** Нужны данные в БД (см. TEST 4 — невозможно создать)

**Статус:** ✗ FAIL (зависит от TEST 4)  
**Вывод:** Невозможно протестировать без данных в БД

---

### ✗ TEST 6: E2E Tests (smoke.spec.ts)

**Запуск:** `npm run test:e2e`

**Результаты:**
```
Running 19 tests using 8 workers

✓ 4 passed:
  - страница загружается, Header виден
  - пустое состояние: нет книг, кнопка '+ Новая книга' видна
  - scrollbar-gutter stable (2 tests)

✗ 15 failed:
  - CRUD операции (создание книги, главы, сцены)
  - Редактирование текста
  - Навигация
  - Persistence на перезагрузке
  - Dark mode verification (5 tests)
```

**Причины падений:**

1. **Timeout 30s (CRUD operations):**
```
Error: Test timeout of 30000ms exceeded.
Test: создание книги через диалог
At: await page.getByPlaceholder("Введите название...").fill("...")
```
Причина: Диалог создания книги не появляется. Возможно, требуется аутентификация перед открытием диалога.

2. **Connection refused (dark-mode tests):**
```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3456/
```
Причина: Тесты пытаются подключиться к порту 3456 вместо 3000. Конфигурация плейврайта неверная.

**Статус:** ✗ FAIL  
**Вывод:** E2E тесты требуют переконфигурации для работы с аутентификацией

---

### ✗ TEST 7: Production Build

**Команда:** `npm run build`

**Результат:**
```
Failed to type check.

./src/app/api/billing/route.ts:203:7
Type error: Type '{ name: string; tier: "free" | "premium" | "pro"; ... }' 
is not assignable to type 'PlanCreateInput'.
  Missing properties: id, updatedAt
```

**Причина:** Prisma schema для План model требует id и updatedAt при создании, но они не имеют @default

```prisma
model Plan {
  id                   String             @id                    // ← No @default(cuid())
  updatedAt            DateTime           // ← No @updatedAt
  ...
}
```

**Требуется исправление:**
```prisma
id        String      @id @default(cuid())
updatedAt DateTime    @updatedAt
```

**Статус:** ✗ FAIL  
**Блокирует:** Production deployment  
**Вывод:** Pre-existing schema bug не связан с Sprint-37 changes, но блокирует Step-05 verification

---

### ⚠ TEST 8: Infrastructure - Prisma Connection Issue

**Проблема обнаружена:** На первом запуске dev server

```
Error: connect EACCES ::1:5432
```

**Причина:** Node.js пытается IPv6 localhost (::1) вместо IPv4 (127.0.0.1)

**Решение:** NODE_OPTIONS для приоритизации IPv4

```bash
NODE_OPTIONS=--dns-result-order=ipv4first npm run dev
```

**Статус после исправления:** ✓ DEV SERVER WORKS

**Вывод:** Инфраструктурная проблема, требует документирования в DEVELOPMENT_WORKFLOW.md

---

## DATABASE VERIFICATION

### Миграции:
```
✓ All 7 migrations applied:
  - 20260710202615_init (Book, Chapter, Scene, etc.)
  - 20260711091023_add_assistant_settings
  - 20260711231223_add_series
  - 20260712102214_add_auth_fields
  - 20260712103411_add_billing
  - 20260712133224_add_event_logging
  - 20260712194659_add_book_soft_delete
```

### Состояние после setup:
```
Database: literary_studio (PostgreSQL 16.14)
Tables created: 16
Books: 0 (fresh)
Chapters: 0 (fresh)
Scenes: 0 (fresh)
Users: 1 (test user)
```

### Проверка soft delete:
```
Book model:
  deletedAt DateTime?  ✓ Поле существует
  
Query filter for deleted books:
  WHERE "deletedAt" IS NULL  ✓ Работает
```

---

## ЧТО РАБОТАЕТ (на уровне кода)

1. **Database-first loadWorkspace()** — правильно реализована
2. **Database-first saveWorkspace()** — правильно реализована
3. **Fallback to localStorage** — правильно реализована
4. **Ephemeral state separation** — правильно реализована
5. **SYNC_PENDING_KEY removal** — полностью выполнена
6. **useWorkspaceController async integration** — правильно адаптирована
7. **Soft delete integration** — schema и logic present

---

## ЧТО НЕ РАБОТАЕТ (инфраструктура)

1. **E2E тесты не настроены на аутентификацию** — требуется фиксинг тестов
2. **Prisma connection требует NODE_OPTIONS** — документирование необходимо
3. **Production build не компилируется** — TypeScript ошибка в billing (pre-existing)
4. **Playwright тесты пытаются порт 3456 вместо 3000** — конфигурация неверная

---

## ИЗВЕСТНЫЕ ПРОБЛЕМЫ

### CRITICAL: Plan Schema Error
**Блокирует:** `npm run build`  
**Локация:** `prisma/schema.prisma`  
**Решение:** Добавить @default для id и @updatedAt для updatedAt  
**Приоритет:** Critical (blocking production)  
**Связано с Sprint-37:** Нет (pre-existing)

### CRITICAL: E2E Tests Authentication
**Блокирует:** Функциональное тестирование database-primary  
**Локация:** `e2e/smoke.spec.ts`, `e2e/dark-mode-verification.spec.ts`  
**Решение:** Добавить login перед CRUD тестами или использовать test token  
**Приоритет:** High (blocking verification)  
**Связано с Sprint-37:** Косвенно (API теперь требует auth)

### WARNING: Prisma IPv6 Issue
**Блокирует:** Dev server на Windows (temporary)  
**Решение:** Добавить NODE_OPTIONS в документацию  
**Приоритет:** Medium (workaround существует)

---

## РЕКОМЕНДАЦИИ

### Перед повторным тестированием Step-05:

1. **Исправить Plan schema в prisma/schema.prisma:**
   ```prisma
   model Plan {
     id        String   @id @default(cuid())
     updatedAt DateTime @updatedAt
     // остальные поля
   }
   ```
   Then: `npx prisma migrate dev --name fix_plan_schema`

2. **Обновить E2E тесты для работы с аутентификацией:**
   ```typescript
   test.beforeEach(async ({ page }) => {
     await page.goto("/");
     // Login with test credentials
     // OR set auth cookie directly
     // OR disable auth in test mode
   });
   ```

3. **Добавить в DEVELOPMENT_WORKFLOW.md:**
   ```bash
   NODE_OPTIONS=--dns-result-order=ipv4first npm run dev
   ```
   на Windows с Docker PostgreSQL

4. **Проверить playwright.config.ts:**
   ```typescript
   webServer: {
     command: "npm run dev",
     port: 3000,  // ← dark-mode tests используют 3456!
     timeout: 120000,
   }
   ```

5. **Запустить E2E тесты повторно:**
   ```bash
   npm run test:e2e
   ```

---

## ЗАКЛЮЧЕНИЕ

### Уровень кода: ✓ PASS
Реализация database-primary архитектуры в Steps 01-04 **архитектурно правильна**:
- loadWorkspace() database-first ✓
- saveWorkspace() database-first ✓
- Fallback strategy (Option B) ✓
- Ephemeral state separation ✓
- SYNC_PENDING_KEY removed ✓

### Уровень функциональности: ✗ FAIL
**Невозможно подтвердить работоспособность** на свежей БД:
- API требует аутентификации (правильное поведение)
- E2E тесты не настроены для работы с auth
- Production build не компилируется (pre-existing)

### Рекомендация: 
**Step-05 может быть завершена ТОЛЬКО ПОСЛЕ:**
1. Исправления Plan schema
2. Переконфигурации E2E тестов
3. Повторного тестирования с полной функциональностью

**Текущий статус:** Non-shippable (инфраструктурные блокировки)

---

## NEXT STEPS

1. **Backlog Issue:** Create Step Card для исправления Plan schema и E2E тестов
2. **Documentation:** Обновить DEVELOPMENT_WORKFLOW.md с NODE_OPTIONS инструкцией
3. **Re-test:** После исправлений переити к повторному тестированию Step-05
4. **Review:** Отправить architect-reviewer для финального одобрения

---

**Дата отчёта:** 2026-07-15  
**Статус:** FAIL — требуется исправление инфраструктурных проблем  
**Версия:** Test Report v1 (Initial Verification)
