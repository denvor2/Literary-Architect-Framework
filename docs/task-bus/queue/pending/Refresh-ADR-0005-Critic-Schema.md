id: Refresh-ADR-0005-Critic-Schema
name: "Ревизия ADR-0005 (Critic): актуализировать схему запроса и подкатегории"
type: architecture

## Scope

Allowed paths:
- `docs/adr/ADR-0005-critic-expert-contract.md`

Forbidden paths:
- всё остальное — только этот один ADR-файл, чисто документальная правка.

## Objective

ADR-0005 всё ещё описывает Critic по состоянию на Sprint 08 (`{ text: string }` запрос,
никаких упоминаний `bookLanguage` или тематических подкатегорий) — три реальных изменения с тех
пор так и не были в него занесены:

1. **Sprint 13 Step 02** — `text` переименован в `sceneText`, добавлено обязательное поле
   `messages: ChatMessage[]` (см. `apps/studio/src/app/api/critic/route.ts` — читай реальный
   код, не только этот Step Card).
2. **Sprint 15 Step 01** — опциональное поле `bookLanguage` (язык `comment`-полей, не всей
   схемы — `category`/`severity` остаются английским enum).
3. **Sprint 19** — опциональное поле `subcategory` (тематические подкатегории — continuity/
   fact/developmental/style), см. ADR-0009 и текущий код `route.ts`.

Тот же принцип ревизии, что уже применён в ADR-0004 (revision под `bookContext`/Sprint 13
gap) и ADR-0006 (revision под `persona`/multiple instances) — секция-дополнение в конец файла,
не переписывание существующего Decision текста. Прочитай обе как образец формата и тона перед
тем, как писать свою.

## Rules

- Не переписывай существующие секции Decision/Consequences — только добавь Revision-секцию(и)
  в конец, как это сделано в ADR-0004/0006.
- Свежую форму запроса бери из реального кода (`apps/studio/src/app/api/critic/route.ts`,
  `apps/studio/src/ai/operations.ts`), не из старых Step Card'ов — они могли устареть.
- Обнови таблицу-подобные утверждения ("two ratified members... one shared request shape") если
  они больше не точны после этой ревизии.

## Validation

- `grep -n "sceneText\|bookLanguage\|subcategory" docs/adr/ADR-0005-critic-expert-contract.md`
  → находит все три после правки (сейчас — 0).
- Живая проверка не требуется (чисто документальная задача, код не меняется) — вместо неё:
  свериться построчно с реальным `route.ts`, чтобы описанная схема была дословно точной, не
  предполагаемой.

## Output

ARP файлом в `docs/task-bus/queue/active/` + в чат.

## Stop Condition

Не коммитить без подтверждения Product Owner. (Это smoke-test самого `step-executor`
сабагента — обычный цикл ARP → ревью применяется без исключений.)
