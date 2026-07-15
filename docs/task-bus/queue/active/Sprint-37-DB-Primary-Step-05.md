id: Sprint-37-DB-Primary-Step-05
name: "Live Verification: Database Primary Storage (No Data Loss)"
type: verification

## Контекст

Step-01 через Step-04 реализовали database-primary архитектуру: loadWorkspace() теперь читает БД первой, SYNC_PENDING_KEY удалён, workspaceStorage и useWorkspaceController обновлены.

Step-05 — **обязательная live verification**, как в Sprint 24-Step-06, Sprint 29-Step-06, Sprint 30-Step-05. Нет Step-05 = нет гарантии что refactor работает на реальной БД и реальном пользователе.

## Scope

Allowed paths:
- Всё приложение: apps/studio/
- Локальный dev server с реальной PostgreSQL БД
- Playwright e2e tests (если нужны новые для DB-primary)

Forbidden paths:
- Не добавлять новые Step Cards в этом шаге
- Не менять архитектуру (она уже решена в Step-01)
- Не коммитить bug fixes (они идут в отдельные Step Cards если найдены)

## Объектив

**Убедиться что:**

1. **Приложение запускается без ошибок:**
   - `npm run dev` — dev server starts
   - `npm run build` — production build succeeds
   - No console errors on app load

2. **Данные не потеряны:**
   - Создать несколько книг (тест на свежей БД)
   - Добавить главы, сцены, персонажей, идеи
   - Всё сохранилось в БД (проверить psql)
   - Перезагрузить страницу → данные вернулись из БД
   - Добавить ещё одну сцену → сохранилось

3. **localStorage работает только для ephemeral:**
   - activeBookId, selectedChapterId, selectedSceneId остаются в localStorage
   - Перезагрузить → UI восстановит scroll position и selection
   - Но books всегда из БД

4. **Fallback strategy работает:**
   - Если fallback=error (Step-01): выключить DB и убедиться что ошибка показывается
   - Если fallback=hybrid: выключить DB и убедиться что app работает с пустыми books (если нужно)

5. **Multi-user scenario (если пока не critical):**
   - Два пользователя в разных браузерах/tabs
   - User A создаёт книгу → User B перезагружает → видит книгу User A? (зависит от БД design)

6. **Trash/Deleted books:**
   - Soft delete книги → удаляется из main list
   - Restore из trash → возвращается
   - БД query фильтрует deletedAt correctly

7. **Performance ощущается нормально:**
   - Загрузка 5-10 книг с главами/сценами не должна быть заметно медленнее

8. **No errors in Playwright e2e tests:**
   - `npm run test:e2e` — все существующие тесты pass
   - Добавить новый test для database-primary workflow если нужно

## Rules

1. **Процесс verification:**
   - Step-executor запускает dev server на свежей БД
   - Вручную создаёт/тестирует data (как в Sprint 24-Step-06)
   - Проверяет логи (browser console, server console)
   - Запускает e2e tests
   - Документирует результаты в ARP

2. **Что фиксить, что не фиксить:**
   - Ошибки в логике Step-03/04: фиксить на месте, создать новый коммит
   - Ошибки не в scope (другие компоненты): отметить в ARP как "known issue"
   - UI/design проблемы: отметить в ARP, не фиксить

3. **Если найдены data loss bugs:**
   - Это CRITICAL: остановить, не коммитить
   - Вернуться к Step-03/04 и фиксить
   - Потом перезапустить Step-05

## Validation

Для Step-executor:

1. **Dev server запустился:**
   ```bash
   cd apps/studio
   npm run dev
   # Verify: http://localhost:3000 loads, no console errors
   ```

2. **Fresh DB setup:**
   ```bash
   # Убедиться что БД свежая (например, prisma migrate reset --force)
   npx prisma migrate reset --force
   ```

3. **Manual test workflow:**
   - Создать 3 книги (3 separate create book actions)
   - Добавить главы и сцены в каждую
   - Добавить персонажа к каждой
   - Добавить идеи
   - Запустить AI операцию (Line Editor, Critic, etc.) на одной сцене
   - Убедиться что messages saved

4. **Data persistence check:**
   - Перезагрузить страницу (browser refresh F5)
   - Все данные должны вернуться из БД
   - Не должно быть "recovered from localStorage" сообщения

5. **Database verification (psql):**
   ```bash
   psql -U <user> -d literary_studio -c "SELECT COUNT(*) FROM book WHERE userId = '<test-user-id>';"
   # Должно быть 3 книги
   ```

6. **E2E tests:**
   ```bash
   npm run test:e2e
   # Все 12 тестов должны pass
   ```

7. **Build test:**
   ```bash
   npm run build
   # Должен быть success, no TypeScript errors
   ```

## Output

ARP файл в docs/task-bus/queue/active/ с:

1. **Summary:** "Успешно протестировано на fresh DB с 3 книгами, no data loss, all e2e tests pass"

2. **Test Results:**
   - Загрузка приложения: ✓
   - Создание данных: ✓ (books, chapters, scenes, characters, ideas)
   - Перезагрузка страницы: ✓ (данные вернулись из БД)
   - AI операции: ✓ (например, Line Editor request + messages saved)
   - Trash/Restore: ✓ (soft delete/restore work correctly)
   - E2E tests: ✓ (all tests pass)
   - Build: ✓ (production build succeeds)

3. **Database state (psql output):**
   - COUNT(*) FROM book
   - COUNT(*) FROM chapter
   - COUNT(*) FROM scene
   - Примерные цифры

4. **Known issues (если есть):**
   - Перечислить что НЕ работает или требует внимания
   - Переслать это в отдельные Step Cards если нужно

5. **Performance observations:**
   - Время загрузки приложения
   - Время сохранения книги
   - Субъективные ощущения

## Stop Condition

Не коммитить без подтверждения Product Owner.

---

## Примечание: Результаты Verification

После завершения Step-05, если все проверки пройдены:
- Архивировать все 5 Step Cards в done/
- Обновить docs/project/CURRENT_SPRINT.md для Sprint-37 closeout
- Синхронизировать docs/project/PROJECT_STATE.md
