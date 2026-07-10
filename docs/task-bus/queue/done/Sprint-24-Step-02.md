id: Sprint-24-Step-02
name: "Домен: глобально уникальные id для Chapter/Scene/Character/Idea/AssistantThread"
type: refactor

## Контекст

Обязательная предпосылка перед repository-слоем (Sprint-24-Step-03) — см. вопрос 4
ADR-0012 (Sprint-24-Step-01). Chapter/Scene/Character/Idea/AssistantThread id сегодня
генерируются как String(nextNumber), локально в пределах одной книги/главы/роли: у первой
главы ЛЮБОЙ книги id "1"; у первой сцены ЛЮБОЙ главы id "1". Prisma-схема требует глобально
уникального @id на каждой из этих таблиц (не составного ключа с bookId) — без исправления
первая же попытка сохранить вторую книгу в БД упадёт на конфликте первичного ключа.

## Scope

Allowed paths:
- apps/studio/src/workspace/useWorkspaceController.ts

Forbidden paths:
- apps/studio/src/domain/** (тип id остаётся string, форма Book/Chapter/Scene не меняется)
- apps/studio/src/storage/** (перенос существующих, уже сохранённых старых id — забота
  Sprint-24-Step-05, не этого шага)
- apps/studio/src/repositories/** (ещё не существует)
- apps/studio/src/app/api/**, любой UI/components/**

## Objective

Заменить генерацию id для НОВЫХ сущностей на глобально уникальные значения
(crypto.randomUUID() — доступен в браузере нативно, новая зависимость не нужна) во всех
функциях useWorkspaceController.ts, создающих Chapter/Scene/Character/Idea/AssistantThread:

- createChapter() — id новой главы
- createScene() — id новой сцены
- createCharacter() — id нового персонажа
- createIdea() — сегодня String(Date.now()); та же проблема класса (не гарантированно
  уникально глобально), заменить на ту же схему для единообразия
- createThread() — id нового диалога (сегодня String(nextNumber), локально в пределах роли
  и книги)
- acceptStructureProposal() — id новых глав/сцен, создаваемых из предложения Co-author

Book.id НЕ трогать — уже фактически уникален в пределах воркспейса (нет функции удаления
книги, счётчик только растёт) и не входит в найденную коллизию (коллизия — между РАЗНЫМИ
книгами/главами, а не внутри одной последовательности книг).

## Rules

- Форма данных не меняется — id остаётся string, только его значения выглядят иначе (UUID
  вместо маленького числа).
- Существующие, уже загруженные из localStorage книги в этом шаге не трогать — их старые
  коллизионные id перегенерируются один раз при переносе в БД (Sprint-24-Step-05), не здесь;
  этот шаг касается только сущностей, создаваемых ПОСЛЕ него.
- Immutable-паттерн — как везде в этом файле, без изменений в остальной логике функций.

## Validation

- npx tsc --noEmit, npm run lint, npx prettier --check, npm run build — чисто.
- npm run test:e2e (Playwright) — все 12 тестов зелёные (id нигде не проверяются по значению
  в тестах напрямую, но сценарии создания/поиска по id должны продолжать работать).
- Живая проверка: запустить приложение, создать две книги, в каждой создать по главе и по
  сцене; через DevTools выполнить
  JSON.parse(localStorage.getItem('literary-studio-workspace')).books.map(b=>b.chapters.map(c=>c.id))
  и убедиться, что id глав второй книги не совпадают с id глав первой книги (сегодня оба
  равны "1" — после этого шага различны). Приложить реальный вывод в ARP.

## Output

ARP файлом в docs/task-bus/queue/active/ + в чат.

## Stop Condition

Не коммитить без подтверждения Product Owner.
