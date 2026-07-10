id: Sprint-24-Step-05
name: "workspaceStorage.ts — dual-mode (БД первична, localStorage — fallback и бэкап) + разовый перенос существующих данных"
type: implementation

## Контекст

По ADR-0012 (Sprint-24-Step-01): в БД уходит только books, эфемерное UI-состояние
(activeBookId/selectedChapterId/selectedSceneId/selectedCharacterId/selectedAssistantMode)
остаётся только в localStorage, как сегодня. Обнаружение недоступности БД — при каждой
попытке чтения/записи (не только на старте сессии), при неудаче — тихий fallback на
localStorage без очереди повторных попыток; при рассинхроне — последняя успешная запись
перезаписывает БД целиком.

## Scope

Allowed paths:
- apps/studio/src/storage/workspaceStorage.ts

Forbidden paths:
- apps/studio/src/workspace/useWorkspaceController.ts (подключает результат этого шага в
  Sprint-24-Step-06, не раньше)
- apps/studio/src/repositories/**, apps/studio/src/app/api/** (использовать HTTP-контракт
  Step 04 как есть, не менять)
- любой UI-код

## Objective

loadWorkspace()/saveWorkspace() становятся асинхронными (Promise), сохраняя сегодняшний
внешний смысл (полная загрузка/сохранение Workspace), с новой внутренней логикой:

loadWorkspace():
1. Всегда сначала читает localStorage (как сегодня) — источник эфемерного UI-состояния,
   которое никогда не уходит в БД.
2. Пытается получить books через GET /api/workspace.
   - Успех, БД непуста -> books из БД замещают books из localStorage; остальные
     (эфемерные) поля — из localStorage, как в п.1.
   - Успех, БД пуста, а в localStorage есть непустой books -> разовый перенос: PUT
     /api/workspace с текущим books из localStorage (см. "Разовый перенос" ниже), после
     успешной записи — работать так, будто БД только что вернула эти же данные.
   - Ошибка запроса (сеть/БД недоступна, fetch бросает или API вернул ok:false/5xx) ->
     fallback: books берутся из localStorage целиком, как сегодня, без исключения наружу.
3. Итоговый Workspace — та же форма, что и сегодня (migrateIfNeeded/normalizeBook
   по-прежнему применяются к результату независимо от источника books).

saveWorkspace(workspace):
1. Всегда синхронно пишет полный workspace (включая эфемерные поля) в localStorage — точно
   как сегодня, без изменений в этой части (буквально выполняет "localStorage остаётся как
   fallback" из Definition of Done, без деградации сегодняшнего поведения).
2. Дополнительно, best-effort, отправляет PUT /api/workspace с { books: workspace.books }.
   Неудача — не бросать исключение наружу, не блокировать вызывающий код (localStorage уже
   записан к этому моменту; следующая успешная запись перезапишет БД целиком).

Разовый перенос: реализовать как часть loadWorkspace() (см. выше), НЕ отдельным CLI/npm-
скриптом — по ADR-0012, отдельный scripts/migrate-localStorage-to-db.ts нереализуем без
браузерного контекста и функции экспорта, которой в проекте нет и которая явно вне рамок.

## Rules

- Обе функции меняют сигнатуру на асинхронную — осознанное изменение публичного контракта
  модуля. Единственный вызывающий код (useWorkspaceController.ts) НЕ обновляется в этом шаге
  (это Sprint-24-Step-06) — значит npm run build ожидаемо падает на useWorkspaceController.ts
  после этого шага; описать это явно в ARP, тот же приём, что в Sprint-11/13 для аналогичных
  промежуточных состояний. Сам workspaceStorage.ts должен компилироваться внутренне
  непротиворечиво.
- Не менять migrateIfNeeded/normalizeBook/normalizeAssistantThreads по существу — они
  по-прежнему применяются к результату, только оборачиваются в новую асинхронную логику
  получения books.

## Validation

- npx tsc --noEmit, npm run lint, npx prettier --check на workspaceStorage.ts — чисто.
  npm run build ожидаемо падает на useWorkspaceController.ts — описать явно в ARP, чей это
  конфликт и почему ожидаемо (Step 06 ещё не выполнен).
- Живая проверка (реальный сервер apps/studio + реальная БД, docker compose up postgres):
  1. БД пуста, localStorage содержит книгу (задать вручную через DevTools
     localStorage.setItem) -> после loadWorkspace() БД получает эту книгу (проверить через
     psql/prisma studio); повторный loadWorkspace() не переносит повторно (нет дублей).
  2. БД содержит книгу, отличную от localStorage -> после loadWorkspace() результат — книга
     из БД, не из localStorage.
  3. Остановить контейнер postgres (docker compose stop postgres) -> loadWorkspace() не
     бросает исключение, отдаёт данные из localStorage; saveWorkspace() не бросает
     исключение, localStorage обновляется. Запустить postgres обратно -> следующий
     saveWorkspace() успешно долетает до БД.
- Приложить в ARP реальные логи/выводы каждого сценария, не описание "должно работать".

## Output

ARP файлом в docs/task-bus/queue/active/ + в чат.

## Stop Condition

Не коммитить без подтверждения Product Owner.
