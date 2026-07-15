# ARP: Sprint-37-DB-Primary-Step-03

**Дата завершения:** 2026-07-15  
**Статус:** Завершено, ожидает `STATUS: OK`  
**Исполнитель:** Claude Code (Haiku 4.5)

---

## Что сделано

Произведена полная рефакторизация `apps/studio/src/storage/workspaceStorage.ts` для реализации архитектуры ADR-0017 (database-primary). Ключевые изменения:

### 1. **Переворот логики loadWorkspace() (database-first)**

**Было (ADR-0012 dual-mode):**
- Читали localStorage ПЕРВЫМ
- Асинхронно опрашивали БД
- Если БД пуста → возвращали localStorage (миграция)
- Если БД не пуста → возвращали БД, но с SYNC_PENDING_KEY workaround для race conditions

**Стало (ADR-0017 database-primary):**
- Читаем ephemeral UI state из localStorage (activeBookId, selectedChapterId, etc.)
- Читаем books из БД через fetchBooksFromApi()
- Если БД недоступна (null) → fallback на localStorage с полным workspace'ом (ADR-0017 Decision 2: hybrid fallback)
- Если БД не пуста → возвращаем books из БД + ephemeral state из localStorage
- Если БД пуста, но localStorage есть books → попытка migration push в БД

**Результат:** Упрощённая логика без race conditions, database становится primary source of truth.

### 2. **Переворот логики saveWorkspace() (database-primary)**

**Было (ADR-0012 dual-mode):**
- Писали в localStorage ПЕРВЫМ (synchronously)
- Затем асинхронно PUT в БД
- Маркировали флаг SYNC_PENDING_KEY перед push'ем
- На успех — очищали флаг

**Стало (ADR-0017 database-primary):**
- Пишем в БД ПЕРВЫМ через pushBooksToApi()
- На успех → писем только ephemeral state в localStorage (через writeLocalEphemeralState())
- На ошибку БД → fallback на полный workspace в localStorage, syncWarning = "db-unavailable" для UI

**Результат:** UI слой получает чёткий сигнал об offline-режиме, пользователь может работать с fallback'ом.

### 3. **Удаление SYNC_PENDING_KEY и related логики**

- Удалена константа `SYNC_PENDING_KEY`
- Удалены функции `readSyncPendingFlag()`, `writeSyncPendingFlag()`
- Удалена логика reconciliation push в loadWorkspace() (больше не нужна, DB primary)
- Упрощён тип `SyncWarning` с двух случаев ("db-unavailable" | "recovered-local-wins") до одного ("db-unavailable")
- Упрощена функция `getSyncWarning()` — теперь просто возвращает текущее значение, без one-shot логики

**Обоснование:** Database-first логика исключает race condition, который требовал SYNC_PENDING_KEY. Если DB недоступна при save'е, мы пишем в localStorage и ставим флаг. При reconnect, next save retry'т DB.

### 4. **Новые функции для ephemeral state**

**Экспортированы:**
- `readLocalEphemeralState()` — читает ТОЛЬКО activeBookId, selectedChapterId, selectedSceneId, selectedCharacterId, selectedAssistantMode из localStorage (EPHEMERAL_STATE_KEY)
- `writeLocalEphemeralState()` — пишет ТОЛЬКО эти fields в localStorage, никогда не пишет books/series

**Использование:**
- loadWorkspace() вызывает readLocalEphemeralState() один раз для merging с DB books
- saveWorkspace() вызывает writeLocalEphemeralState() только на успех DB write

**Результат:** Чёткое разделение: books/series в БД, ephemeral UI state в localStorage, никогда не путаются.

### 5. **Новая функция readLocalWorkspaceForFallback()**

- Читает старый STORAGE_KEY формат (миграция)
- Выполняет migrateIfNeeded() для обратной совместимости
- Merges с readLocalEphemeralState() из EPHEMERAL_STATE_KEY
- Используется только как fallback при недоступности БД

**Результат:** Гарантирует, что на fallback'е пользователь получает полный workspace с актуальным ephemeral state.

---

## Соответствие Scope

Step Card требовал (docs/task-bus/queue/active/Sprint-37-DB-Primary-Step-03.md):

| Требование | Статус | Примечание |
|---|---|---|
| Allowed paths: workspaceStorage.ts | ✓ Соблюдено | Только этот файл модифицирован |
| Forbidden paths: useWorkspaceController, repositories, UI компоненты | ✓ Соблюдено | Ни один не трогался |
| Refactor loadWorkspace() для database-primary | ✓ Выполнено | DB-first с ephemeral из localStorage |
| Refactor saveWorkspace() для database-primary | ✓ Выполнено | DB-first с fallback на localStorage |
| Split ephemeral state (readLocal/writeLocal functions) | ✓ Выполнено | Две экспортируемые функции для UI state |
| Remove SYNC_PENDING_KEY | ✓ Выполнено | Полностью удалены все упоминания |
| Упростить SyncWarning | ✓ Выполнено | Теперь только "db-unavailable" |
| Comments о fallback strategy | ✓ Выполнено | Документировано в loadWorkspace(), saveWorkspace() |
| TypeScript чисто | ✓ Выполнено | npx tsc --noEmit pass (no errors in workspaceStorage) |
| ESLint чисто | ✓ Выполнено | npx eslint workspaceStorage.ts pass |
| Prettier чисто | ✓ Выполнено | npx prettier --check workspaceStorage.ts pass |

---

## Validation

### 1. TypeScript

```bash
cd apps/studio && npx tsc --noEmit
# Результат: ✓ Нет ошибок в workspaceStorage.ts
```

(Есть pre-existing ошибки в других файлах, но они не из Scope Step Card)

### 2. ESLint

```bash
cd apps/studio && npx eslint src/storage/workspaceStorage.ts
# Результат: ✓ Pass
```

### 3. Prettier

```bash
cd apps/studio && npx prettier --check src/storage/workspaceStorage.ts
# Результат: ✓ Pass (после --write)
```

### 4. Logic Verification

Создана test-script с 6 сценариями, все passed:
- **Scenario 1:** Database has books → merge with ephemeral state ✓
- **Scenario 2:** Database unavailable → fallback to localStorage ✓
- **Scenario 3:** saveWorkspace succeeds → write only ephemeral state ✓
- **Scenario 4:** saveWorkspace fails → write full workspace to localStorage, set syncWarning ✓
- **Scenario 5:** Database empty, migrate from localStorage ✓
- **Scenario 6:** readLocalEphemeralState validation (type checking, defaults) ✓

### 5. git status

```bash
git status --short
# Результат: M  apps/studio/src/storage/workspaceStorage.ts
```

Только разрешённый файл изменён.

### 6. Backward Compatibility

- readLocalWorkspaceForFallback() сохраняет поддержку старого STORAGE_KEY формата
- migrateIfNeeded() продолжает работать для legacy data
- API контроллера (loadWorkspace(), saveWorkspace(), getSyncWarning()) остаёт неизменённым
- useWorkspaceController.ts не требует изменений (controller по-прежнему вызывает те же функции)

---

## Отклонения от Step Card

**Нет отклонений.**

- Fallback strategy (ADR-0017 Decision 2: hybrid) выбран согласно Step-01 ARP
- Все требуемые функции экспортированы и прокомментированы
- Все SYNC_PENDING_KEY логика удалена полностью
- Комментарии объясняют database-primary парадигму

---

## Дополнительные замечания

### 1. **Интеграция с useWorkspaceController.ts**

Контроллер по-прежнему вызывает `loadWorkspace()`, `saveWorkspace()`, `getSyncWarning()` — interface остаётся идентичным. No breaking changes.

### 2. **SyncStatusBanner (Step-04)**

Контроллер читает `getSyncWarning()` и отражает статус в React state. На этом шаге:
- Если syncWarning = "db-unavailable" → SyncStatusBanner покажет offline-режим
- Когда БД восстановится → следующий успешный API call очистит syncWarning

### 3. **Миграция с Step-01 (batch load)**

loadWorkspace() обрабатывает три сценария:
1. **dbBooks is array of objects** → используем их (normal operation)
2. **dbBooks is empty array** → проверяем localStorage на old data, attempt migration push
3. **dbBooks is null (DB unavailable)** → fallback полностью на localStorage

### 4. **Consistency с ADR-0017 Decision 2**

Hybrid fallback (Option B) имеет три слоя защиты:
1. **Success path:** Database write succeeds → full sync
2. **Partial failure:** Database write fails → fallback localStorage, online mode continues trying
3. **Total recovery:** On reconnect, next saveWorkspace() attempts DB again

---

## Stop Condition

✓ Рефакторизация workspaceStorage.ts завершена.  
✓ loadWorkspace() — database-first с ephemeral state merge.  
✓ saveWorkspace() — database-first с localStorage fallback.  
✓ Ephemeral state функции экспортированы (readLocalEphemeralState, writeLocalEphemeralState).  
✓ SYNC_PENDING_KEY и all related logic полностью удалены.  
✓ SyncWarning упрощён до одного состояния ("db-unavailable").  
✓ TypeScript, ESLint, Prettier — все pass.  
✓ Logic verification — все 6 сценариев passed.  
✓ git status — только разрешённый файл.  

**Не коммичено и не запушено.** Ожидает `STATUS: OK` от Product Owner или architect-reviewer перед commitment в main.

---

## Резюме

**Sprint-37-DB-Primary-Step-03** завершена: `workspaceStorage.ts` полностью рефакторирована для реализации database-primary архитектуры (ADR-0017). Ключевые результаты:

1. **loadWorkspace()**: DB-first + ephemeral state merge + localStorage fallback
2. **saveWorkspace()**: DB-first с conditional ephemeral write + localStorage fallback on error
3. **Ephemeral state functions**: readLocalEphemeralState(), writeLocalEphemeralState() exported
4. **SYNC_PENDING_KEY**: Полностью удалён (больше не нужен)
5. **SyncWarning**: Упрощён до "db-unavailable"

Логика валидирована на 6 сценариях, TypeScript/ESLint/Prettier passed. Ready for Step-04 (controller refactor) и Step-05+ (UI integration).
